from channels.generic.websocket import AsyncWebsocketConsumer 
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import re, json, logging

logger = logging.getLogger(__name__)


class BackendConsumer(AsyncWebsocketConsumer):
    """
    Handle the incoming WebSocket connection.
    Steps:
        1. Extract 'did' from the URL kwargs
        2. Extract 'token' from the query string
        3. Validate token & extract 'user_id'
        4. Ensure DID in URL matches DID in user profile
        5. Accept connection and add client to group

    Documentation:
    https://django-rest-framework-simplejwt.readthedocs.io/en/latest/rest_framework_simplejwt.html
    https://channels.readthedocs.io/en/latest/index.html
    """
    async def connect(self):        
        from django.contrib.auth import get_user_model
        from .models import Profile 
        User = get_user_model()

        # get user 
        @database_sync_to_async
        def get_user_by_id(user_id):
            try: 
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return None

        # ensure profile DID is the one requested
        @database_sync_to_async
        def user_did_matches(user, did_url):
            try:
                profile = Profile.objects.get(user=user)
                return profile.did == did_url
            except Profile.DoesNotExist:
                return False
        
        # step 1
        did = self.scope["url_route"]["kwargs"]["did"]

        # step 2 
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])
        token = token_list[0] if token_list else None

        if not did or not token_list:
            logger.warning("WS connection denied: did or token missing.")
            await self.close(code=4401)
            return 
        
        # step 3
        try:
            validated = UntypedToken(token)
            user_id = validated.get("user_id")

            if not user_id:
                logger.warning("WS connect denied: token missing user_id.")
                await self.close(code=4401)
                return
        except (InvalidToken, TokenError) as e:
            logger.warning("WS connect denied: invalid token: %s.", e)
            await self.close(code=4401)
            return
        
        user = await get_user_by_id(user_id)
        if not user:
            logger.warning("WS connect denied: user not found. user_id=%s", user_id)
            await self.close(code=4401)
            return
        
        match = await user_did_matches(user, did)
        if not match:
            logger.warning("WS connect denied: DID mismatch. user_id=%s did=%s", user_id, did)
            await self.close(code=4403)
            return 
        
        # step 5
        self.did = did
        sanitized_did = re.sub(r'[^a-zA-Z0-9-._]+', '_', did)
        self.group_name = f"user_{sanitized_did}"

        if self.channel_layer is None:
            logger.error("WS connect failed: channel_layer is None.")
            await self.close(code=1011)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()


    async def disconnect(self, code):
        """
        Handle WebSocket disconnection.
        """
        if hasattr(self, "group_name") and self.channel_layer:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    
    async def notify(self, event):
        """
        Helper to call from other parts of the app to send notifications to the client.
        """
        message = event.get('message', {})
        await self.send(text_data=json.dumps(message))
