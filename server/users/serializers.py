from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["phone_number", "first_name", "last_name", "password", "preferred_language", "email"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone_number", "first_name", "last_name", "is_verified", "preferred_language", "is_driver", "avatar_url"]


class DriverProfileSerializer(serializers.Serializer):
    nid_number = serializers.CharField()
    license_number = serializers.CharField()
    full_name_on_id = serializers.CharField()
    nid_image_url = serializers.CharField()
    license_image_url = serializers.CharField()
    updated_at = serializers.DateTimeField()


class UserProfileSerializer(serializers.ModelSerializer):
    driver_profile = serializers.SerializerMethodField()
    rides_posted = serializers.SerializerMethodField()
    rides_booked = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "phone_number", "first_name", "last_name", "email",
            "is_verified", "is_driver", "preferred_language", "avatar_url",
            "member_since", "rides_posted", "rides_booked", "driver_profile",
        ]

    def get_driver_profile(self, obj):
        try:
            return DriverProfileSerializer(obj.driver_profile).data
        except Exception:
            return None

    def get_rides_posted(self, obj):
        return obj.rides_driven.count()

    def get_rides_booked(self, obj):
        from rides.models import Booking
        return Booking.objects.filter(passenger=obj).count()


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone_number", "preferred_language", "avatar_url"]
        extra_kwargs = {
            "email": {"required": False},
            "phone_number": {"required": False},
            "avatar_url": {"required": False},
        }