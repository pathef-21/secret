import uuid
from django.db import models
from django.conf import settings

class DeviceToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=20, choices=[('android', 'Android'), ('ios', 'iOS')], default='android')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.platform} ({self.token[:15]}...)"

class NotificationType(models.TextChoices):
    MESSAGE = 'message', 'Nouveau message'
    FLAME = 'flame', 'Alerte Flamme'
    LETTER = 'letter', 'Nouvelle lettre d’amour'
    SURPRISE = 'surprise', 'Nouvelle surprise'
    CALENDAR = 'calendar', 'Rendez-vous à venir'
    GAME = 'game', 'Invitation de jeu'
    COUPLE = 'couple', 'Espace de couple'

class AppNotification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.MESSAGE)
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(blank=True, default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} for {self.user.username}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    messages_enabled = models.BooleanField(default=True)
    flames_enabled = models.BooleanField(default=True)
    letters_enabled = models.BooleanField(default=True)
    calendar_enabled = models.BooleanField(default=True)
    games_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Preferences of {self.user.username}"
