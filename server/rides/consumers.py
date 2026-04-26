import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Ride, DriverProfile, Booking
from .serializers import RideSerializer, RideCreateSerializer

class RideConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'ride_updates'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        user = self.scope.get('user')

        if action == 'fetch_all':
            rides = await self.get_all_rides()

            await self.send(json.dumps({'type': 'ALL_RIDES', 'data': rides}))

        elif action == 'fetch_one':
            ride = await self.get_single_ride(data.get('ride_id'))
            await self.send(json.dumps({'type': 'SINGLE_RIDE', 'data': ride}))

        elif action == 'post_ride':
            if user.is_anonymous:
                await self.send(json.dumps({'type': 'ERROR', 'message': 'Unauthorized'}))
                return
            res = await self.create_ride(user, data)
            if res['status'] == 'success':
                await self.channel_layer.group_send(self.group_name, {'type': 'broadcast_new_ride', 'data': res['data']})
            else:
                await self.send(json.dumps({'type': 'ERROR', 'errors': res['errors']}))

        elif action == 'book_ride':
            if user.is_anonymous:
                await self.send(json.dumps({'type': 'ERROR', 'message': 'Unauthorized'}))
                return
            res = await self.perform_booking(data.get('ride_id'), user, data.get('seats', 1))
            if res['status'] == 'success':
                await self.channel_layer.group_send(self.group_name, {
                    'type': 'broadcast_seat_update', 
                    'ride_id': data.get('ride_id'), 
                    'available_seats': res['new_count']
                })

    # --- DB Helpers ---
    @database_sync_to_async
    def get_all_rides(self):
        user = self.scope.get('user')
        qs = Ride.objects.filter(status='active')
        if user and not user.is_anonymous:
            qs = qs.exclude(driver=user)
        return list(RideSerializer(qs, many=True).data)

    @database_sync_to_async
    def get_single_ride(self, r_id):
        try:
            return RideSerializer(Ride.objects.get(id=r_id)).data
        except: return None

    @database_sync_to_async
    def create_ride(self, user, data):
        try:
            with transaction.atomic():
                DriverProfile.objects.update_or_create(user=user, defaults={
                    'nid_number': data.get('nid_number'),
                    'license_number': data.get('license_number'),
                    'full_name_on_id': data.get('full_name_on_id'),
                    'nid_image_url': data.get('nid_image_url'),
                    'license_image_url': data.get('license_image_url'),
                })
                user.is_driver = True
                user.save()
                ser = RideCreateSerializer(data=data)
                if ser.is_valid():
                    ride = ser.save(driver=user)
                    return {'status': 'success', 'data': RideSerializer(ride).data}
                return {'status': 'error', 'errors': ser.errors}
        except Exception as e: return {'status': 'error', 'errors': str(e)}

    @database_sync_to_async
    def perform_booking(self, r_id, user, seats):
        try:
            with transaction.atomic():
                ride = Ride.objects.select_for_update().get(id=r_id)
                if ride.available_seats >= int(seats):
                    Booking.objects.create(ride=ride, passenger=user, seats_booked=seats)
                    ride.available_seats = F('available_seats') - int(seats)
                    ride.save()
                    ride.refresh_from_db()
                    return {'status': 'success', 'new_count': ride.available_seats}
                return {'status': 'error', 'message': 'Full'}
        except: return {'status': 'error'}

    # --- Handlers ---
    async def broadcast_new_ride(self, event): await self.send(json.dumps(event))
    async def broadcast_seat_update(self, event): await self.send(json.dumps(event))