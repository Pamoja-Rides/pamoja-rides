from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    pickup_code = serializers.SerializerMethodField()
    pickup_confirmed_at = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'ride', 'seats_requested', 'booking', 'reference_id',
            'phone_number', 'amount', 'currency', 'status', 'reason', 'created_at',
            'fare_amount', 'service_fee', 'commission_amount', 'driver_payout_amount',
            'escrow_status', 'released_at', 'no_show_at',
            'arrival_confirmation_requested_at',
            'disbursement_status', 'refund_status',
            'pickup_code', 'pickup_confirmed_at',
        ]

    def get_pickup_code(self, obj):
        return obj.booking.pickup_code if obj.booking_id else None

    def get_pickup_confirmed_at(self, obj):
        return obj.booking.pickup_confirmed_at if obj.booking_id else None