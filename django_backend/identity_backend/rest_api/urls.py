from django.urls import path
from .api import UserRegistrationView, LoginChallengeView, DIDExistsView

urlpatterns = [
      path('register', UserRegistrationView.as_view(), name='user_registration'),
      path('registration/challenge', LoginChallengeView.as_view(), name='registration_challenge'),
      path('did/<str:did>/exists', DIDExistsView.as_view(), name='check_did_exists')
]