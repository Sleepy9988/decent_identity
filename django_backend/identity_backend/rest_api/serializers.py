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
        signature = self.context.get('signature')
        if not signature:
            return None
        try:
            return obj.retrieve_decrypted_data(signature)
        except Exception:
            return None
    
    def create(self, validated_data):
        raw_data = validated_data.pop('raw_data', None)
        signature = self.context.get('signature')

        if not signature:
            raise serializers.ValidationError('Missing signature for encryption.')
        
        validated_data['salt'] = secrets.token_bytes(16)
        
        instance = Identity(**validated_data)

        if raw_data:
            instance.store_encrypted_data(raw_data, signature)
        instance.save()
        return instance
    
