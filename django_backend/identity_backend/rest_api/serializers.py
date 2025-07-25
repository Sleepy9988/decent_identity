from rest_framework import serializers
from .models import Identity

import secrets

class IdentitySerializer(serializers.ModelSerializer):
    decrypted_data = serializers.SerializerMethodField()
    raw_data = serializers.JSONField(write_only=True, required=False)

    class Meta: 
        model = Identity
        fields = ['id', 'user', 'context','description', 'avatar', 'issued', 'is_active', 'salt', 'decrypted_data', 'raw_data']
        read_only_fields = ['id', 'issued', 'decrypted_data', 'salt']

    def get_decrypted_data(self, obj):
        return obj.retrieve_decrypted_data()
    
    def create(self, data):
        raw_data = data.pop('raw_data', None)
        data['salt'] = secrets.token_bytes(16)
        
        instance = Identity(**data)

        if raw_data:
            instance.store_encrypted_data(raw_data)
        instance.save()
        return instance
    
