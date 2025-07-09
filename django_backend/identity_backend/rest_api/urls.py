from django.urls import path
from .api import UserAuthenticationnView, LoginChallengeView, DIDExistsView

urlpatterns = [
      path('authenticate', UserAuthenticationnView.as_view(), name='user_authentication'),
      path('authentication/challenge', LoginChallengeView.as_view(), name='authentication_challenge'),
      path('did/<str:did>/exists', DIDExistsView.as_view(), name='check_did_exists')
]