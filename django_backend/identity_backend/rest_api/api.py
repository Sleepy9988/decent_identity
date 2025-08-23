from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .models import Profile, Identity, Request
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .utils import verify_with_veramo, notify_did
from .serializers import IdentitySerializer, MassDeleteSerializer, RequestListSerializer, RequestUpdateSerializer, IdentityActiveSerializer
from django.db import transaction

from .cryptographic_utils import unwrap_key_w_signature, fernet_encKey

# Import supporting Python libraries
import secrets, logging, requests, json, base64

# Logging setup for easier debugging
logger = logging.getLogger('rest_api')

# API GET endpoint to generate a random, unique nonce (login challenge)
class LoginChallengeView(APIView):
    def get(self, request, *args, **kwargs):
        challenge = secrets.token_hex(16)

        # Store the challenge in the session
        request.session['login_challenge'] = {
            'value': challenge,
            'issued': timezone.now().timestamp(), 
        }
        request.session.modified = True

        # Send challenge to the client
        return Response({'challenge': challenge}, status=status.HTTP_200_OK)
    
class RequestChallengeView(APIView): 
    def get(self, request, *args, **kwargs): 
        challenge = secrets.token_hex(16) 
        #request.session['request_challenge'] = challenge 
        request.session['request_challenge'] = {
            'value': challenge,
            'issued': timezone.now().timestamp(),
        }
        return Response({'challenge': challenge}, status=status.HTTP_200_OK)

#### potentially remove
class DIDExistsView(APIView):
    def get(self, request, *args, **kwargs):    
        did = kwargs.get('did') 
        exists = Profile.objects.filter(did=did).exists()
        return Response({'exists': exists})

# API POST endpoint to verify a Verifiable Presentation and register a new user
@method_decorator(csrf_exempt, name='dispatch')
class UserAuthenticationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Extract the verifiable presentation from the request body
        presentation = request.data.get('presentation')
        if not presentation:
            return Response({'error': 'Presentation is missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the prviously issued challenge from the session
        session_challenge = request.session.get('login_challenge')
        logger.debug(session_challenge)
        if not session_challenge:
            return Response({'error': 'Missing login challenge'}, status=status.HTTP_400_BAD_REQUEST)
        
        issued = session_challenge.get('issued')
        value = session_challenge.get('value')
        
        age = timezone.now().timestamp() - issued
        if age > 300:
            del request.session['login_challenge']
            raise ValidationError('Challenge expired')
        
        # Verify challenge 
        vp_challenge = presentation.get('challenge')
        #if not vp_challenge or vp_challenge != session_challenge:
        if not vp_challenge or vp_challenge != value:
            return Response({'error': 'Challenge mismatch'}, status=status.HTTP_400_BAD_REQUEST)
        
        try: 
            logger.debug(f'Sending to Veramo: presentation={presentation}, challenge={session_challenge}')
            payload = {
                'presentation': presentation,
                'challenge': session_challenge,
                'domain': 11155111 # Sepolia 
            }
            # Send the presentation and challenge to the Veramo backend agent for verification
            response = verify_with_veramo('verify-presentation', payload)

            logger.debug(f'Response text from Veramo: {response}')
            # Parse the response from Veramo
            verification_data = response
            logger.debug(f'Veramo response: {verification_data}')
        
        # Handle connection errors
        except requests.exceptions.RequestException as e:
            logger.error(f'Error calling Veramo service: {e}')
            return Response({'error': 'Could not connect to Veramo service'}, 
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Extract the verification result 
        is_verified = verification_data.get('verified')
        verified_did = verification_data.get('issuer')

        request.session['authenticated_did'] = verified_did

        # If verification failed or DID missing, deny the request
        if not is_verified or not verified_did:
            del request.session['login_challenge']
            logger.warning("Presentation failed or DID is missing.")
            return Response({'error': 'Presentation verification failed'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Delete the challenge from the session
            del request.session['login_challenge']
        except KeyError:
            logger.debug("Challenge already removed.")
        
        try:
            # Check if the user with this DID already exists
            profile = Profile.objects.get(did=verified_did)
            user = profile.user
            profile.save(update_fields=['latest_access'])
            logger.info(f'Existing user {user.username} authenticated successfully!')
            created = False
        
        except Profile.DoesNotExist:
            # Create a new Django user with DID as username
            user = User.objects.create_user(username=verified_did)
            user.set_unusable_password()
            user.save()
            logger.info(f'New user created: {user.username}')

            # Link Profile to User
            Profile.objects.create(user=user, did=verified_did)
            created = True

        # Issue a JWT token
        refresh = RefreshToken.for_user(user)
        refresh['did'] = verified_did

        # Send response to the client
        return Response({
            'success': True,
            'user_id': user.id, 
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'profile_created': profile.creation_date,
            'profile_last_access': profile.latest_access
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CreateCredentialView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        vc = request.data.get('credential')

        logger.debug('Incoming request data: %s', request.data)

        if not vc:
            return Response({'error': 'Missing credential'}, status=status.HTTP_400_BAD_REQUEST)
    
        try:
            result = verify_with_veramo('verify-credential', {'credential': vc})
            if not result.get('verified'):
                return Response({'success': False, 'error': 'Credential invalid'}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.exception("Credential verification with Veramo failed.")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        issuer_did = vc.get('issuer', {}).get('id')
        jwt_did = request.auth.get('did')

        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

        if issuer_did != jwt_did:
            logger.warning(f"VC issuer DID ({issuer_did}) does not match authenticated DID ({jwt_did})")
            return Response({'error': 'DID in VC does not match the authenticated DID'}, status=status.HTTP_403_FORBIDDEN)
        
        subject_data = vc.get('credentialSubject', {})

        if not isinstance(subject_data, dict) or not subject_data:
            return Response({'error': 'Incomplete credential data'}, status=status.HTTP_400_BAD_REQUEST)
        
        context = subject_data.get('context')
        description = subject_data.get('description')

        identity_fields = {k: v for k, v in subject_data.items() if k not in ('id', 'context', 'description')}
        
        try:
            user = request.user.profile
        except Profile.DoesNotExist:
            return Response({'error': 'No profile exists for authenticated user'}, status=status.HTTP_400_BAD_REQUEST)
        
        identity_data = {
            'user': user.id,
            'context': context,
            'description': description,
            'is_active': True,
            'raw_data': identity_fields,
        }

        serializer = IdentitySerializer(data=identity_data, context={'signature': signature })
        if serializer.is_valid():
            identity = serializer.save(user=user)
            return Response({'success': True, 'identity_id': identity.id})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class GetMyIdentitiesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):    
        signature = request.data.get('signature')

        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)
        did = request.user.profile.did
        ids = Identity.objects.filter(user__did=did)
        
        serializer = IdentitySerializer(ids, many=True, context={'signature': signature})
        
        return Response({'identities': serializer.data}, status=status.HTTP_200_OK)
    

@method_decorator(csrf_exempt, name='dispatch')
class UpdateIdentityActiveView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, identity_id):
        identity = get_object_or_404(Identity, id=identity_id, user=request.user.profile)

        serializer = IdentityActiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identity.is_active = serializer.validated_data['is_active']
        identity.save(update_fields=['is_active'])

        return Response(
            IdentitySerializer(identity).data,
            status=status.HTTP_200_OK
        )


class IdentityDeleteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = MassDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data['ids']

        try: 
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response({'error': 'Profile does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        el = Identity.objects.filter(user=profile, id__in=ids)
        if not el.exists():
            return Response({'error': 'No matching identities found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            el.delete()

        return Response({
            'success': True, 
            'deletion_count': len(ids),
        }, status=status.HTTP_200_OK)
    

class GetContexts(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, did, *args, **kwargs):    
        try: 
            profile = Profile.objects.get(did=did)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        contexts = ( 
            Identity.objects 
            .filter(user=profile, is_active=True) 
            .values('id', 'context') 
        )

        return Response({'contexts': list(contexts)}, status=status.HTTP_200_OK)


# API POST endpoint to verify a Verifiable Presentation and register a new user 
@method_decorator(csrf_exempt, name='dispatch') 
class CreateRequestView(APIView): 
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 
    
    def post(self, request, *args, **kwargs): 
        # Extract the verifiable presentation from the request body 
        presentation = request.data.get('presentation') 
        # Get the prviously issued challenge from the session 
        session_challenge = request.session.get('request_challenge') 

        if not session_challenge: 
            return Response({'error': 'Missing login challenge'}, status=status.HTTP_400_BAD_REQUEST)

        issued = session_challenge.get('issued')
        value = session_challenge.get('value')
        
        age = timezone.now().timestamp() - issued
        if age > 300:
            del request.session['request_challenge']
            raise ValidationError('Challenge expired')
        
        if not presentation: 
            return Response({'error': 'Presentation is missing'}, status=status.HTTP_400_BAD_REQUEST) 
         
        # Verify challenge 
        vp_challenge = presentation.get('challenge') 
        
        if not vp_challenge or vp_challenge != value: 
            return Response({'error': 'Challenge mismatch'}, status=status.HTTP_400_BAD_REQUEST) 
        
        try: 
            logger.debug(f'Sending to Veramo: presentation={presentation}, challenge={session_challenge}') 
            
            payload = { 
                'presentation': presentation, 
                'challenge': session_challenge, 
                'domain': 11155111 # Sepolia 
            }
        
            # Send the presentation and challenge to the Veramo backend agent for verification 
            response = verify_with_veramo('verify-presentation', payload) 
            logger.debug(f'Response text from Veramo: {response}') 
            
            # Parse the response from Veramo 
            verification_data = response 
            logger.debug(f'Veramo response: {verification_data}') 
            
            # Handle connection errors 
        except requests.exceptions.RequestException as e: 
            logger.error(f'Error calling Veramo service: {e}') 
            return Response({'error': 'Could not connect to Veramo service'}, status=status.HTTP_503_SERVICE_UNAVAILABLE) 
        
        # Extract the verification result 
        is_verified = verification_data.get('verified') 
        
        # If verification failed or DID missing, deny the request 
        if not is_verified: 
            del request.session['request_challenge']
            logger.warning("Presentation failed or DID is missing.") 
            return Response({'error': 'Presentation verification failed'}, status=status.HTTP_403_FORBIDDEN) 
        
        vc_list = presentation.get('verifiableCredential') or [] 
        if not vc_list: 
            return Response({'error': 'No credential in presentation'}, status=status.HTTP_400_BAD_REQUEST) 
        
        vc_str = vc_list[0] 
        vc = json.loads(vc_str) 

        types = vc.get('type', []) 

        if 'RequestCredential' not in types: 
            return Response({'error': 'Unexpected VC type'}, status=status.HTTP_400_BAD_REQUEST) 
        
        subject = vc.get('credentialSubject') or {} 
        
        requestor_did = subject.get('requestorDid') 
        holder_did = subject.get('holderDid') 
        context_id = subject.get('contextId') 
        purpose = subject.get('purpose') 
        #requestor_pubkey = subject.get('requestorPubKeyJwk')
        requestor_signature = subject.get('requestorSignature') or request.data.get('signature')
        
        if not all([requestor_did, holder_did, context_id]): 
            return Response({'error': 'Incomplete information in the credentialSubject'}, status=status.HTTP_400_BAD_REQUEST) 
        
        del request.session['request_challenge']
        
        try: 
            requestor_profile = Profile.objects.get(did=requestor_did) 
        except Profile.DoesNotExist: 
            return Response({'error': 'Requestor profile does not exist'}, status=status.HTTP_404_NOT_FOUND) 
        
        try: 
            holder_profile = Profile.objects.get(did=holder_did) 
        except Profile.DoesNotExist: 
            return Response({'error': 'Identity holder profile does not exist'}, status=status.HTTP_404_NOT_FOUND) 
        
        try: 
            identity = Identity.objects.get(id=context_id, user=holder_profile) 
        except Identity.DoesNotExist: return Response({'error': 'Requested context not found for holder'}, status=status.HTTP_404_NOT_FOUND) 
        
        req = Request.objects.create( 
            requestor = requestor_profile, 
            holder=holder_profile, 
            context=identity, 
            purpose=purpose, 
            status=Request.Status.PENDING, 
            challenge=vp_challenge, 
            presentation=vc,
            #requestor_pubkey=requestor_pubkey, 
            requestor_signature=requestor_signature,    
        ) 
        
        notify_did(holder_did, { 
            "event": "new request received", 
            "request_id": str(req.id), 
            "from": requestor_did, 
            "context": { "context": identity.context},
            "created_at": req.created_at.isoformat(), 
        }) 
        
        return Response({'success': True, 'request_id': str(req.id)}, status=status.HTTP_201_CREATED) 
    
    
class GetRequests(APIView): 
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 
    
    def get(self, request, *args, **kwargs): 
        try: 
            profile = request.user.profile 
        except Profile.DoesNotExist: 
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND) 
        
        qs = (Request.objects
                .select_related('requestor', 'holder', 'context') 
                .filter(Q(requestor=profile) | Q(holder=profile))
            )
        
        status_code = request.query_params.get('status') 
        if status_code: 
            qs = qs.filter(status=status_code) 

        total = qs.count() 

        limit = request.query_params.get('limit')
        try:
            limit = int(limit) if limit is not None else 200
        except ValueError:
            limit = 200

        page = qs.order_by('-created_at')[:limit]  
        data = RequestListSerializer(page, many=True).data   
        return Response({ 'count': total, 'results': data }, status=status.HTTP_200_OK ) 
    

class DeleteRequestView(APIView):
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 

    def delete(self, request, request_id):
        try:
            profile = request.user.profile
        except: 
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        instance = get_object_or_404(
            Request,
            id=request_id,
            requestor=profile,
            status=Request.Status.PENDING,
        )

        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
 
            
    
class UpdateRequestView(APIView): 
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 
    
    def patch(self, request, request_id): 
        logger.info(f"Update data: {request.data}")
        try: 
            req = Request.objects.get(id=request_id) 
        except Request.DoesNotExist: 
            return Response({'error': 'Request does not exist'}, status=status.HTTP_404_NOT_FOUND) 
        
        if req.holder != request.user.profile: 
            return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN) 
        
        serializer = RequestUpdateSerializer(req, data=request.data, partial=True) 
        
        if serializer.is_valid(): 
            instance = serializer.save() 
            
            notify_did(instance.requestor.did, { 
                "event": "request answer received", 
                "request_id": str(instance.id), 
                "status": instance.get_status_display(), 
                "expires_at": instance.expires_at.isoformat() 
                if instance.expires_at else None, 
                "reason": instance.reason, 
                }
            ) 
            return Response(RequestListSerializer(instance).data, status=status.HTTP_200_OK) 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class RetrieveSharedDataView(APIView):
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 

    def post(self, request, request_id):
        try:
            req = Request.objects.select_related('shared_data', 'requestor__user').get(
                id=request_id, requestor__user=request.user)
        except Request.DoesNotExist:
            return Response({'error': 'No approved request found.'}, status=status.HTTP_404_NOT_FOUND)

        if req.status != Request.Status.APPROVED:
            return Response({'error': 'Request is not approved.'}, status=status.HTTP_403_FORBIDDEN)
        
        if req.expires_at and req.expires_at <= timezone.now():
            return Response({'error': 'Access expired.'}, status=status.HTTP_403_FORBIDDEN)
        
        shared_data = getattr(req, 'shared_data', None)
        if not shared_data:
            return Response({'error': 'No shared data available for this request.'}, status=status.HTTP_404_NOT_FOUND)
        
        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            enc_key = unwrap_key_w_signature(shared_data.encKey_wrapped, signature, shared_data.wrap_salt)

            f = fernet_encKey(enc_key)
            plaintext_bytes = f.decrypt(shared_data.enc_data)
            data = json.loads(plaintext_bytes.decode('utf-8'))
        except Exception:
            return Response({'error': 'Decryption failed. Invalid signture or data.'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({'data': data}, status=status.HTTP_200_OK)