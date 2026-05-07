from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['type', 'recipient', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read']
    search_fields = ['recipient__phone_number', 'title', 'body']