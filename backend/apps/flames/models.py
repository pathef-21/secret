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

    def record_activity(self, user):
        """
        Enregistre l'activité d'un partenaire pour la journée actuelle (fuseau Dakar).
        Si les deux partenaires ont participé pour aujourd'hui, met à jour le streak de façon atomique.
        """
        today = get_current_dakar_date()

        # Enregistre ou incrémente l'activité du partenaire
        activity, _ = FlameActivity.objects.get_or_create(
            flame=self,
            user=user,
            activity_date=today,
            defaults={'has_participated': True, 'message_count': 1}
        )
        if not activity.has_participated:
            activity.has_participated = True
            activity.save(update_fields=['has_participated'])

        # Vérifie si le streak a déjà été attribué pour aujourd'hui
        if self.last_streak_date == today:
            return False, self.current_streak  # Déjà validé aujourd'hui

        # Vérifie si l'autre partenaire a aussi participé aujourd'hui
        partner = self.couple.get_partner_of(user)
        if not partner:
            return False, self.current_streak

        partner_participated = FlameActivity.objects.filter(
            flame=self,
            user=partner,
            activity_date=today,
            has_participated=True
        ).exists()

        if partner_participated:
            # Les deux partenaires ont participé !
            yesterday = today - timedelta(days=1)
            if self.last_streak_date == yesterday:
                # Progression de la flamme consécutive
                self.current_streak += 1
            else:
                # Nouvelle série démarrée
                self.current_streak = 1

            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak

            self.last_streak_date = today
            self.save(update_fields=['current_streak', 'longest_streak', 'last_streak_date', 'updated_at'])
            return True, self.current_streak  # Streak incrémenté !

        return False, self.current_streak

class FlameActivity(models.Model):
    flame = models.ForeignKey(Flame, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flame_activities')
    activity_date = models.DateField(default=get_current_dakar_date, db_index=True)
    has_participated = models.BooleanField(default=False)
    message_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['flame', 'user', 'activity_date'], name='unique_flame_user_daily_activity')
        ]
        ordering = ['-activity_date']
