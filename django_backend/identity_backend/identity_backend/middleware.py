from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import AnonymousUser

"""
    Documentation:
    https://medium.com/@josephmiracle119/authentication-in-websocket-with-django-and-django-rest-framework-drf-50406ef95f3c

"""
class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        try:
            query = parse_qs(scope.get('query_string', b'').decode())
            token = (query.get('token') or [None])[0]
            user = await self.get_user_from_token(token) if token else AnonymousUser()
            scope['user'] = user
        except Exception as e:
            scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send)


    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            validated = JWTAuthentication().get_validated_token(token)
            return JWTAuthentication().get_user(validated)
        except Exception:
            return AnonymousUser()