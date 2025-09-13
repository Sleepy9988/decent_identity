from django.urls import re_path
from rest_api.consumers import BackendConsumer 

websocket_urlpatterns = [
    re_path(r"^ws/notifications/(?P<did>[^/]+)/?$", BackendConsumer.as_asgi(), )
]