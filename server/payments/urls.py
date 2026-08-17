from django.urls import path
from .views import (
    InitiatePaymentView, PaymentStatusView, PaymentCallbackView,
    ReportNoShowView, MyRidePaymentView, EarningsView, ConfirmArrivalView,
    RequestArrivalConfirmationView, SimulatePaymentSuccessView,
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('<uuid:payment_id>/status/', PaymentStatusView.as_view(), name='payment-status'),
    path('<uuid:payment_id>/no-show/', ReportNoShowView.as_view(), name='payment-no-show'),
    path('<uuid:payment_id>/confirm-arrival/', ConfirmArrivalView.as_view(), name='confirm-arrival'),
    path('<uuid:payment_id>/request-arrival-confirmation/', RequestArrivalConfirmationView.as_view(), name='request-arrival-confirmation'),
    path('<uuid:payment_id>/simulate-success/', SimulatePaymentSuccessView.as_view(), name='simulate-success'),
    path('ride/<uuid:ride_id>/mine/', MyRidePaymentView.as_view(), name='my-ride-payment'),
    path('callback/', PaymentCallbackView.as_view(), name='payment-callback'),
    path('earnings/', EarningsView.as_view(), name='earnings'),
]