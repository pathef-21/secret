import uuid
from django.db import models
from django.conf import settings
from apps.couples.models import Couple

class EventCategory(models.TextChoices):
    DATE_NIGHT = 'date_night', 'Rendez-vous amoureux'
    ANNIVERSARY = 'anniversary', 'Anniversaire'
    TRIP = 'trip', 'Voyage / Sortie'
    CINEMA = 'cinema', 'Cinéma / Soirée film'
    RESTAURANT = 'restaurant', 'Restaurant'
    ACTIVITY = 'activity', 'Activité romantique'
    REMINDER = 'reminder', 'Rappel important'
    OTHER = 'other', 'Autre'

class CalendarEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='calendar_events')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=30, choices=EventCategory.choices, default=EventCategory.DATE_NIGHT)
    location = models.CharField(max_length=200, blank=True, default='')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    is_all_day = models.BooleanField(default=False)
    reminder_minutes_before = models.PositiveIntegerField(default=60, help_text="Minutes avant l'événement pour notification")
    is_reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} on {self.start_time}"
