from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from .serializers import NotificationSerializer
from .push import push_to_user


def create_and_push(recipient, type_, title, body, ride=None, actor_name=''):
    notification = Notification.objects.create(
        recipient=recipient,
        type=type_,
        title=title,
        body=body,
        ride=ride,
        actor_name=actor_name,
    )

    # 1. Real-time in-app push via WebSocket
    channel_layer = get_channel_layer()
    group_name = f'notifications_{recipient.id}'
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'push_notification',
                'notification': NotificationSerializer(notification).data,
            },
        )
    except Exception:
        pass

    # 2. Device push notification (works even when app is closed)
    ride_id = str(ride.id) if ride else None
    push_to_user(recipient, title, body, ride_id)

    return notification