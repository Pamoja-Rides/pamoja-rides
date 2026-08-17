from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Notification, PushSubscription
from core.admin import admin_site


@admin.register(Notification, site=admin_site)
class NotificationAdmin(ModelAdmin):
    list_display = ["type_badge", "recipient_name", "title", "is_read", "created_at"]
    list_filter = ["type", "is_read", "created_at"]
    search_fields = ["recipient__phone_number", "title", "body"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]

    TYPE_COLORS = {
        "ride_booked": "#2563EB",
        "booking_confirmed": "#16A34A",
        "ride_full": "#D97706",
        "ride_edited": "#7C3AED",
        "ride_cancelled": "#DC2626",
    }

    @admin.display(description="Type")
    def type_badge(self, obj):
        color = self.TYPE_COLORS.get(obj.type, "#6B7280")
        label = obj.type.replace("_", " ").title()
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>', color, label
        )

    @admin.display(description="Recipient")
    def recipient_name(self, obj):
        return f"{obj.recipient.first_name} {obj.recipient.last_name}".strip() or obj.recipient.phone_number


@admin.register(PushSubscription, site=admin_site)
class PushSubscriptionAdmin(ModelAdmin):
    list_display = ["user_name", "short_endpoint", "created_at"]
    search_fields = ["user__phone_number", "user__first_name"]
    readonly_fields = ["endpoint", "p256dh", "auth", "created_at"]
    ordering = ["-created_at"]

    @admin.display(description="User")
    def user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.phone_number

    @admin.display(description="Endpoint")
    def short_endpoint(self, obj):
        return f"{obj.endpoint[:60]}…"