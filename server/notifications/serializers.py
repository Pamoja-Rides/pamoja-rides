from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    ride_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'body',
            'ride_id', 'actor_name', 'is_read', 'created_at',
        ]

    def get_ride_id(self, obj):
        return str(obj.ride_id) if obj.ride_id else None