import uuid
from django.db import models
from django.conf import settings


class DriverProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    nid_number = models.CharField(max_length=50, unique=True)
    license_number = models.CharField(max_length=50, unique=True)
    full_name_on_id = models.CharField(max_length=255)
    nid_image_url = models.URLField(max_length=500)
    license_image_url = models.URLField(max_length=500)

    # AI verification results
    ai_verified_same_person = models.BooleanField(default=False)
    ai_confidence = models.CharField(max_length=50, blank=True)
    ai_nid_name = models.CharField(max_length=255, blank=True)
    ai_license_name = models.CharField(max_length=255, blank=True)

    # Admin review flag
    identity_flag = models.BooleanField(
        default=False,
        help_text="Flagged for admin review due to identity mismatch.",
    )
    identity_flag_reason = models.TextField(
        blank=True,
        help_text="Explanation of why this profile was flagged.",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'driver_profiles'

    def __str__(self):
        return f"{self.full_name_on_id} ({self.user})"


class Ride(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rides_driven'
    )
    origin = models.CharField(max_length=255)
    origin_lat = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    origin_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    destination = models.CharField(max_length=255)
    destination_lat = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    destination_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    pickup_point = models.CharField(max_length=255)
    pickup_lat = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    pickup_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    departure_datetime = models.DateTimeField()
    car_model = models.CharField(max_length=100)
    license_plate = models.CharField(max_length=20)
    available_seats = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default='active')
    price_per_seat = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rides'
        ordering = ['-created_at']


class RideStop(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=255)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    order = models.PositiveIntegerField()

    class Meta:
        db_table = 'ride_stops'
        ordering = ['order']


class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='bookings')
    passenger = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    seats_booked = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings'


class Location(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    district = models.CharField(max_length=255, blank=True)
    province = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    class Meta:
        db_table = 'locations'