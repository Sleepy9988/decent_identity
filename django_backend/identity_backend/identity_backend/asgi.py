import os, django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# setting module of the application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'identity_backend.settings')

# Initialize Django first, before loading any app related content like WebSocket routes
django.setup()
from identity_backend.routing import websocket_urlpatterns
from .middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    # HTTP requests
    "http": get_asgi_application(),
    # WebSocket connections
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns),
    )
})