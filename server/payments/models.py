import uuid
from django.db import models
from django.conf import settings


class Payment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_SUCCESSFUL = 'successful'
    STATUS_FAILED = 'failed'

    STATUSES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUCCESSFUL, 'Successful'),
        (STATUS_FAILED, 'Failed'),
    ]

    # Escrow-lite lifecycle for the fare portion of a successful payment.
    # NONE      — payment isn't successful yet, nothing is held.
    # LOCKED    — fare is held; released to the driver on arrival.
    # RELEASED  — fare was disbursed to the driver's MoMo.
    # REFUNDED  — full amount was refunded to the passenger (e.g. no-show).
    ESCROW_NONE = 'none'
    ESCROW_LOCKED = 'locked'
    ESCROW_RELEASED = 'released'
    ESCROW_REFUNDED = 'refunded'

    ESCROW_STATUSES = [
        (ESCROW_NONE, 'None'),
        (ESCROW_LOCKED, 'Locked'),
        (ESCROW_RELEASED, 'Released'),
        (ESCROW_REFUNDED, 'Refunded'),
    ]

    DISBURSEMENT_NONE = ''
    DISBURSEMENT_PENDING = 'pending'
    DISBURSEMENT_SUCCESSFUL = 'successful'
    DISBURSEMENT_FAILED = 'failed'

    DISBURSEMENT_STATUSES = [
        (DISBURSEMENT_NONE, 'None'),
        (DISBURSEMENT_PENDING, 'Pending'),
        (DISBURSEMENT_SUCCESSFUL, 'Successful'),
        (DISBURSEMENT_FAILED, 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey('rides.Ride', on_delete=models.CASCADE, related_name='payments')
    seats_requested = models.PositiveIntegerField(default=1)
    booking = models.ForeignKey(
        'rides.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reference_id = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20)

    # amount = fare_amount + service_fee. This is what's actually collected
    # from the passenger via MoMo requesttopay.
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='RWF')
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_PENDING)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- escrow-lite fields ---
    fare_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    driver_payout_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    escrow_status = models.CharField(max_length=20, choices=ESCROW_STATUSES, default=ESCROW_NONE)
    released_at = models.DateTimeField(null=True, blank=True)
    no_show_at = models.DateTimeField(null=True, blank=True)

    # Set when the DRIVER nudges the passenger to confirm arrival, so the
    # payout doesn't rely solely on the passenger remembering on their own.
    arrival_confirmation_requested_at = models.DateTimeField(null=True, blank=True)

    disbursement_reference = models.UUIDField(null=True, blank=True, unique=True)
    disbursement_status = models.CharField(
        max_length=20, choices=DISBURSEMENT_STATUSES, default=DISBURSEMENT_NONE, blank=True
    )
    disbursement_reason = models.CharField(max_length=255, blank=True)

    refund_reference = models.UUIDField(null=True, blank=True, unique=True)
    refund_status = models.CharField(
        max_length=20, choices=DISBURSEMENT_STATUSES, default=DISBURSEMENT_NONE, blank=True
    )

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference_id} · {self.status} · {self.amount} {self.currency}"