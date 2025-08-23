from django.contrib import admin
from .models import Profile, Identity, Request, SharedData

class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'did', 'creation_date', 'latest_access')

class IdentityAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'context', 'description', 'avatar', 'issued', 'enc_data', 'salt', 'is_active')

class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'requestor', 'holder', 'context', 'purpose', 'status', 'reason', 
                    'expires_at', 'challenge', 'presentation', 'approved_by', 'approved_at', 'created_at', 'updated_at', 'requestor_signature')
    
class SharedDataAdmin(admin.ModelAdmin):
    list_display = ('request', 'created_at', 'enc_data')

admin.site.register(Profile, ProfileAdmin)
admin.site.register(Identity, IdentityAdmin)
admin.site.register(Request, RequestAdmin) 
admin.site.register(SharedData, SharedDataAdmin)


