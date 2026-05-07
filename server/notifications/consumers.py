from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from .models import Notification
from .serializers import NotificationSerializer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or user.is_anonymous:
            await self.close()
            return

        self.group_name = f'notifications_{user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send unread count on connect so the bell badge is immediately correct
        unread = await self.get_unread_count(user)
        await self.send(json.dumps({'type': 'UNREAD_COUNT', 'count': unread}))

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        user = self.scope.get('user')

        if action == 'fetch':
            notifications = await self.get_notifications(user)
            await self.send(json.dumps({'type': 'NOTIFICATIONS', 'data': notifications}))

        elif action == 'mark_read':
            notification_id = data.get('id')
            await self.mark_one_read(user, notification_id)
            unread = await self.get_unread_count(user)
            await self.send(json.dumps({'type': 'UNREAD_COUNT', 'count': unread}))

        elif action == 'mark_all_read':
            await self.mark_all_read(user)
            await self.send(json.dumps({'type': 'UNREAD_COUNT', 'count': 0}))

    # ── Handlers (called by group_send) ──────────────────────────────────────

    async def push_notification(self, event):
        """Called when create_and_push fires group_send."""
        await self.send(json.dumps({
            'type': 'NEW_NOTIFICATION',
            'notification': event['notification'],
        }))
        user = self.scope.get('user')
        unread = await self.get_unread_count(user)
        await self.send(json.dumps({'type': 'UNREAD_COUNT', 'count': unread}))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_notifications(self, user):
        qs = Notification.objects.filter(recipient=user).select_related('ride')[:50]
        return list(NotificationSerializer(qs, many=True).data)

    @database_sync_to_async
    def get_unread_count(self, user):
        return Notification.objects.filter(recipient=user, is_read=False).count()

    @database_sync_to_async
    def mark_one_read(self, user, notification_id):
        Notification.objects.filter(
            id=notification_id, recipient=user
        ).update(is_read=True)

    @database_sync_to_async
    def mark_all_read(self, user):
        Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)