from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from django.db import IntegrityError, transaction
from django.db.models import Q

from .models import Profile, Identity, Request, SharedData

from .serializers import (
    IdentitySerializer, 
    MassDeleteSerializer, 
    RequestListSerializer, 
    RequestUpdateSerializer, 
    IdentityActiveSerializer,
    ContextSerializer
)
from .utils import verify_with_veramo, notify_did
from .cryptographic_utils import unwrap_key_w_signature, fernet_encKey

import secrets, logging, requests, json, base64

logger = logging.getLogger('rest_api')

# --------------------------------------------------------------------
# Helper functions
# --------------------------------------------------------------------
def issue_challenge(session, key):
    """
    Issue and store a short-lived challenge in session under 'key'
    Returns the challenge string.
    """
    challenge = secrets.token_hex(16)
    session[key] = {"value": challenge, "issued": timezone.now().timestamp()}
    session.modified = True
    return challenge 


def validate_challenge(session, key, received):
    """
    Validate a challenge previously stored under 'key' in session.
    - raises ValidationError if invalid/expired/missing
    - removes the challenge from session on success or expiry
    """
    item = session.get(key)
    if not item: 
        raise ValidationError("Missing challenge")

    issued = item.get("issued")
    value = item.get("value")
    age = timezone.now().timestamp() - issued 

    # Expired
    if age > 300:
        try: 
            del session[key]
        except KeyError:
            pass
        raise ValidationError("Challenge expired.")
    
    # Mismatch 
    if not received or received != value:
        raise ValidationError("Challenge mismatch.")
    
    # Valid
    try:
        del session[key]
    except KeyError:
        pass


# --------------------------------------------------------------------
# Views
# --------------------------------------------------------------------

class LoginChallengeView(APIView):
    """
    GET /api/auth/challenge/
    Issue a login challenge and store it in the session
    """
    def get(self, request, *args, **kwargs):
        challenge = issue_challenge(request.session, "login_challenge")
        return Response({'challenge': challenge}, status=status.HTTP_200_OK)
    

class RequestChallengeView(APIView): 
    """
    GET /api/requests/challenge/
    Issue a request challenge and store it in the session
    """
    def get(self, request, *args, **kwargs): 
        challenge = issue_challenge(request.session, "request_challenge")
        return Response({'challenge': challenge}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class UserAuthenticationView(APIView):
    """
    POST /api/auth/authenticate/
    Receive a Verifiable Presentation, validate the session challenge and 
    verify the VP through the Veramo backend. If valid, create or update the user 
    and return JWT tokens.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        presentation = request.data.get('presentation')
        if not presentation:
            return Response({'error': 'Presentation is missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate stored session challenge (throw ValidationError on fail)
        vp_challenge = presentation.get('challenge')
        try:
            validate_challenge(request.session, 'login_challenge', vp_challenge)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify with Veramo backend agent
        try: 
            payload = {
                'presentation': presentation,
                'challenge': {'value': vp_challenge},
                'domain': 11155111 # Sepolia 
            }
            verification_data = verify_with_veramo('verify-presentation', payload)
        except requests.exceptions.RequestException as e:
            logger.error(f'Error calling Veramo service: {e}')
            return Response({'error': 'Could not connect to Veramo service'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        is_verified = verification_data.get('verified')
        verified_did = verification_data.get('issuer')

        request.session['authenticated_did'] = verified_did

        if not is_verified or not verified_did:
            logger.warning("Presentation failed or DID is missing.")
            return Response({'error': 'Presentation verification failed'}, status=status.HTTP_403_FORBIDDEN)
        
        # Find or create user
        created = False
        try:
            profile = Profile.objects.get(did=verified_did)
            user = profile.user
            profile.save(update_fields=['latest_access'])
            logger.info(f'Existing user {user.username} authenticated successfully!')
        except Profile.DoesNotExist:
            user = User.objects.create_user(username=verified_did)
            user.set_unusable_password()
            user.save()
            profile = Profile.objects.create(user=user, did=verified_did)
            created = True
            logger.info(f'New user created: {user.username}')

        # Issue JWT token
        refresh = RefreshToken.for_user(user)
        refresh['did'] = verified_did

        return Response(
            {
                'success': True,
                'user_id': user.id, 
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'profile_created': profile.creation_date,
                'profile_last_access': profile.latest_access
            }, 
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


@method_decorator(csrf_exempt, name='dispatch')
class CreateIdentityProfileView(APIView):
    """
    POST /api/identity/
    Accept a Verifiable Credential, verify with Veramo backend agent, and 
    store the encrypted identity.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 

    def post(self, request, *args, **kwargs):
        vc = request.data.get('credential')
        if isinstance(vc, str):
            vc = json.loads(vc)

        avatar = request.data.get('avatar')
        if not vc:
            return Response({'error': 'Missing credential'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify with Veramo backend agent
        try:
            result = verify_with_veramo('verify-credential', {'credential': vc})
            if not result.get('verified'):
                return Response({'success': False, 'error': 'Credential invalid'}, status=status.HTTP_400_BAD_REQUEST)    
        except Exception as e:
            logger.exception("Credential verification with Veramo failed.")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Cross-check DID in VC vs JWT claim
        issuer_did = vc.get('issuer', {}).get('id')
        jwt_did = request.auth.get('did')
        if not jwt_did or issuer_did != jwt_did:
            logger.warning(f"Issuer DID ({issuer_did}) does not match authenticated DID ({jwt_did})")
            return Response({'error': 'DID in VC does not match the authenticated DID'}, status=status.HTTP_403_FORBIDDEN)
        
        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        subject_data = vc.get('credentialSubject', {})
        if not isinstance(subject_data, dict) or not subject_data:
            return Response({'error': 'Incomplete credential data'}, status=status.HTTP_400_BAD_REQUEST)
        
        context = subject_data.get('context')
        description = subject_data.get('description')
        identity_fields = {k: v for k, v in subject_data.items() if k not in ('id', 'context', 'description')}
        
    
        user_profile = request.user.profile
        if not user_profile:
            return Response({'error': 'No profile exists for authenticated user'}, status=status.HTTP_400_BAD_REQUEST)
        
        identity_data = {
            'context': context,
            'description': description,
            'is_active': True,
            'raw_data': identity_fields,
            'avatar': avatar
        }

        serializer = IdentitySerializer(
            data=identity_data, context={'signature': signature, 'user': user_profile, 'request': request })
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            identity = serializer.save()
        except IntegrityError:
            return Response(
                {'error': 'Identity already exists for this context/description'}, status=status.HTTP_409_CONFLICT
            )
        
        read_serializer = IdentitySerializer(identity, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
            

@method_decorator(csrf_exempt, name='dispatch')
class GetMyIdentitiesView(APIView):
    """
    POST /api/me/identities/
    Returns the caller's identities.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):    
        signature = request.data.get('signature')
        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        did = request.user.profile.did
        ids = (
            Identity.objects
                .select_related('user')
                .filter(user__did=did)
                .order_by('-issued')
        )
        
        serializer = IdentitySerializer(ids, many=True, context={'signature': signature, 'request': request })
        return Response({'identities': serializer.data}, status=status.HTTP_200_OK)
    

@method_decorator(csrf_exempt, name='dispatch')
class UpdateIdentityActiveView(APIView):
    """
    PUT /api/me/identities/<uuid:identity>/active/
    Toggle an identity's visibility (is_active) for the authenticated user.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, identity_id):
        identity = get_object_or_404(Identity, id=identity_id, user=request.user.profile)
        serializer = IdentityActiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identity.is_active = serializer.validated_data['is_active']
        identity.save(update_fields=['is_active'])

        return Response(IdentitySerializer(identity).data, status=status.HTTP_200_OK)


class IdentityDeleteView(APIView):
    """
    POST /api/identities/mass-delete/
    Delete multiple identities that belong to the authenticated user.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = MassDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data['ids']

    
        profile = request.user.profile
        if not profile:
            return Response({'error': 'Profile does not exist'}, status=status.HTTP_400_BAD_REQUEST)
        
        qs = Identity.objects.filter(user=profile, id__in=ids)
        if not qs.exists():
            return Response({'error': 'No matching identities found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            qs.delete()

        return Response({'success': True, 'deletion_count': len(ids)}, status=status.HTTP_200_OK)
    

class GetContexts(APIView):
    """
    GET /api/users/<path:did>/contexts/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, did, *args, **kwargs):    
        try: 
            profile = Profile.objects.get(did=did)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        identities = Identity.objects.filter(user=profile, is_active=True)
        serializer = ContextSerializer(identities, many=True, context={'request': request})
        return Response({'contexts': serializer.data}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch') 
class CreateRequestView(APIView): 
    """
    POST /api/requests/create/
    Verify a RequestCredential VP, create a Request row, and notify the holder via WebSocket.
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 
    
    def post(self, request, *args, **kwargs): 
        presentation = request.data.get('presentation') 
        if not presentation:
            return Response({'error': 'Presentation is missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate session challenge
        try:
            vp_challenge = presentation.get('challenge')
            validate_challenge(request.session, 'request_challenge', vp_challenge)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Verify with Veramo backend agent
        try:
            payload = { 
                'presentation': presentation, 
                'challenge': {'value': vp_challenge}, 
                'domain': 11155111 # Sepolia 
            }
            verification_data = verify_with_veramo('verify-presentation', payload) 
        except requests.exceptions.RequestException as e: 
            logger.error(f'Error calling Veramo service: {e}') 
            return Response({'error': 'Could not connect to Veramo service'}, status=status.HTTP_503_SERVICE_UNAVAILABLE) 

        if not verification_data.get('verified'):
            logger.warning("Request presentation verification failed.") 
            return Response({'error': 'Presentation verification failed'}, status=status.HTTP_403_FORBIDDEN) 
        
        # Extract the VC from the VP
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
        requestor_signature = subject.get('requestorSignature') or request.data.get('signature')
        
        if not all([requestor_did, holder_did, context_id]): 
            return Response({'error': 'Incomplete information in the credentialSubject'}, status=status.HTTP_400_BAD_REQUEST) 
        
        # Profiles and context exist?
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
            requestor_signature=requestor_signature,    
        ) 
        
        # Notify holder via WebSocket
        notify_did(
            holder_did, 
            { 
                "event": "new request received", 
                "request_id": str(req.id), 
                "from": requestor_did, 
                "context": { "context": identity.context},
                "created_at": req.created_at.isoformat(), 
            }
        ) 
        
        return Response({'success': True, 'request_id': str(req.id)}, status=status.HTTP_201_CREATED) 
    
    
class GetRequests(APIView): 
    """
    GET /api/me/requests/
    List requests where the authenticated user is requestor or holder.
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 
    
    def get(self, request, *args, **kwargs): 
        profile = request.user.profile 
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND) 
        
        qs = (Request.objects.select_related('requestor', 'holder', 'context').filter(
            Q(requestor=profile) | Q(holder=profile))
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
    """
    DELETE /api/me/requests/delete/<uuid:request_id>/
    Delete a PENDING request created by the authenticated user.
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 

    def delete(self, request, request_id):
        profile = request.user.profile
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        instance = get_object_or_404(
            Request, id=request_id, requestor=profile, status=Request.Status.PENDING,
        )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
 
            
class UpdateRequestView(APIView): 
    """
    PATCH /api/requests/update/<uuid:request_id>/
    Holder updates a request (approve/reject, reason, expiry, etc.),
    Notifies the requestor via WebSocket.
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 
    
    def patch(self, request, request_id): 
        try: 
            req = Request.objects.get(id=request_id) 
        except Request.DoesNotExist: 
            return Response({'error': 'Request does not exist'}, status=status.HTTP_404_NOT_FOUND) 
        
        if req.holder != request.user.profile: 
            return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN) 
        
        serializer = RequestUpdateSerializer(req, data=request.data, partial=True) 
        if not serializer.is_valid(): 
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        instance = serializer.save() 
            
        notify_did(
            instance.requestor.did, 
            { 
                "event": "request answer received", 
                "request_id": str(instance.id), 
                "status": instance.get_status_display(), 
                "expires_at": instance.expires_at.isoformat() 
                if instance.expires_at else None, 
                "reason": instance.reason, 
            },
        ) 
        return Response(RequestListSerializer(instance).data, status=status.HTTP_200_OK) 
    

class RetrieveSharedDataView(APIView):
    """
    POST /api/requests/<uuid:request_id>/shared-data/
    Requestor retrieves shared data for an APPROVED (and not expired) request,
    proving possession of the correct signature to unwrap the symmetric key. 
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 

    def post(self, request, request_id):
        try:
            req = Request.objects.select_related('shared_data', 'requestor__user').get(
                id=request_id, requestor__user=request.user
            )
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
            return Response({'error': 'Decryption failed. Invalid signature or data.'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({'data': data}, status=status.HTTP_200_OK)
    

class DeleteSharedDataView(APIView):
    """
    DELETE /api/shared-data/<uuid:request_id>/
    Allow data holder to revoke access to the shared data 
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 

    def delete(self, request, request_id):
        profile = request.user.profile
        if not profile: 
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        sd = get_object_or_404(
            SharedData.objects.select_related('request', 'request__holder', 'request__requestor'),
            request__id=request_id,
            request__holder=profile,
        )
        req = sd.request
        sd.delete()

        if req.status == Request.Status.APPROVED:
            req.expires_at = timezone.now()
            req.reason = 'Access revoked by holder'
            req.save(update_fields=['expires_at', 'reason'])

        notify_did(req.requestor.did, {
            "event": "access revoked",
            "request_id": str(req.id),
            "status": req.get_status_display(),
            "expires_at": req.expires_at.isoformat() if req.expires_at else None,
            "reason": req.reason,
        })

        return Response(status=status.HTTP_204_NO_CONTENT)
 