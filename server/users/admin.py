from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from .models import User, VerificationCode
from core.admin import admin_site


@admin.register(User, site=admin_site)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = [
        "phone_number", "full_name", "email", "is_driver",
        "is_verified", "avatar_preview", "date_joined",
    ]
    list_filter = ["is_driver", "is_verified", "is_staff", "preferred_language"]
    search_fields = ["phone_number", "email", "first_name", "last_name"]
    ordering = ["-date_joined"]
    readonly_fields = ["date_joined", "last_login", "avatar_preview_large"]

    fieldsets = (
        ("Account", {
            "fields": ("phone_number", "username", "email", "password"),
        }),
        ("Personal Info", {
            "fields": ("first_name", "last_name", "preferred_language", "avatar_url", "avatar_preview_large"),
        }),
        ("Status", {
            "fields": ("is_verified", "is_driver", "is_active", "is_staff", "is_superuser"),
        }),
        ("Dates", {
            "fields": ("date_joined", "last_login"),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone_number", "email", "first_name", "last_name", "password1", "password2"),
        }),
    )

    @admin.display(description="Name")
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or "—"

    @admin.display(description="Avatar")
    def avatar_preview(self, obj):
        if obj.avatar_url:
            return format_html(
                '<img src="{}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />',
                obj.avatar_url,
            )
        initials = f"{obj.first_name[:1]}{obj.last_name[:1]}".upper()
        return format_html(
            '<div style="width:32px;height:32px;border-radius:50%;background:#2563EB;'
            'color:white;display:flex;align-items:center;justify-content:center;'
            'font-size:12px;font-weight:700;">{}</div>',
            initials,
        )

    @admin.display(description="Avatar Preview")
    def avatar_preview_large(self, obj):
        if obj.avatar_url:
            return format_html(
                '<img src="{}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;" />',
                obj.avatar_url,
            )
        return "No avatar uploaded"


@admin.register(VerificationCode, site=admin_site)
class VerificationCodeAdmin(ModelAdmin):
    list_display = ["user", "code", "is_used", "is_valid_display", "created_at"]
    list_filter = ["is_used"]
    search_fields = ["user__phone_number", "user__email"]
    readonly_fields = ["created_at"]

    @admin.display(description="Valid?", boolean=True)
    def is_valid_display(self, obj):
        return obj.is_valid()