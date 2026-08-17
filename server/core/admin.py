from unfold.sites import UnfoldAdminSite
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.utils.html import format_html
from django.urls import path
from django.template.response import TemplateResponse
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def user_count(request):
    return str(User.objects.count())

def driver_count(request):
    from rides.models import DriverProfile
    return str(DriverProfile.objects.count())

class PamojaAdminSite(UnfoldAdminSite):
    site_header = "Pamoja Rides"
    site_title = "Pamoja Rides Admin"
    index_title = "Dashboard"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path("payments/", self.admin_view(self.payments_view), name="payments"),
        ]
        return custom + urls

    def index(self, request, extra_context=None):
        from rides.models import Ride, Booking, DriverProfile

        now = timezone.now()
        week_ago = now - timedelta(days=7)

        extra_context = extra_context or {}
        extra_context.update({
            "stats_list": [
                {"title": "Total Users",      "value": User.objects.count(),                                           "icon": "group",                "color": "#2563EB"},
                {"title": "Active Drivers",   "value": User.objects.filter(is_driver=True).count(),                   "icon": "badge",                "color": "#7C3AED"},
                {"title": "Active Rides",     "value": Ride.objects.filter(status="active", departure_datetime__gt=now).count(), "icon": "directions_car", "color": "#16A34A"},
                {"title": "Total Bookings",   "value": Booking.objects.count(),                                        "icon": "confirmation_number",  "color": "#D97706"},
                {"title": "New Users (7d)",   "value": User.objects.filter(date_joined__gte=week_ago).count(),         "icon": "person_add",           "color": "#0891B2"},
                {"title": "Bookings (7d)",    "value": Booking.objects.filter(created_at__gte=week_ago).count(),       "icon": "trending_up",          "color": "#059669"},
                {"title": "Cancelled Rides",  "value": Ride.objects.filter(status="cancelled").count(),                "icon": "cancel",               "color": "#DC2626"},
                {"title": "Flagged Profiles", "value": DriverProfile.objects.filter(identity_flag=True).count(),       "icon": "flag",                 "color": "#EA580C"},
            ],
            "recent_rides":    Ride.objects.select_related("driver").order_by("-created_at")[:6],
            "flagged_profiles": DriverProfile.objects.filter(identity_flag=True).count(),
            "flagged_drivers":  DriverProfile.objects.filter(identity_flag=True).select_related("user")[:5],
        })
        return super().index(request, extra_context)

    def payments_view(self, request):
        context = {
            **self.each_context(request),
            "title": "Payments — Escrow",
            "subtitle": "Coming soon",
        }
        return TemplateResponse(request, "admin/payments_placeholder.html", context)

# CRITICAL: Name must be "admin" for Unfold's internal templates to work
admin_site = PamojaAdminSite(name="admin")