from django.urls import path
from rest_api import consumers 

websocket_urlpatterns = [
    path('ws/notifications/<str:did>/', consumers.BackendConsumer.as_asgi(), )
]