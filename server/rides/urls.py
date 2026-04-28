from django.urls import path
from .views import (
    RideListCreateView,
    RideSearchView,
    BookRideView,
    MyBookingsView,
    MyPostedRidesView,
    MyBookedRidesView,
    RidePassengersView,
)

urlpatterns = [
    path('', RideListCreateView.as_view(), name='ride-list-create'),
    path('search/', RideSearchView.as_view(), name='ride-search'),
    path('my-posted/', MyPostedRidesView.as_view(), name='my-posted-rides'),
    path('my-booked/', MyBookedRidesView.as_view(), name='my-booked-rides'),
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
    path('<uuid:ride_id>/book/', BookRideView.as_view(), name='book-ride'),
    path('<uuid:ride_id>/passengers/', RidePassengersView.as_view(), name='ride-passengers'),
]