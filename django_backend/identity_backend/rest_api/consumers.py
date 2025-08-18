import json
from channels.generic.websocket import AsyncWebsocketConsumer 
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

from rest_framework_simplejwt.tokens import UntypedToken
from jwt import InvalidTokenError
import re

class BackendConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from django.contrib.auth import get_user_model
        from .models import Profile 
        User = get_user_model()

        @database_sync_to_async
        def get_user_by_id(user_id):
            try: 
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return None
    
        @database_sync_to_async
        def user_did_matches(user, did_url):
            try:
                profile = Profile.objects.get(user=user)
                return profile.did == did_url
            except Profile.DoesNotExist:
                return False

        did = self.scope["url_route"]["kwargs"]["did"]

        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_list = query.get("token", [])

        if not token_list:
            await self.close(code=4401)
            return 
        token = token_list[0]

        try:
            validated = UntypedToken(token)
            user_id = validated.get("user_id")

            if not user_id:
                await self.close(code=4401)
                return
        except InvalidTokenError:
            await self.close(code=4401)
            return
        
        user = await get_user_by_id(user_id)
        if not user:
            await self.close(code=4401)
            return
        
        match = await user_did_matches(user, did)
        if not match:
            await self.close(code=4403)
            return 
        
        self.did = did
        sanitized_did = re.sub(r'[^a-zA-Z0-9-._]+', '_', did)
        self.group_name = f"user_{sanitized_did}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify(self, event):
        message = event.get('message', {})
        await self.send(text_data=json.dumps(message))
