from django.contrib import admin
from .models import DriverProfile, Ride, Booking, RideStop, Location


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = [
        'full_name_on_id', 'user', 'nid_number', 'license_number',
        'identity_flag', 'ai_verified_same_person', 'ai_confidence', 'updated_at',
    ]
    list_filter = ['identity_flag', 'ai_verified_same_person']
    search_fields = ['full_name_on_id', 'nid_number', 'license_number', 'user__phone_number']
    readonly_fields = [
        'ai_verified_same_person', 'ai_confidence',
        'ai_nid_name', 'ai_license_name', 'updated_at',
    ]
    fieldsets = (
        ('Identity Documents', {
            'fields': ('user', 'full_name_on_id', 'nid_number', 'license_number',
                       'nid_image_url', 'license_image_url'),
        }),
        ('AI Verification', {
            'fields': ('ai_verified_same_person', 'ai_confidence', 'ai_nid_name', 'ai_license_name'),
        }),
        ('Admin Review', {
            'fields': ('identity_flag', 'identity_flag_reason'),
            'classes': ('wide',),
        }),
    )


@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ['origin', 'destination', 'driver', 'departure_datetime', 'status', 'available_seats']
    list_filter = ['status']
    search_fields = ['origin', 'destination', 'driver__phone_number']


admin.site.register(Booking)
admin.site.register(RideStop)
admin.site.register(Location)