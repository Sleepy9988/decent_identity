from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _ 
from django.core.exceptions import ValidationError

from .cryptographic_utils import encrypt, decrypt

import uuid
import json

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    did = models.CharField(max_length=255, unique=True, blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    latest_access = models.DateTimeField(auto_now=True) 

    def __str__(self):
        return self.user.username

    
class Identity(models.Model):
    id = models.UUIDField(primary_key=True, unique=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='identities')
    context = models.CharField(max_length=255, blank=False, null=False)
    description = models.TextField()
    avatar = models.ImageField(blank=True, null=True, upload_to='images/')
    issued = models.DateTimeField(auto_now_add=True)
    enc_data = models.BinaryField(blank=False, null=False)
    salt = models.BinaryField(blank=False, null=False)
    is_active = models.BooleanField(db_index=True)

    def __str__(self):
        return f"{self.context} - {self.user.did}"
    
    class Meta: 
        unique_together = ('user', 'context', 'description')
        verbose_name_plural = "Identities"

    def store_encrypted_data(self, raw_data, signature):
        data_bytes = json.dumps(raw_data).encode()
        encrypted = encrypt(data_bytes, signature.encode(), self.salt)
        self.enc_data = encrypted

    def retrieve_decrypted_data(self, signature):
        try:
            decrypted = decrypt(self.enc_data, signature.encode(), self.salt)
            return json.loads(decrypted.decode())
        except Exception as e:
            print(e)
            return None
    
    def save(self, *args, **kwargs):
        if not self.salt:
            raise ValueError("Salt must not be blank when saving an Identity.")
        super().save(*args, **kwargs)
    

class Request(models.Model): 
    class Status(models.TextChoices): 
        PENDING = "PD", _("Pending") 
        APPROVED = "AP", _("Approved") 
        DECLINED = "DC", _("Declined") 
        
    id = models.UUIDField(primary_key=True, unique=True, default=uuid.uuid4, editable=False) 
    requestor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='requests_made') 
    holder = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='requests_received') 
    context = models.ForeignKey(Identity, on_delete=models.CASCADE, related_name='requests') 
    purpose = models.TextField() 
    status = models.CharField(max_length=2, choices=Status, default=Status.PENDING, db_index=True) 
    reason = models.TextField(blank=True, null=True) 
    expires_at = models.DateTimeField(blank=True, null=True, db_index=True) 
    challenge = models.CharField(max_length=255, blank=True, null=True) 
    presentation = models.JSONField(blank=True, null=True) 
    approved_by = models.ForeignKey(Profile, null=True, blank=True, on_delete=models.SET_NULL, related_name='requests_approved') 
    approved_at = models.DateTimeField(null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True, db_index=True) 
    updated_at = models.DateTimeField(auto_now=True) 
    
    class Meta: 
        indexes = [ 
            models.Index(fields=['holder', 'status']), 
            models.Index(fields=['requestor', 'created_at']) 
        ] 
        
        constraints = [ 
            models.UniqueConstraint( 
                fields=['requestor', 'context', 'status'], 
                condition=models.Q(status='PD'), 
                name='unique_pending_request_per_requestor_context' 
            ) 
        ] 

        ordering = ['-created_at'] 
    
    def clean(self): 
        if self.context.user != self.holder: 
            raise ValidationError("Context does not belong to the holder.") 
        
    def __str__(self): 
        return f"{self.requestor.did} - {self.holder.did} [{self.context}] ({self.get_status_display()})" 

    
