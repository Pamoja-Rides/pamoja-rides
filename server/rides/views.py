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

from .models import Ride, DriverProfile, Booking
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
        queryset = Ride.objects.filter(
            status='active',
            departure_datetime__gt=timezone.now()
        ).order_by('?')[:10]

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
                }
            )
            user.is_driver = True
            user.save()

        serializer = RideCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(driver=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookRideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, ride_id):
        try:
            ride = Ride.objects.select_for_update().get(id=ride_id)
        except Ride.DoesNotExist:
            return Response({"error": "Ride not found"}, status=404)

        seats = int(request.data.get("seats", 1))

        if ride.available_seats < seats:
            return Response({"error": "Not enough seats"}, status=400)

        Booking.objects.create(
            ride=ride,
            passenger=request.user,
            seats_booked=seats
        )

        ride.available_seats = F('available_seats') - seats
        ride.save()
        ride.refresh_from_db()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "ride_updates",
            {
                "type": "seat_update",
                "ride_id": str(ride.id),
                "available_seats": ride.available_seats
            }
        )

        return Response({"message": "Booked successfully"})


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