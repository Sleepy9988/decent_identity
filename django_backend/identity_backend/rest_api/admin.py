from django.contrib import admin
from .models import Profile, Identity
# Register your models here.

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'did', 'creation_date', 'latest_access')

class IdentityAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'context', 'description', 'avatar', 'issued', 'enc_data', 'salt', 'is_active')

admin.site.register(Profile, ProfileAdmin)
admin.site.register(Identity, IdentityAdmin)


