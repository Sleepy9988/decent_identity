from rest_framework import serializers
from .models import Identity, Request
from django.utils import timezone

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
    
class MassDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(format='hex_verbose'),
        allow_empty=False
    )

class RequestListSerializer(serializers.ModelSerializer): 
    requestor_did = serializers.CharField(source='requestor.did', read_only=True) 
    holder_did = serializers.CharField(source='holder.did', read_only=True) 
    context_id = serializers.UUIDField(source='context.id', read_only=True) 
    context = serializers.CharField(source='context.context', read_only=True) 
    status = serializers.CharField(source='get_status_display', read_only=True) 
    
    class Meta: 
        model = Request 
        fields = [ 'id', 'status', 'purpose', 'requestor_did', 'holder_did', 'context_id', 'context', 'created_at', 'expires_at', 'updated_at' ]


class RequestUpdateSerializer(serializers.ModelSerializer): 
    action = serializers.ChoiceField(choices=['approve', 'decline'], write_only=True) 
    reason = serializers.CharField(required=False, allow_blank=True) 
    expires_at = serializers.DateTimeField(required=False, allow_null=True) 
    
    class Meta: 
        model = Request 
        fields = ['action', 'reason', 'expires_at'] 
        
    def validate(self, attrs): 
        req: Request = self.instance 
        action = attrs['action'] 
        
        if req.status != Request.Status.PENDING: 
            raise serializers.ValidationError('Request is not pending.') 
        
        if action == 'approve': 
            exp = attrs.get('expires_at') 
            
            if exp and exp <= timezone.now(): 
                raise serializers.ValidationError('Expiration data must be in the future.') 
            else: 
                if not attrs.get('reason'): 
                    attrs['reason'] = 'Declined by holder.' 
        return attrs 
    
    def update(self, instance: Request, validated): 
        action = validated['action'] 
        
        if action == 'approve': 
            instance.status = Request.Status.APPROVED 
            instance.approved_at = timezone.now() 
            if 'expires_at' in validated: 
                instance.expires_at = validated['expires_at'] 
                instance.reason = None 
            else: 
                instance.status = Request.Status.DECLINED 
                instance.reason = validated.get('reason') or instance.reason 
                instance.expires_at = None 
                instance.approved_at = None 
                instance.save(update_fields=['status', 'approved_at', 'expires_at', 'reason']) 
                
            return instance