import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_RIDE_BOOKED = 'ride_booked'
    TYPE_RIDE_FULL = 'ride_full'
    TYPE_RIDE_EDITED = 'ride_edited'
    TYPE_BOOKING_CONFIRMED = 'booking_confirmed'
    TYPE_RIDE_CANCELLED = 'ride_cancelled'
    TYPE_FARE_RELEASED = 'fare_released'
    TYPE_NO_SHOW_REFUND = 'no_show_refund'
    TYPE_ARRIVAL_CONFIRMATION_REQUESTED = 'arrival_confirmation_requested'

    TYPES = [
        (TYPE_RIDE_BOOKED, 'Ride Booked'),
        (TYPE_RIDE_FULL, 'Ride Full'),
        (TYPE_RIDE_EDITED, 'Ride Edited'),
        (TYPE_BOOKING_CONFIRMED, 'Booking Confirmed'),
        (TYPE_RIDE_CANCELLED, 'Ride Cancelled'),
        (TYPE_FARE_RELEASED, 'Fare Released'),
        (TYPE_NO_SHOW_REFUND, 'No-show Refund'),
        (TYPE_ARRIVAL_CONFIRMATION_REQUESTED, 'Arrival Confirmation Requested'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=30, choices=TYPES)
    title = models.CharField(max_length=255)
    body = models.CharField(max_length=500)
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    actor_name = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} → {self.recipient}"


class PushSubscription(models.Model):
    """Stores a user's browser Web Push subscription."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'push_subscriptions'

    def __str__(self):
        return f"{self.user} — {self.endpoint[:60]}…"