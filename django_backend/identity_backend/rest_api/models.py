from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _ 
from django.core.exceptions import ValidationError

from .cryptographic_utils import encrypt, decrypt
from .utils import to_bytes
import uuid, json, logging

logger = logging.getLogger('rest_api')


class Profile(models.Model):
    """
    One-to-one relationship with Django Auth user
    Extends the Base model with Decentralized Identifier and timestamps for 
    auditing and activity tracking. 
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    did = models.CharField(max_length=255, unique=True, blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    latest_access = models.DateTimeField(auto_now=True) 

    def __str__(self):
        return self.user.username


class Identity(models.Model):
    """
    Stores the encrypted identity information of users, along with retrievable
    context & description. 
    """
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
        # enforce uniqueness of user-context-description 
        unique_together = ('user', 'context', 'description')
        verbose_name_plural = "Identities"

    
    def store_encrypted_data(self, raw_data, signature):
        """
        Serialize and encrypt the provided data with a Fernet key derived from 
        Ethereum wallet signature and this instance's salt.
        """
        data_bytes = json.dumps(raw_data).encode()
        encrypted = encrypt(data_bytes, signature.encode(), self.salt)
        self.enc_data = encrypted


    def retrieve_decrypted_data(self, signature):
        """
        Decrypt the stored ciphertext with the holder's signature.
        """
        try:
            cipertext = to_bytes(self.enc_data)
            salt = to_bytes(self.salt)
            decrypted = decrypt(cipertext, signature.encode(), salt)
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.debug(f"decrypt failed: {e}")
            return None
        

    def save(self, *args, **kwargs):
        """
        Ensure salt is present at creation time.
        """
        if not self.salt:
            raise ValueError("Salt must not be blank when saving an Identity.")
        super().save(*args, **kwargs)
    


class Request(models.Model): 
    """
    Stores requests of a requestor to access a holder's identity information.
    """
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
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, editable=False) 
    updated_at = models.DateTimeField(auto_now=True) 
    requestor_signature = models.TextField(blank=True, null=True)
    
    class Meta: 
        indexes = [ 
            models.Index(fields=['holder', 'status']), 
            models.Index(fields=['requestor', 'created_at']) 
        ] 
        # Limit to one request for a requestor-context pair while status pending 
        constraints = [ 
            models.UniqueConstraint( 
                fields=['requestor', 'context', 'status'], 
                condition=models.Q(status='PD'), 
                name='unique_pending_request_per_requestor_context' 
            ) 
        ] 
        # Most recent request first 
        ordering = ['-created_at'] 
    
    
    def clean(self): 
        """
        Ensure the identity context belongs to the user specified in the request.
        """
        if self.context.user != self.holder: 
            raise ValidationError("Context does not belong to the holder.") 
        
    def __str__(self): 
        return f"{self.requestor.did} - {self.holder.did} [{self.context}] ({self.get_status_display()})" 


class SharedData(models.Model):
    """
    Stores the approved identity data ciphertext, encrypted with requestor key. 
    One-to-one relationship with the request model.
    """
    request = models.OneToOneField(Request, on_delete=models.CASCADE, related_name='shared_data')
    enc_data = models.BinaryField()
    encKey_wrapped = models.BinaryField()
    wrap_salt = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SharedData for request {self.request.id}"

    class Meta: 
        verbose_name = "Shared Encrypted Data"
        verbose_name_plural = "Shared Encrypted Data"
        ordering = ['-created_at'] 

    
