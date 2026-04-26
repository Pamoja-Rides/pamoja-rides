from rest_framework import serializers
from .models import Ride, Location
from users.serializers import UserSerializer 
from django.utils import timezone
from datetime import timedelta

class RideSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    
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