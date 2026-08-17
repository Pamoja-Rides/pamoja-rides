from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from unfold.admin import ModelAdmin, TabularInline
from .models import Ride, Booking, DriverProfile, RideStop, Location
from core.admin import admin_site


class RideStopInline(TabularInline):
    model = RideStop
    extra = 0
    fields = ["order", "name", "lat", "lng"]
    ordering = ["order"]


class BookingInline(TabularInline):
    model = Booking
    extra = 0
    fields = ["passenger", "seats_booked", "created_at"]
    readonly_fields = ["created_at"]
    show_change_link = True

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("passenger")


@admin.register(DriverProfile, site=admin_site)
class DriverProfileAdmin(ModelAdmin):
    list_display = [
        "full_name_on_id", "user_phone", "nid_number",
        "license_number", "identity_status", "ai_confidence", "updated_at",
    ]
    list_filter = ["identity_flag", "ai_verified_same_person", "ai_confidence"]
    search_fields = ["full_name_on_id", "nid_number", "license_number", "user__phone_number"]
    readonly_fields = [
        "ai_verified_same_person", "ai_confidence", "ai_nid_name",
        "ai_license_name", "updated_at", "nid_preview", "license_preview",
    ]
    ordering = ["-updated_at"]

    fieldsets = (
        ("Driver", {
            "fields": ("user",),
        }),
        ("Identity Documents", {
            "fields": (
                "full_name_on_id", "nid_number", "nid_image_url", "nid_preview",
                "license_number", "license_image_url", "license_preview",
            ),
        }),
        ("AI Verification", {
            "fields": ("ai_verified_same_person", "ai_confidence", "ai_nid_name", "ai_license_name"),
        }),
        ("Admin Review", {
            "fields": ("identity_flag", "identity_flag_reason"),
        }),
    )

    @admin.display(description="Phone")
    def user_phone(self, obj):
        return obj.user.phone_number or "—"

    @admin.display(description="Identity")
    def identity_status(self, obj):
        if obj.identity_flag:
            return format_html(
                '<span style="color:{};font-weight:600;">{}</span>',
                "#DC2626",
                "⚠ Flagged",
            )
        if obj.ai_verified_same_person:
            return format_html(
                '<span style="color:{};font-weight:600;">{}</span>',
                "#16A34A",
                "✓ Verified",
            )
        return format_html('<span style="color:{};">{}</span>', "#6B7280", "Pending")

    @admin.display(description="NID")
    def nid_preview(self, obj):
        if obj.nid_image_url and obj.nid_image_url.startswith("http"):
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" style="max-width:200px;border-radius:8px;" /></a>',
                obj.nid_image_url, obj.nid_image_url,
            )
        return "—"

    @admin.display(description="License")
    def license_preview(self, obj):
        if obj.license_image_url and obj.license_image_url.startswith("http"):
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" style="max-width:200px;border-radius:8px;" /></a>',
                obj.license_image_url, obj.license_image_url,
            )
        return "—"


@admin.register(Ride, site=admin_site)
class RideAdmin(ModelAdmin):
    list_display = [
        "route", "driver_name", "departure_datetime",
        "available_seats", "price_per_seat", "status_badge", "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["origin", "destination", "driver__phone_number", "driver__first_name"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]
    inlines = [RideStopInline, BookingInline]

    fieldsets = (
        ("Route", {
            "fields": (
                "driver", "origin", "origin_lat", "origin_lng",
                "destination", "destination_lat", "destination_lng",
                "pickup_point", "pickup_lat", "pickup_lng",
            ),
        }),
        ("Ride Info", {
            "fields": ("departure_datetime", "car_model", "license_plate", "available_seats", "price_per_seat"),
        }),
        ("Status", {
            "fields": ("status", "created_at"),
        }),
    )

    @admin.display(description="Route")
    def route(self, obj):
        return f"{obj.origin} → {obj.destination}"

    @admin.display(description="Driver")
    def driver_name(self, obj):
        return f"{obj.driver.first_name} {obj.driver.last_name}".strip()

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            "active": "#16A34A",
            "cancelled": "#DC2626",
            "pending_review": "#D97706",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="color:{};font-weight:600;text-transform:capitalize;">{}</span>',
            color, obj.status.replace("_", " "),
        )


@admin.register(Booking, site=admin_site)
class BookingAdmin(ModelAdmin):
    list_display = ["passenger_name", "ride_route", "seats_booked", "created_at"]
    list_filter = ["created_at"]
    search_fields = [
        "passenger__phone_number", "passenger__first_name",
        "ride__origin", "ride__destination",
    ]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("passenger", "ride")

    @admin.display(description="Passenger")
    def passenger_name(self, obj):
        return f"{obj.passenger.first_name} {obj.passenger.last_name}".strip()

    @admin.display(description="Ride")
    def ride_route(self, obj):
        return f"{obj.ride.origin} → {obj.ride.destination}"


@admin.register(Location, site=admin_site)
class LocationAdmin(ModelAdmin):
    list_display = ["name", "district", "province", "latitude", "longitude"]
    list_filter = ["province"]
    search_fields = ["name", "district", "province"]
    ordering = ["name"]