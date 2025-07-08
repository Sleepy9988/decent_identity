# Import standard Django and Django Rest Framework modules
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .models import Profile
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Import supporting Python libraries
import secrets
import logging
import requests
import sys

# Logging setup for easier debugging
logger = logging.getLogger(__name__)
stream_handler = logging.StreamHandler(sys.stdout)
logger.addHandler(stream_handler)
logger.setLevel(logging.DEBUG) # change in production

# API GET endpoint to generate a random, unique nonce (login challenge)
class LoginChallengeView(APIView):
    def get(self, request, *args, **kwargs):
        challenge = secrets.token_hex(16)

        # Store the challenge in the session
        request.session['login_challenge'] = challenge

        # Send challenge to the client
        return Response({'challenge': challenge}, status=status.HTTP_200_OK)
    
class DIDExistsView(APIView):
    def get(self, request, *args, **kwargs):    
        did = kwargs.get('did') 
        exists = Profile.objects.filter(did=did).exists()
        return Response({'exists': exists})

# API POST endpoint to verify a Verifiable Presentation and register a new user
@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationView(APIView):
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

        # If verification failed or DID missing, deny the request
        if not is_verified or not verified_did:
            return Response({'error': 'Presentation verification failed'}, status=status.HTTP_403_FORBIDDEN)
        # Delete the challenge from the session
        del request.session['login_challenge']
        
        try:
            # Check if the user with this DID already exists
            Profile.objects.get(did=verified_did)
            logger.warning(f'Registration attempt for already existing DID: {verified_did}')
            return Response({'error': 'DID is already registered'}, status=status.HTTP_409_CONFLICT)
        
        except Profile.DoesNotExist:
            # Create a new Django user with DID as username
            user = User.objects.create_user(username=verified_did)
            user.set_unusable_password()
            user.save()
            logger.info(f'New user created: {user.username}')

            # Link Profile to User
            Profile.objects.create(user=user, did=verified_did)

            # Issue a JWT token
            refresh = RefreshToken.for_user(user)

            # Send response to the client
            return Response({
                'success': True,
                'user_id': user.id, 
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)

