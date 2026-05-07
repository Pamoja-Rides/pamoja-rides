from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
import os
from .models import Notification, PushSubscription
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(
            recipient=request.user
        ).select_related('ride')[:50]
        return Response(NotificationSerializer(qs, many=True).data)


class MarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({'status': 'ok'})


class PushSubscribeView(APIView):
    """Register or refresh a browser push subscription for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        p256dh = request.data.get('p256dh')
        auth = request.data.get('auth')

        if not all([endpoint, p256dh, auth]):
            return Response({'error': 'endpoint, p256dh and auth are required'}, status=400)

        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': p256dh,
                'auth': auth,
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:255],
            },
        )
        return Response({'status': 'subscribed'}, status=201)

    def delete(self, request):
        endpoint = request.data.get('endpoint')
        if endpoint:
            PushSubscription.objects.filter(
                user=request.user, endpoint=endpoint
            ).delete()
        return Response({'status': 'unsubscribed'})


class VapidPublicKeyView(APIView):
    """Returns the VAPID public key so the frontend can subscribe."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'public_key': os.getenv('VAPID_PUBLIC_KEY', '')})