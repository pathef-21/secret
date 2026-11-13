from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import DeviceToken, AppNotification, NotificationPreference
from .serializers import (
    DeviceTokenSerializer,
    AppNotificationSerializer,
    NotificationPreferenceSerializer
)

class RegisterDeviceTokenView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        token = request.data.get('token')
        platform = request.data.get('platform', 'android')
        if not token:
            return Response({'detail': 'Token requis.'}, status=status.HTTP_400_BAD_REQUEST)

        device_token, created = DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'user': request.user,
                'platform': platform,
                'is_active': True
            }
        )
        return Response(DeviceTokenSerializer(device_token).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

class AppNotificationListView(generics.ListAPIView):
    serializer_class = AppNotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return AppNotification.objects.filter(user=self.request.user)[:50]

class MarkNotificationReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, notification_id):
        AppNotification.objects.filter(id=notification_id, user=request.user).update(is_read=True)
        return Response({'detail': 'Notification marquée comme lue.'}, status=status.HTTP_200_OK)

class MarkAllNotificationsReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        AppNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'Toutes les notifications marquées comme lues.'}, status=status.HTTP_200_OK)

class NotificationPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
