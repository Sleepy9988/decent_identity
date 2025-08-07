from django.db import models
from django.contrib.auth.models import User

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
    avatar = models.BinaryField(blank=True, null=True)
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
    


    

    
