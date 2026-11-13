from django.urls import path
from .views import (
    RegisterDeviceTokenView,
    AppNotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    NotificationPreferencesView
)

urlpatterns = [
    path('token/', RegisterDeviceTokenView.as_view(), name='register_device_token'),
    path('list/', AppNotificationListView.as_view(), name='notifications_list'),
    path('<uuid:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('read-all/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
    path('preferences/', NotificationPreferencesView.as_view(), name='notification_preferences'),
]

