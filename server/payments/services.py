"""
Escrow-lite business logic.

Flow:
  1. Passenger pays fare_amount + service_fee up front (InitiatePaymentView).
  2. On MoMo confirmation, the fare portion is marked LOCKED (escrow held).
     The service fee is Pamoja's regardless of outcome.
  3. When the driver marks the ride's destination as arrived, every locked
     payment on that ride is released: driver receives fare - commission,
     Pamoja keeps the commission + the service fee it already had.
  4. If a passenger reports a no-show before arrival, their full amount
     (fare + service fee) is refunded and the driver is flagged.
"""
import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Payment
from .momo_client import MomoDisbursementClient, MomoError


def _round(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def compute_escrow_split(fare_amount: Decimal) -> tuple[Decimal, Decimal]:
    """Returns (commission_amount, driver_payout_amount) for a given fare."""
    commission = _round(fare_amount * Decimal(str(settings.COMMISSION_RATE)))
    payout = fare_amount - commission
    return commission, payout


def lock_escrow(payment: Payment) -> None:
    """Called right after a Payment transitions to SUCCESSFUL."""
    if payment.fare_amount is None:
        # Legacy/malformed payment without a fare split — nothing to escrow.
        return
    commission, payout = compute_escrow_split(payment.fare_amount)
    payment.commission_amount = commission
    payment.driver_payout_amount = payout
    payment.escrow_status = Payment.ESCROW_LOCKED
    payment.save(update_fields=[
        'commission_amount', 'driver_payout_amount', 'escrow_status', 'updated_at',
    ])


@transaction.atomic
def release_escrow_for_payment(payment: Payment) -> Payment:
    """
    Disburses a single locked payment to the driver's MoMo.
    Called when the PASSENGER who made this payment confirms their own
    arrival — each passenger on a ride triggers their own payout,
    independent of other passengers on the same ride.
    Never raises — disbursement failures are recorded on the payment
    itself so a MoMo outage doesn't block the passenger from confirming
    arrival.
    """
    ride = payment.ride
    driver_phone = ride.driver.phone_number

    if not driver_phone:
        # Fall back to the phone number collected on the driver permit
        # form (DriverProfile), which exists even for Google-only accounts
        # that never set a phone number on their user record.
        driver_phone = getattr(
            getattr(ride.driver, 'driver_profile', None), 'phone_number', ''
        )

    if not driver_phone:
        payment.disbursement_status = Payment.DISBURSEMENT_FAILED
        payment.disbursement_reason = "Driver has no MoMo phone number on file"
        payment.save(update_fields=['disbursement_status', 'disbursement_reason', 'updated_at'])
        return payment

    if payment.driver_payout_amount is None:
        commission, payout = compute_escrow_split(payment.fare_amount or Decimal('0'))
        payment.commission_amount = commission
        payment.driver_payout_amount = payout

    client = MomoDisbursementClient()

    disbursement_ref = uuid.uuid4()
    payment.disbursement_reference = disbursement_ref
    payment.disbursement_status = Payment.DISBURSEMENT_PENDING

    try:
        client.transfer(
            reference_id=disbursement_ref,
            phone_number=driver_phone,
            amount=str(payment.driver_payout_amount),
            payer_message=f"Fare payout — {ride.origin} to {ride.destination}",
            payee_note=f"Fare payout — {ride.origin} to {ride.destination}",
        )
        payment.disbursement_status = Payment.DISBURSEMENT_SUCCESSFUL
        payment.escrow_status = Payment.ESCROW_RELEASED
        payment.released_at = timezone.now()
    except MomoError as e:
        payment.disbursement_status = Payment.DISBURSEMENT_FAILED
        payment.disbursement_reason = str(e)
        # escrow_status stays LOCKED so it can be retried later.

    payment.save(update_fields=[
        'disbursement_reference', 'disbursement_status', 'disbursement_reason',
        'escrow_status', 'released_at', 'commission_amount', 'driver_payout_amount',
        'updated_at',
    ])

    return payment


@transaction.atomic
def refund_no_show(payment: Payment) -> Payment:
    """
    Full refund (fare + service fee) to the passenger. Also flags the
    driver's profile. Raises MomoError if the transfer itself fails —
    callers should surface that to the passenger rather than silently
    marking it refunded.
    """
    refund_ref = uuid.uuid4()
    client = MomoDisbursementClient()
    client.transfer(
        reference_id=refund_ref,
        phone_number=payment.phone_number,
        amount=str(payment.amount),
        payer_message=f"No-show refund — {payment.ride.origin} to {payment.ride.destination}",
        payee_note=f"No-show refund — {payment.ride.origin} to {payment.ride.destination}",
    )

    payment.refund_reference = refund_ref
    payment.refund_status = Payment.DISBURSEMENT_SUCCESSFUL
    payment.escrow_status = Payment.ESCROW_REFUNDED
    payment.no_show_at = timezone.now()
    payment.save(update_fields=[
        'refund_reference', 'refund_status', 'escrow_status', 'no_show_at', 'updated_at',
    ])

    driver_profile = getattr(payment.ride.driver, 'driver_profile', None)
    if driver_profile is not None:
        driver_profile.no_show_count = driver_profile.no_show_count + 1
        driver_profile.save(update_fields=['no_show_count'])

    return payment
