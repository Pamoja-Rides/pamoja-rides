import json
import os
import logging
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_CLAIMS_EMAIL = os.getenv('VAPID_CLAIMS_EMAIL', 'mailto:admin@pamoja-rides.com')


def send_web_push(subscription, title: str, body: str, ride_id: str | None = None):
    """
    Sends a Web Push notification to a single PushSubscription record.
    Returns True on success, False on failure (expired/invalid subscription).
    """
    if not VAPID_PRIVATE_KEY:
        return False

    payload = json.dumps({
        'title': title,
        'body': body,
        'icon': '/icons/icon-192x192.png',
        'badge': '/icons/badge-72x72.png',
        'data': {
            'ride_id': ride_id,
            'url': f'/rides/{ride_id}' if ride_id else '/',
        },
    })

    try:
        webpush(
            subscription_info={
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh,
                    'auth': subscription.auth,
                },
            },
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                'sub': VAPID_CLAIMS_EMAIL,
            },
        )
        return True
    except WebPushException as e:
        # 410 Gone = subscription expired/revoked — safe to delete
        if e.response and e.response.status_code in (404, 410):
            subscription.delete()
            logger.info("Deleted expired push subscription: %s", subscription.endpoint[:60])
        else:
            logger.warning("Web push failed: %s", str(e))
        return False
    except Exception as e:
        logger.warning("Web push unexpected error: %s", str(e))
        return False


def push_to_user(user, title: str, body: str, ride_id: str | None = None):
    """Push to all of a user's registered browser subscriptions."""
    subscriptions = user.push_subscriptions.all()
    for sub in subscriptions:
        send_web_push(sub, title, body, ride_id)