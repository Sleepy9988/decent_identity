from django.urls import path
from .api import UserRegistrationView, LoginChallengeView

urlpatterns = [
      path('register', UserRegistrationView.as_view(), name='user_registration'),
      path('registration/challenge', LoginChallengeView.as_view(), name='registration_challenge'),
]