from django.urls import path
from .api import (
    UserAuthenticationView, 
    LoginChallengeView, 
    CreateIdentityProfileView,
    GetMyIdentitiesView,
    IdentityDeleteView,
    GetContexts,
    RequestChallengeView,
    CreateRequestView,
    GetRequests,
    UpdateRequestView,
    DeleteRequestView,
    UpdateIdentityActiveView,
    RetrieveSharedDataView,
    DeleteSharedDataView
)

urlpatterns = [
    path('auth/authenticate/', UserAuthenticationView.as_view(), name='auth_authenticate'),
    path('auth/challenge/', LoginChallengeView.as_view(), name='auth_challenge'),
    path('identity/', CreateIdentityProfileView.as_view(), name='create_identity_profile'),
    path('me/identities/', GetMyIdentitiesView.as_view(), name='get_identities'),
    path('me/identities/<uuid:identity_id>/active/', UpdateIdentityActiveView.as_view(), name="set_identity_visibility"),
    path('me/identities/mass-delete/', IdentityDeleteView.as_view(), name='mass_delete_identities'),
    path('users/<path:did>/contexts/', GetContexts.as_view(), name='user_contexts'),
    path('requests/challenge/', RequestChallengeView.as_view(), name='get_request_challenge'),
    path('requests/', CreateRequestView.as_view(), name='create_request'),
    path('me/requests/', GetRequests.as_view(), name='get_requests'),
    path('requests/<uuid:request_id>/', UpdateRequestView.as_view(), name='update_requests'),
    path('me/requests/<uuid:request_id>/', DeleteRequestView.as_view(), name='delete_request'),
    path('requests/<uuid:request_id>/shared-data/', RetrieveSharedDataView.as_view(), name='grant_data_access'),
    path('shared-data/<uuid:request_id>/', DeleteSharedDataView.as_view(), name='shared_data_delete'),
]