import os
import requests
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Ride, DriverProfile, Booking, RideStop
from .serializers import RideSerializer, RideCreateSerializer
from dotenv import load_dotenv

# Load .env
load_dotenv()


# -------------------------
# EXISTING (UNCHANGED CORE)
# -------------------------
class RideListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        qs = Ride.objects.filter(
            status='active',
            departure_datetime__gt=timezone.now(),
        ).prefetch_related('stops')
        if request.user.is_authenticated:
            qs = qs.exclude(driver=request.user)
        queryset = qs.order_by('?')[:10]
        return Response(RideSerializer(queryset, many=True).data)

    @transaction.atomic
    def post(self, request):
        user = request.user
        data = request.data
        nid_url = data.get('nid_image_url')
        lic_url = data.get('license_image_url')

        if nid_url and lic_url:
            DriverProfile.objects.update_or_create(
                user=user,
                defaults={
                    'nid_number': data.get('nid_number'),
                    'license_number': data.get('license_number'),
                    'full_name_on_id': data.get('full_name_on_id'),
                    'nid_image_url': nid_url,
                    'license_image_url': lic_url,
                },
            )
            user.is_driver = True
            user.save()

        serializer = RideCreateSerializer(data=data)
        if serializer.is_valid():
            ride = serializer.save(driver=user)
            stops = data.get('stops', [])
            for index, stop in enumerate(stops):
                if stop.get('name'):
                    RideStop.objects.create(
                        ride=ride,
                        name=stop['name'],
                        lat=stop.get('lat') or None,
                        lng=stop.get('lng') or None,
                        order=index,
                    )
            return Response(
                RideSerializer(Ride.objects.prefetch_related('stops').get(id=ride.id)).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RideSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Ride.objects.filter(
            status='active',
            departure_datetime__gt=timezone.now(),
        ).prefetch_related('stops').select_related('driver')

        if request.user.is_authenticated:
            qs = qs.exclude(driver=request.user)

        origin_q = request.query_params.get('origin', '').strip()
        destination_q = request.query_params.get('destination', '').strip()
        date_filter = request.query_params.get('date', '').strip()
        min_seats = request.query_params.get('seats', '').strip()
        max_price = request.query_params.get('max_price', '').strip()

        # Date filter
        now = timezone.now()
        if date_filter == 'today':
            qs = qs.filter(departure_datetime__date=now.date())
        elif date_filter == 'week':
            qs = qs.filter(departure_datetime__date__lte=now.date() + timedelta(days=7))
        elif date_filter == 'month':
            qs = qs.filter(departure_datetime__date__lte=now.date() + timedelta(days=30))

        if min_seats.isdigit():
            qs = qs.filter(available_seats__gte=int(min_seats))

        # Pre-filter by origin/destination to reduce Python-side work
        # A ride is a candidate if origin_q appears anywhere in its waypoints
        # and destination_q appears anywhere in its waypoints
        if origin_q:
            qs = qs.filter(
                Q(origin__icontains=origin_q) |
                Q(stops__name__icontains=origin_q)
            ).distinct()

        if destination_q:
            qs = qs.filter(
                Q(destination__icontains=destination_q) |
                Q(stops__name__icontains=destination_q)
            ).distinct()

        rides = list(qs.order_by('departure_datetime')[:200])

        # Price filter (CharField, done in Python)
        if max_price.isdigit():
            cap = int(max_price)
            rides = [r for r in rides if self._parse_price(r.price_per_seat) <= cap]

        # Ordering constraint: from must appear before to in the waypoint sequence
        if origin_q and destination_q:
            rides = [
                r for r in rides
                if self._from_before_to(r, origin_q, destination_q)
            ]

        return Response(RideSerializer(rides, many=True).data)

    @staticmethod
    def _waypoints(ride: Ride) -> list[dict]:
        """
        Returns the full ordered waypoint list for a ride:
        origin (order=0) → stops (order=1..n) → destination (order=n+1)
        """
        points = [{'name': ride.origin, 'order': 0}]
        for stop in ride.stops.all():  # already ordered by stop.order
            points.append({'name': stop.name, 'order': stop.order + 1})
        points.append({'name': ride.destination, 'order': len(points)})
        return points

    @staticmethod
    def _parse_price(value: str) -> int:
        try:
            return int(''.join(filter(str.isdigit, value)))
        except (ValueError, TypeError):
            return 0

    def _from_before_to(self, ride: Ride, from_q: str, to_q: str) -> bool:
        """
        Returns True only if the first waypoint matching from_q
        comes strictly before the first waypoint matching to_q.
        """
        waypoints = self._waypoints(ride)
        from_order = next(
            (wp['order'] for wp in waypoints if from_q.lower() in wp['name'].lower()),
            None,
        )
        to_order = next(
            (wp['order'] for wp in waypoints if to_q.lower() in wp['name'].lower()),
            None,
        )
        if from_order is None or to_order is None:
            return False
        return from_order < to_order

# In BookRideView.post — add self-booking guard right after the ride lookup:

class BookRideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.select_for_update().get(id=ride_id)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)

        if ride.driver == request.user:
            return Response({"error": "You cannot book your own ride"}, status=400)

        requested_seats = int(request.data.get('seats', 1))
        if ride.available_seats < requested_seats:
            return Response({"error": "Not enough seats available"}, status=400)

        Booking.objects.create(ride=ride, passenger=request.user, seats_booked=requested_seats)
        ride.available_seats = F('available_seats') - requested_seats
        ride.save()
        ride.refresh_from_db()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'ride_updates',
            {
                'type': 'broadcast_seat_update',
                'ride_id': str(ride.id),
                'available_seats': ride.available_seats,
            },
        )
        return Response({"message": "Booked successfully"}, status=201)


class RidePassengersView(APIView):
    """Returns the list of passengers who booked a ride. Only accessible by the ride's driver."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ride_id):
        try:
            ride = Ride.objects.get(id=ride_id, driver=request.user)
        except Ride.DoesNotExist:
            return Response({"error": "Not found or not authorized"}, status=404)

        bookings = (
            Booking.objects
            .filter(ride=ride)
            .select_related('passenger')
            .order_by('created_at')
        )

        data = [
            {
                "booking_id": str(b.id),
                "seats_booked": b.seats_booked,
                "booked_at": b.created_at.isoformat(),
                "passenger": {
                    "id": str(b.passenger.id),
                    "first_name": b.passenger.first_name,
                    "last_name": b.passenger.last_name,
                    "phone_number": b.passenger.phone_number,
                    "is_verified": b.passenger.is_verified,
                },
            }
            for b in bookings
        ]
        return Response(data)


# -------------------------
# NEW: Google Geocoding API
# -------------------------

class LocationDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        place_id = request.GET.get("place_id", "")
        if not place_id:
            return Response({"error": "place_id is required"}, status=400)

        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "geometry",
            "key": os.getenv('GOOGLE_MAPS_API_KEY')
        }

        try:
            res = requests.get(url, params=params)
            data = res.json()
            location = data.get("result", {}).get("geometry", {}).get("location", {})

            print("loc", location)
            
            return Response({
                "latitude": location.get("lat"),
                "longitude": location.get("lng")
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class LocationSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.GET.get("q", "")
        if not query or len(query) < 2:
            return Response([])

        # Use Places Autocomplete - This is what Google Maps uses
        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        
        params = {
            "input": query,
            "components": "country:RW",
            "key": os.getenv('GOOGLE_MAPS_API_KEY'),
            # 'geocode' captures addresses, 'establishment' captures businesses like Simba
            "types": "geocode|establishment" 
        }

        try:
            res = requests.get(url, params=params)
            data = res.json()

            if data.get("status") != "OK":
                return Response([])

            results = []
            for item in data.get("predictions", [])[:8]:
                # We use 'description' here because it matches the 
                # 'formatted_address' structure your frontend likely expects
                results.append({
                    "id": item.get("place_id"),
                    "name": item.get("description"), 
                    "main_text": item["structured_formatting"].get("main_text"),
                    "secondary_text": item["structured_formatting"].get("secondary_text"),
                    # Note: Autocomplete doesn't return Lat/Lng. 
                    # Your 'onSelect' should call a separate 'Details' endpoint 
                    # to get coordinates to save money on API calls.
                })

            return Response(results)
        except Exception as e:
            print(f"Error fetching locations: {e}")
            return Response([], status=500)


# -------------------------
# NEW: My bookings
# -------------------------
class MyBookingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ride_ids = Booking.objects.filter(
            passenger=request.user
        ).values_list("ride_id", flat=True)

        return Response({
            "booked_ride_ids": list(ride_ids)
        })

class MyPostedRidesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rides = (
            Ride.objects
            .filter(driver=request.user)
            .prefetch_related('stops')
            .order_by('-created_at')
        )
        return Response(RideSerializer(rides, many=True).data)


class MyBookedRidesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        bookings = (
            Booking.objects
            .filter(passenger=request.user)
            .select_related('ride__driver')
            .prefetch_related('ride__stops')
            .order_by('-created_at')
        )
        rides = [b.ride for b in bookings]
        return Response(RideSerializer(rides, many=True).data)