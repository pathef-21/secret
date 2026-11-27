import uuid
from datetime import datetime, date, timedelta
import zoneinfo
from django.db import models
from django.conf import settings
from apps.couples.models import Couple

DAKAR_TZ = zoneinfo.ZoneInfo("Africa/Dakar")


def get_current_dakar_date() -> date:
    return datetime.now(DAKAR_TZ).date()


class Flame(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.OneToOneField(Couple, on_delete=models.CASCADE, related_name='flame')
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_streak_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Flame for couple {self.couple.id}: {self.current_streak} days"

    def _try_validate_daily_streak(self, user, today):
        """
        Valide la flamme du jour uniquement lorsque LES DEUX partenaires ont participé
        ET envoyé au moins un Instant (photo ou vidéo) aujourd'hui (fuseau Africa/Dakar).
        """
        if self.last_streak_date == today:
            return False, self.current_streak

        partner = self.couple.get_partner_of(user)
        if not partner:
            return False, self.current_streak

        my_ok = FlameActivity.objects.filter(
            flame=self,
            user=user,
            activity_date=today,
            has_participated=True,
            has_sent_instant=True,
        ).exists()

        partner_ok = FlameActivity.objects.filter(
            flame=self,
            user=partner,
            activity_date=today,
            has_participated=True,
            has_sent_instant=True,
        ).exists()

        if my_ok and partner_ok:
            yesterday = today - timedelta(days=1)
            if self.last_streak_date == yesterday:
                self.current_streak += 1
            else:
                self.current_streak = 1

            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak

            self.last_streak_date = today
            self.save(update_fields=['current_streak', 'longest_streak', 'last_streak_date', 'updated_at'])
            return True, self.current_streak

        return False, self.current_streak

    def record_activity(self, user):
        """Enregistre l'activité message du partenaire pour la journée (fuseau Dakar)."""
        today = get_current_dakar_date()
        activity, created = FlameActivity.objects.get_or_create(
            flame=self,
            user=user,
            activity_date=today,
            defaults={'has_participated': True, 'message_count': 1}
        )
        if not created:
            activity.has_participated = True
            activity.message_count += 1
            activity.save(update_fields=['has_participated', 'message_count', 'updated_at'])

        return self._try_validate_daily_streak(user, today)

    def record_instant(self, user):
        """Enregistre l'envoi d'un Instant photo/vidéo quotidien et valide la flamme si les 2 l'ont fait."""
        today = get_current_dakar_date()
        activity, created = FlameActivity.objects.get_or_create(
            flame=self,
            user=user,
            activity_date=today,
            defaults={'has_participated': True, 'has_sent_instant': True, 'message_count': 0}
        )
        if not created:
            activity.has_participated = True
            activity.has_sent_instant = True
            activity.save(update_fields=['has_participated', 'has_sent_instant', 'updated_at'])

        return self._try_validate_daily_streak(user, today)


class FlameActivity(models.Model):
    flame = models.ForeignKey(Flame, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flame_activities')
    activity_date = models.DateField(default=get_current_dakar_date, db_index=True)
    has_participated = models.BooleanField(default=False)
    has_sent_instant = models.BooleanField(default=False)
    message_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['flame', 'user', 'activity_date'], name='unique_flame_user_daily_activity')
        ]
        ordering = ['-activity_date']


class DailyInstant(models.Model):
    """
    Instant éphémère quotidien (photo ou vidéo) façon Instagram/Snap :
    - Consultable UNE SEULE FOIS par le partenaire.
    - Obligatoire (au moins 1 par jour chacun) pour entretenir la flamme du couple.
    """
    MEDIA_TYPES = [
        ('image', 'Photo'),
        ('video', 'Vidéo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='instants')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_instants')
    instant_date = models.DateField(default=get_current_dakar_date, db_index=True)
    media_file = models.FileField(upload_to='instants/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    caption = models.CharField(max_length=160, blank=True, default='')
    viewed_by_partner = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Instant {self.media_type} by {self.sender.username} ({self.instant_date})"
