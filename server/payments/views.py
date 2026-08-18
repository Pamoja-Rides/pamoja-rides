from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status as http_status
from django.conf import settings
from django.db import transaction
from django.db.models import F, Sum, Count, Q
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from rides.models import Ride, Booking
from rides.serializers import RideSerializer
from notifications.utils import create_and_push
from notifications.models import Notification
from .models import Payment
from .serializers import PaymentSerializer
from .momo_client import MomoClient, MomoError
from .services import lock_escrow, refund_no_show, release_escrow_for_payment


class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/
    Body: { "ride_id": "<uuid>", "seats": 1, "phone_number": "2507..." }

    Charges the passenger the booking fee BEFORE any booking is created.
    No seats are reserved at this point — the ride remains fully open
    until payment is confirmed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ride_id = request.data.get('ride_id')
        seats = int(request.data.get('seats', 1))
        phone_number = request.data.get('phone_number')

        if not ride_id or not phone_number:
            return Response({"error": "ride_id and phone_number are required"}, status=400)

        try:
            ride = Ride.objects.get(id=ride_id)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)

        if ride.driver == request.user:
            return Response({"error": "You cannot book your own ride"}, status=400)

        if ride.status != 'active':
            return Response({"error": "This ride is no longer available"}, status=400)

        if ride.available_seats < seats:
            return Response({"error": "Not enough seats available"}, status=400)

        # Escrow-lite: passenger pays the fare (held for the driver until
        # arrival) plus Pamoja's flat service fee (kept regardless of outcome).
        fare_amount = Decimal(ride.price_per_seat) * seats
        service_fee = Decimal(settings.BOOKING_FEE_RWF)
        amount = fare_amount + service_fee

        payment = Payment.objects.create(
            ride=ride,
            seats_requested=seats,
            payer=request.user,
            phone_number=phone_number,
            amount=amount,
            fare_amount=fare_amount,
            service_fee=service_fee,
            currency='RWF',
            status=Payment.STATUS_PENDING,
        )

        try:
            MomoClient().request_to_pay(
                reference_id=payment.reference_id,
                phone_number=phone_number,
                amount=amount,
                payer_message=f"Booking fee — {ride.origin} to {ride.destination}",
            )
        except MomoError as e:
            payment.status = Payment.STATUS_FAILED
            payment.reason = str(e)
            payment.save()
            return Response({"error": "Failed to initiate payment", "detail": str(e)}, status=502)

        return Response(PaymentSerializer(payment).data, status=http_status.HTTP_201_CREATED)


class PaymentStatusView(APIView):
    """
    GET /api/payments/<payment_id>/status/

    Frontend polls this. Once MoMo confirms SUCCESSFUL, the booking is
    created here — this is the only place a Booking gets made for a
    paid ride, guaranteeing payment always precedes booking.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def get(self, request, payment_id):
        try:
            payment = Payment.objects.select_related('ride').get(id=payment_id, payer=request.user)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status != Payment.STATUS_PENDING:
            return Response(PaymentSerializer(payment).data)

        try:
            result = MomoClient().get_transaction_status(payment.reference_id)
        except MomoError as e:
            return Response({"error": str(e)}, status=502)

        momo_status = result.get('status')

        if momo_status == 'SUCCESSFUL' and not payment.booking_id:
            ride = Ride.objects.select_for_update().get(id=payment.ride_id)

            if ride.status != 'active':
                payment.status = Payment.STATUS_FAILED
                payment.reason = "Ride was cancelled before payment completed"
                payment.save()
                return Response(PaymentSerializer(payment).data)

            if ride.available_seats < payment.seats_requested:
                payment.status = Payment.STATUS_FAILED
                payment.reason = "Seats no longer available"
                payment.save()
                return Response(PaymentSerializer(payment).data)

            booking = Booking.objects.create(
                ride=ride, passenger=request.user, seats_booked=payment.seats_requested
            )
            ride.available_seats = F('available_seats') - payment.seats_requested
            ride.save()
            ride.refresh_from_db()

            payment.booking = booking
            payment.status = Payment.STATUS_SUCCESSFUL
            payment.save()
            lock_escrow(payment)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'ride_updates',
                {
                    'type': 'broadcast_seat_update',
                    'ride_id': str(ride.id),
                    'available_seats': ride.available_seats,
                },
            )
        elif momo_status == 'FAILED':
            payment.status = Payment.STATUS_FAILED
            payment.reason = result.get('reason', '')
            payment.save()

        return Response(PaymentSerializer(payment).data)


class MyRidePaymentView(APIView):
    """
    GET /api/payments/ride/<ride_id>/mine/

    Returns the requesting passenger's most recent payment for this ride
    (any status). Used by the client to restore escrow status — and the
    payment id needed for a no-show report — after a page reload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ride_id):
        payment = (
            Payment.objects.filter(ride_id=ride_id, payer=request.user)
            .order_by('-created_at')
            .first()
        )
        if not payment:
            return Response({"error": "No payment found for this ride"}, status=404)
        return Response(PaymentSerializer(payment).data)


class ReportNoShowView(APIView):
    """
    POST /api/payments/<payment_id>/no-show/

    Passenger-initiated. Only valid while the ride hasn't arrived at its
    destination and the fare is still locked in escrow. Refunds the full
    amount (fare + service fee) to the passenger's MoMo and flags the
    driver's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):
        try:
            payment = Payment.objects.select_related('ride', 'ride__driver').select_for_update().get(
                id=payment_id, payer=request.user
            )
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status != Payment.STATUS_SUCCESSFUL or payment.escrow_status != Payment.ESCROW_LOCKED:
            return Response(
                {"error": "This payment isn't eligible for a no-show refund"}, status=400
            )

        if payment.ride.arrived_at_destination:
            return Response(
                {"error": "Ride has already arrived at its destination"}, status=400
            )

        try:
            refund_no_show(payment)
        except MomoError as e:
            return Response({"error": "Refund failed", "detail": str(e)}, status=502)

        create_and_push(
            recipient=payment.ride.driver,
            type_=Notification.TYPE_NO_SHOW_REFUND,
            title="No-show reported",
            body=(
                f"A passenger reported a no-show on {payment.ride.origin} → "
                f"{payment.ride.destination}. They were fully refunded and you "
                f"will not be paid for this booking."
            ),
            ride=payment.ride,
        )

        return Response(PaymentSerializer(payment).data)


class RequestArrivalConfirmationView(APIView):
    """
    POST /api/payments/<payment_id>/request-arrival-confirmation/

    Driver-initiated. Lets the driver nudge a specific passenger to confirm
    their own arrival, instead of relying on the passenger to remember on
    their own. Sends a notification to the passenger; does NOT move any
    money by itself — the passenger still has to tap "Confirm arrival".
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, payment_id):
        try:
            payment = Payment.objects.select_related('ride', 'payer').get(
                id=payment_id, ride__driver=request.user
            )
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status != Payment.STATUS_SUCCESSFUL or payment.escrow_status != Payment.ESCROW_LOCKED:
            return Response(
                {"error": "This payment isn't awaiting an arrival confirmation"}, status=400
            )

        payment.arrival_confirmation_requested_at = timezone.now()
        payment.save(update_fields=['arrival_confirmation_requested_at', 'updated_at'])

        is_urgent = bool(request.data.get('urgent'))
        driver_name = f"{request.user.first_name} {request.user.last_name}".strip()
        create_and_push(
            recipient=payment.payer,
            type_=Notification.TYPE_ARRIVAL_CONFIRMATION_REQUESTED,
            title="Confirm your arrival" if not is_urgent else "Driver needs this payment released",
            body=(
                f"Your driver marked you as arrived at {payment.ride.destination}. "
                f"Confirm to release their payment."
                if not is_urgent else
                f"Your driver needs this payment released urgently for "
                f"{payment.ride.origin} → {payment.ride.destination}. "
                f"Please confirm your arrival if the ride was completed."
            ),
            ride=payment.ride,
            actor_name=driver_name,
        )

        return Response(PaymentSerializer(payment).data)


class ConfirmArrivalView(APIView):
    """
    POST /api/payments/<payment_id>/confirm-arrival/

    Passenger-initiated. The passenger who made this payment confirms
    THEIR OWN arrival at their destination. This releases only THIS
    payment's locked fare to the driver's MoMo — other passengers on
    the same ride are unaffected and confirm independently.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):
        try:
            payment = Payment.objects.select_related('ride', 'ride__driver').select_for_update().get(
                id=payment_id, payer=request.user
            )
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status != Payment.STATUS_SUCCESSFUL or payment.escrow_status != Payment.ESCROW_LOCKED:
            return Response(
                {"error": "This payment isn't eligible for an arrival payout"}, status=400
            )

        payment = release_escrow_for_payment(payment)

        if payment.disbursement_status == Payment.DISBURSEMENT_SUCCESSFUL:
            create_and_push(
                recipient=payment.ride.driver,
                type_=Notification.TYPE_FARE_RELEASED,
                title="Fare released",
                body=(
                    f"{payment.driver_payout_amount} RWF was sent to your MoMo for "
                    f"{payment.ride.origin} → {payment.ride.destination}."
                ),
                ride=payment.ride,
            )
            return Response(PaymentSerializer(payment).data)

        return Response(
            {
                "error": "Payout failed, will need to be retried",
                "detail": payment.disbursement_reason,
                "payment": PaymentSerializer(payment).data,
            },
            status=502,
        )


class PaymentCallbackView(APIView):
    """
    POST /api/payments/callback/
    MoMo's async webhook. Same booking-on-success logic as PaymentStatusView,
    in case the callback arrives before the frontend's next poll.
    """
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        reference_id = request.data.get('externalId') or request.data.get('referenceId')
        momo_status = request.data.get('status')

        if not reference_id:
            return Response({"error": "Missing reference"}, status=400)

        try:
            payment = Payment.objects.select_related('ride').get(reference_id=reference_id)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if momo_status == 'SUCCESSFUL' and not payment.booking_id:
            ride = Ride.objects.select_for_update().get(id=payment.ride_id)
            if ride.available_seats >= payment.seats_requested:
                booking = Booking.objects.create(
                    ride=ride, passenger=payment.payer, seats_booked=payment.seats_requested
                )
                ride.available_seats = F('available_seats') - payment.seats_requested
                ride.save()
                payment.booking = booking
                payment.status = Payment.STATUS_SUCCESSFUL
                payment.save()
                lock_escrow(payment)
                return Response({"status": "ok"})
            else:
                payment.status = Payment.STATUS_FAILED
                payment.reason = "Seats no longer available"
        elif momo_status == 'FAILED':
            payment.status = Payment.STATUS_FAILED
            payment.reason = request.data.get('reason', '')
        payment.save()

        return Response({"status": "ok"})

class SimulatePaymentSuccessView(APIView):
    """
    POST /api/payments/<payment_id>/simulate-success/
    DEBUG/sandbox only — immediately marks a payment as successful,
    creates the booking, and locks escrow. Allows full flow testing
    without a real MoMo subscription key.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):
        if not (settings.DEBUG or settings.ALLOW_SIMULATE):
            return Response({"error": "Not available in production"}, status=403)

        try:
            payment = Payment.objects.select_for_update().get(
                id=payment_id, payer=request.user
            )
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if payment.status == Payment.STATUS_SUCCESSFUL:
            return Response({"error": "Payment already confirmed"}, status=400)

        try:
            ride = Ride.objects.select_for_update().get(id=payment.ride_id)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)

        if ride.available_seats < payment.seats_requested:
            return Response({"error": "Not enough seats available"}, status=400)

        booking = Booking.objects.create(
            ride=ride,
            passenger=request.user,
            seats_booked=payment.seats_requested,
        )
        ride.available_seats = F('available_seats') - payment.seats_requested
        ride.save()
        ride.refresh_from_db()

        payment.booking = booking
        payment.status = Payment.STATUS_SUCCESSFUL
        payment.save()
        lock_escrow(payment)

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'ride_updates',
            {
                'type': 'broadcast_seat_update',
                'ride_id': str(ride.id),
                'available_seats': ride.available_seats,
            },
        )

        return Response(PaymentSerializer(payment).data)


class EarningsView(APIView):
    """
    GET /api/payments/earnings/?period=month|all

    Driver-only. Returns a summary + per-payment transaction list
    derived from Payment records where ride__driver == request.user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'month')

        qs = Payment.objects.filter(
            ride__driver=request.user,
            status=Payment.STATUS_SUCCESSFUL,
        ).select_related('ride', 'booking__passenger').order_by('-created_at')

        if period == 'month':
            now = timezone.now()
            qs = qs.filter(created_at__year=now.year, created_at__month=now.month)

        agg = qs.aggregate(
            total_payout=Sum('driver_payout_amount'),
            total_commission=Sum('commission_amount'),
            total_service_fee=Sum('service_fee'),
            rides_completed=Count('id', filter=Q(escrow_status=Payment.ESCROW_RELEASED)),
            rides_locked=Count('id', filter=Q(escrow_status=Payment.ESCROW_LOCKED)),
            rides_refunded=Count('id', filter=Q(escrow_status=Payment.ESCROW_REFUNDED)),
        )

        locked_amount = qs.filter(escrow_status=Payment.ESCROW_LOCKED).aggregate(
            v=Sum('driver_payout_amount')
        )['v'] or 0

        released_amount = qs.filter(escrow_status=Payment.ESCROW_RELEASED).aggregate(
            v=Sum('driver_payout_amount')
        )['v'] or 0

        transactions = []
        for p in qs:
            ride = p.ride
            booking = p.booking
            passenger = booking.passenger if booking else None
            transactions.append({
                'id': str(p.id),
                'route': f"{ride.origin} → {ride.destination}",
                'origin': ride.origin,
                'destination': ride.destination,
                'departure_datetime': ride.departure_datetime,
                'seats': p.seats_requested,
                'fare_amount': str(p.fare_amount or 0),
                'service_fee': str(p.service_fee or 0),
                'commission_amount': str(p.commission_amount or 0),
                'driver_payout_amount': str(p.driver_payout_amount or 0),
                'escrow_status': p.escrow_status,
                'disbursement_status': p.disbursement_status,
                'released_at': p.released_at,
                'no_show_at': p.no_show_at,
                'created_at': p.created_at,
                'passenger': {
                    'name': f"{passenger.first_name} {passenger.last_name}" if passenger else '—',
                    'phone': passenger.phone_number if passenger else '—',
                } if passenger else None,
            })

        return Response({
            'period': period,
            'summary': {
                'released_amount': str(released_amount),
                'locked_amount': str(locked_amount),
                'total_commission': str(agg['total_commission'] or 0),
                'total_service_fee': str(agg['total_service_fee'] or 0),
                'rides_completed': agg['rides_completed'] or 0,
                'rides_locked': agg['rides_locked'] or 0,
                'rides_refunded': agg['rides_refunded'] or 0,
            },
            'transactions': transactions,
        })