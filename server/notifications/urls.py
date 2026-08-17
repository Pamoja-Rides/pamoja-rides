from django.urls import path
from .views import (
    NotificationListView,
    MarkAllReadView,
    PushSubscribeView,
    VapidPublicKeyView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('mark-all-read/', MarkAllReadView.as_view(), name='mark-all-read'),
    path('push/subscribe/', PushSubscribeView.as_view(), name='push-subscribe'),
    path('push/vapid-key/', VapidPublicKeyView.as_view(), name='vapid-public-key'),
]