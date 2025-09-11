from rest_framework import serializers
from django.utils import timezone
from django.db import IntegrityError, transaction

from .models import Identity, Request, SharedData
from .cryptographic_utils import generate_encKey, fernet_encKey, wrap_key_w_signature

import secrets, json, logging

logger = logging.getLogger('rest_api')

# ----------------------------------------------------------------
# Identity serializers
# ----------------------------------------------------------------

class IdentitySerializer(serializers.ModelSerializer):
    """
    Serializer for Identity model. 
    - Accepts optional raw_data which will be encrypted and stored.
    - Returns decrypted_data if a valid signature is provided via the 
      serializer context (context={'signature':...})
    - Returns the avatar URL path
    """
    decrypted_data = serializers.SerializerMethodField()
    raw_data = serializers.JSONField(write_only=True, required=False)

    class Meta: 
        model = Identity
        fields = [
            'id', 
            'user', 
            'context',
            'description', 
            'avatar', 
            'issued', 
            'is_active', 
            'salt', 
            'decrypted_data', 
            'raw_data',
        ]
        read_only_fields = ['id', 'issued', 'decrypted_data', 'salt', 'user']

    # Determine if encrypted payload exists.
    def get_has_encrypted_data(self, obj):
        return bool(obj.enc_data)
    
    # --- Field-level validation ---

    def validate_context(self, context):
        """
        Ensure context is present and not empty.
        """
        if not context or not context.strip():
            raise serializers.ValidationError("Context is required.")
        return context
    
    def validate_description(self, desc):
        """
        Allow null -> empty string
        """
        if desc is None:
            return ""
        return desc
    
    # --- Read-only fields ---
    
    def get_avatar(self, obj):
        """
        Build absolute avatar URL if request is available in serializer context.
        """
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None 

    def get_decrypted_data(self, obj):
        """
        Try to decrypt and return the raw data using the provided signature in the
        serializer context (context={'signature': '...'}).
        Returns None if no signature is provided or decryption fails. 
        """
        signature = self.context.get('signature')
        if not signature:
            return None
        try:
            data = obj.retrieve_decrypted_data(signature)
            return data
        except Exception as e:
            logger.debug(f"Decryption failed for Identity {obj.id}: {e}")
            return None
        
    # --- Write operations ---

    @transaction.atomic
    def create(self, validated_data):
        """
        Create an Identity instance.
        - Requires user and signature in the serializer context.
        - If raw_data is present, encrypt it with the signature and store as enc_data
        """
        raw_data = validated_data.pop('raw_data', None)
        signature = self.context.get('signature')
        user = self.context.get('user')

        if not user:
            raise serializers.ValidationError('Missing user in context.')
        if not signature:
            raise serializers.ValidationError('Missing signature for encryption.')
        
        # Ensure salt is set
        validated_data['salt'] = secrets.token_bytes(16)
        validated_data['user'] = user
        
        try:
            identity = Identity(**validated_data)
            if raw_data:
                identity.store_encrypted_data(raw_data, signature)
            identity.save()
            return identity
        except IntegrityError as e:
            raise serializers.ValidationError({'error': ['Identity already exists for this context/description.'] })
    

class IdentityActiveSerializer(serializers.Serializer):
    """
    Serializer for toggling an Identity's visibility.
    """
    is_active = serializers.BooleanField(required=True)

    
class MassDeleteSerializer(serializers.Serializer):
    """
    Validate a non-empty list of UUIDs for mass-deletion of identities.
    """
    ids = serializers.ListField(
        child=serializers.UUIDField(format='hex_verbose'),
        allow_empty=False
    )

# ----------------------------------------------------------------
# Request serializers
# ----------------------------------------------------------------

class RequestListSerializer(serializers.ModelSerializer): 
    """
    Simple list representation of a Request for API responses.
    """
    requestor_did = serializers.CharField(source='requestor.did', read_only=True) 
    holder_did = serializers.CharField(source='holder.did', read_only=True) 
    context_id = serializers.UUIDField(source='context.id', read_only=True) 
    context = serializers.CharField(source='context.context', read_only=True) 
    status = serializers.CharField(source='get_status_display', read_only=True) 
    description = serializers.CharField(source='context.description', read_only=True)
    
    class Meta: 
        model = Request 
        fields = [ 
            'id', 
            'status', 
            'purpose', 
            'requestor_did', 
            'holder_did', 
            'context_id', 
            'context', 
            'description',
            'created_at', 
            'expires_at', 
            'approved_at',
        ]


class RequestUpdateSerializer(serializers.ModelSerializer): 
    """
    Request updates for holders:
    - action: approve or decline 
    - reason: optional (auto-filled on decline if blank)
    - expires_at: optional datetime for approved requests 
    - signature_holder: required for approval (used to decrypt original identity data)
    When approving:
    - Decrypt identity data with holder signature
    - Re-encrypt with a fresh symmetric key
    - Wrap symmetric key using requestor's signature
    - Add row to SharedData model 
    """
    action = serializers.ChoiceField(choices=['approve', 'decline'], write_only=True) 
    reason = serializers.CharField(required=False, allow_blank=True) 
    expires_at = serializers.DateTimeField(required=False, allow_null=True) 
    signature_holder = serializers.CharField(write_only=True, required=False, allow_blank=False)
    
    class Meta: 
        model = Request 
        fields = ['action', 'reason', 'expires_at', 'signature_holder'] 
    
    # --- Validations ---
    def validate(self, attrs): 
        req: Request = self.instance 
        action = attrs['action'] 
        
        if req.status != Request.Status.PENDING: 
            raise serializers.ValidationError('Request is not pending.') 
        
        if action == 'approve': 
            exp = attrs.get('expires_at') 
            if exp and exp <= timezone.now(): 
                raise serializers.ValidationError('Expiration data must be in the future.') 
        
            if not attrs.get('signature_holder'):
                raise serializers.ValidationError('Missing holder signature.')
        
            if not req.requestor_signature:
                raise serializers.ValidationError('Requestor signature not present on the request.')
            
        elif action == 'decline': 
            # Default reason if no reason provided.
            if not attrs.get('reason'): 
                attrs['reason'] = 'Declined by holder.' 
        return attrs 
    
    # --- Updates ---
    def update(self, instance: Request, validated): 
        """
        Apply the requested action to the Request instance and manage shared data when approved. 
        """
        action = validated['action'] 
        update_fields = ['status']

        if action == 'approve': 
            # Status & timestamps
            instance.status = Request.Status.APPROVED 
            instance.approved_at = timezone.now() 
            update_fields.append('approved_at')
            
            if 'expires_at' in validated: 
                instance.expires_at = validated['expires_at'] 
                update_fields.append('expires_at')
            
            # Clear decline reason if exists
            instance.reason = None 
            update_fields.append('reason')

            # --- Build SharedData for approved request
            identity = instance.context 

            signature_holder = validated.get('signature_holder')
            signature_requestor = instance.requestor_signature

            # Decrypt the holder's original identity data
            raw_data = identity.retrieve_decrypted_data(signature_holder)
            if raw_data is None:
                raise serializers.ValidationError("Unable to decrypt original identity data.")

            # Encrypt with fresh symmetric key
            encKey = generate_encKey()
            f = fernet_encKey(encKey)
            enc_data = f.encrypt(json.dumps(raw_data).encode('utf-8'))

            # Wrap symmetric key with requestor's signature
            wrap_salt = secrets.token_bytes(16)
            encKey_wrapped = wrap_key_w_signature(encKey, signature_requestor, wrap_salt)

            # Create SharedData entry
            SharedData.objects.update_or_create(
                request=instance, 
                defaults={
                    'enc_data': enc_data, 
                    'encKey_wrapped': encKey_wrapped,
                    'wrap_salt': wrap_salt
                },
            )

        else: 
            # Decline
            instance.status = Request.Status.DECLINED 
            instance.reason = validated.get('reason') or instance.reason 
            instance.expires_at = None 
            instance.approved_at = None 
            update_fields += ['reason', 'expires_at', 'approved_at']
            
        instance.save(update_fields=update_fields)         
        return instance

# ----------------------------------------------------------------
# Context serializer
# ----------------------------------------------------------------

class ContextSerializer(serializers.ModelSerializer):
    """
    Return the exposed identity contexts incl. absolute avatar path if available.
    """
    avatar = serializers.SerializerMethodField()

    class Meta: 
        model = Identity 
        fields = ['id', 'context', 'description', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None
