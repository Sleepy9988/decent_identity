from django.db import models
from django.contrib.auth.models import User

import uuid
# Create your models here.

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
    issued = models.DateTimeField(auto_now_add=True)
    enc_data = models.BinaryField()
    enc_iv = models.BinaryField()
    enc_alg = models.CharField(max_length=100)
    is_active = models.BooleanField(db_index=True)

    def __str__(self):
        return f"{self.context} - {self.user.did}"
    
    class Meta: 
        unique_together = ('user', 'context', 'description')
        verbose_name_plural = "Identities"
    

    
