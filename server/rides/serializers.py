from rest_framework import serializers
from .models import Ride, Location, RideStop
from users.serializers import UserSerializer 
from django.utils import timezone
from datetime import timedelta

class RideStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideStop
        fields = ['id', 'name', 'lat', 'lng', 'order']


class RideStopInputSerializer(serializers.Serializer):
    """Used only for writing stops when creating a ride."""
    name = serializers.CharField()
    lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

class RideSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    stops = RideStopSerializer(many=True, read_only=True)
    
    class Meta:
        model = Ride
        fields = '__all__'

class RideCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ride
        exclude = ['driver', 'status', 'created_at']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "district", "province", "latitude", "longitude"]