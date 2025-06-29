from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .models import Profile

import secrets
import logging
import requests
import sys

logger = logging.getLogger(__name__)
stream_handler = logging.StreamHandler(sys.stdout)
logger.addHandler(stream_handler)
logger.setLevel(logging.DEBUG)


class LoginChallengeView(APIView):
    def get(self, request, *args, **kwargs):
        challenge = secrets.token_hex(16)
        request.session['login_challenge'] = challenge

        return Response({'challenge': challenge}, status=status.HTTP_200_OK)

class UserRegistrationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        presentation = request.data.get('presentation')

        if not presentation:
            return Response({'error': 'Presentation is missing'}, status=status.HTTP_400_BAD_REQUEST)
        

        challenge = request.session.get('login_challenge')

        if not challenge:
            return Response({'error': 'Missing login challenge'}, status=status.HTTP_400_BAD_REQUEST)
        
        veramo_service_url = 'http://localhost:3002/verify-presentation'

        try: 
            response = requests.post(veramo_service_url, json={
                'presentation': presentation,
                'challenge': challenge,
                'domain': 11155111
                })
            response.raise_for_status()
            verification_data = response.json()
            logger.debug(f'Veramo response: {verification_data}')

        except requests.exceptions.RequestException as e:
            logger.error(f'Error calling Veramo service: {e}')
            return Response({'error': 'Could not connect to Veramo service'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        is_verified = verification_data.get('verified')
        verified_did = verification_data.get('issuer')

        if not is_verified or not verified_did:
            return Response({'error': 'Presentation verification failed'}, status=status.HTTP_403_FORBIDDEN)
        
        del request.session['login_challenge']
        
        try:
            Profile.objects.get(did=verified_did)
            logger.warning(f'Registration attempt for already existing DID: {verified_did}')
            return Response({'error': 'DID is already registered'}, status=status.HTTP_409_CONFLICT)
        
        except Profile.DoesNotExist:
            user = User.objects.create_user(username=verified_did)
            user.set_unusable_password()
            user.save()
            logger.info(f'New user created: {user.username}')

            Profile.objects.create(user=user, did=verified_did)

            refresh = RefreshToken.for_user(user)

            return Response({
                'success': True,
                'user_id': user.id, 
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)

