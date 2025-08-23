import os, django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from .middleware import JWTAuthMiddleware

# setting module of the application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'identity_backend.settings')

# Initialize Django then import WebSocket routes
django.setup()
from identity_backend.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    # HTTP requests
    "http": get_asgi_application(),
    # WebSocket connections
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns),
    )
})