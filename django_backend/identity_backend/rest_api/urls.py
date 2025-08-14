from django.urls import path
from .api import (
    UserAuthenticationView, 
    LoginChallengeView, 
    DIDExistsView, 
    CreateCredentialView,
    GetMyIdentitiesView,
    IdentityDeleteView,
    GetContexts
)

urlpatterns = [
      path('authenticate', UserAuthenticationView.as_view(), name='user_authentication'),
      path('authentication/challenge', LoginChallengeView.as_view(), name='authentication_challenge'),
      path('did/<str:did>/exists', DIDExistsView.as_view(), name='check_did_exists'),
      path('credential/verify', CreateCredentialView.as_view(), name='verify_credential'),
      path('me/identities/', GetMyIdentitiesView.as_view(), name='get_identities'),
      path('identity/delete/', IdentityDeleteView.as_view(), name='delete_identities'),
      path('users/<str:did>/contexts/', GetContexts.as_view(), name='user_contexts')
]