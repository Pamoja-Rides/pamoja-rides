from django.db.models.signals import post_save
from django.dispatch import receiver
from rides.models import Booking, Ride
from .models import Notification
from .utils import create_and_push


@receiver(post_save, sender=Booking)
def on_booking_created(sender, instance, created, **kwargs):
    if not created:
        return

    booking = instance
    ride = booking.ride
    passenger = booking.passenger
    driver = ride.driver

    passenger_name = f"{passenger.first_name} {passenger.last_name}".strip()
    seats = booking.seats_booked

    # 1. Notify driver: someone booked their ride
    create_and_push(
        recipient=driver,
        type_=Notification.TYPE_RIDE_BOOKED,
        title="New booking!",
        body=f"{passenger_name} booked {seats} seat{'s' if seats > 1 else ''} on your ride from {ride.origin} to {ride.destination}.",
        ride=ride,
        actor_name=passenger_name,
    )

    # 2. Notify passenger: booking confirmed
    create_and_push(
        recipient=passenger,
        type_=Notification.TYPE_BOOKING_CONFIRMED,
        title="Booking confirmed!",
        body=f"Your {seats} seat{'s' if seats > 1 else ''} on the ride from {ride.origin} to {ride.destination} {'are' if seats > 1 else 'is'} confirmed.",
        ride=ride,
        actor_name=f"{driver.first_name} {driver.last_name}".strip(),
    )

    # 3. If ride is now full, notify driver
    ride.refresh_from_db()
    if ride.available_seats == 0:
        create_and_push(
            recipient=driver,
            type_=Notification.TYPE_RIDE_FULL,
            title="Your ride is fully booked!",
            body=f"All seats on your ride from {ride.origin} to {ride.destination} have been filled.",
            ride=ride,
        )