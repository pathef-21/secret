from rest_framework import serializers
from .models import DeviceToken, AppNotification, NotificationPreference

class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ('id', 'token', 'platform', 'is_active', 'updated_at')
        read_only_fields = ('id', 'updated_at')

class AppNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppNotification
        fields = ('id', 'notification_type', 'title', 'body', 'data', 'is_read', 'created_at')
        read_only_fields = ('id', 'notification_type', 'title', 'body', 'data', 'created_at')

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ('messages_enabled', 'flames_enabled', 'letters_enabled', 'calendar_enabled', 'games_enabled')

