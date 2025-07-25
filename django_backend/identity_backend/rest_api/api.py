# Import standard Django and Django Rest Framework modules
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .models import Profile, Identity
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .utils import verify_with_veramo
from .serializers import IdentitySerializer

# Import supporting Python libraries
import secrets
import logging
import requests

# Logging setup for easier debugging
logger = logging.getLogger(__name__)

# API GET endpoint to generate a random, unique nonce (login challenge)
class LoginChallengeView(APIView):
    def get(self, request, *args, **kwargs):
        challenge = secrets.token_hex(16)

        # Store the challenge in the session
        request.session['login_challenge'] = challenge

        # Send challenge to the client
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
        challenge = request.session.get('login_challenge')
        logger.debug(challenge)
        if not challenge:
            return Response({'error': 'Missing login challenge'}, status=status.HTTP_400_BAD_REQUEST)
        
        # URL of the Veramo backend agent 
        #veramo_service_url = 'http://localhost:3002/verify-presentation'
        veramo_service_url = 'http://localhost:3003/verify-presentation'

        try: 
            logger.debug(f'Sending to Veramo: presentation={presentation}, challenge={challenge}')
            # Send the presentation and challenge to the Veramo backend agent for verification
            response = requests.post(veramo_service_url, json={
                'presentation': presentation,
                'challenge': challenge,
                'domain': 11155111 # Sepolia 
                })

            logger.debug(f'Response text from Veramo: {response.text}')
            # Parse the response from Veramo
            verification_data = response.json()
            logger.debug(f'Veramo response: {verification_data}')
        
        # Handle connection errors
        except requests.exceptions.RequestException as e:
            logger.error(f'Error calling Veramo service: {e}')
            return Response({'error': 'Could not connect to Veramo service'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Extract the verification result 
        is_verified = verification_data.get('verified')
        verified_did = verification_data.get('issuer')

        request.session['authenticated_did'] = verified_did

        # If verification failed or DID missing, deny the request
        if not is_verified or not verified_did:
            logger.warning("Presentation failed or DID is missing.")
            return Response({'error': 'Presentation verification failed'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Delete the challenge from the session
            del request.session['login_challenge']
        except KeyError:
            logger.debug("Challenge already removed.")
        
        try:
            # Check if the user with this DID already exists
            profile = Profile.objects.get(did=verified_did)
            user = profile.user
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

        if issuer_did != jwt_did:
            logger.warning(f"VC issuer DID ({issuer_did}) does not match authenticated DID ({jwt_did})")
            return Response({'error': 'DID in VC does not match the authenticated DID'}, status=status.HTTP_403_FORBIDDEN)
        
        subject_data = vc.get('credentialSubject', {})

        if not subject_data:
            return Response({'error': 'Incomplete credential data'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = request.user.profile
        except Profile.DoesNotExist:
            return Response({'error': 'No profile exists for authenticated user'}, status=status.HTTP_400_BAD_REQUEST)
        
        identity_data = {
            'user': user.id,
            'context': 'Test context',
            'description': "Identity description",
            'is_active': True,
            'raw_data': subject_data,
        }

        serializer = IdentitySerializer(data=identity_data)
        if serializer.is_valid():
            identity = serializer.save(user=user)
            return Response({'success': True, 'identity_id': identity.id})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class GetMyIdentitiesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):    
        did = request.user.profile.did

        ids = Identity.objects.filter(user__did=did)
        serializer = IdentitySerializer(ids, many=True)
        
        return Response({'identities': serializer.data}, status=status.HTTP_200_OK)
        