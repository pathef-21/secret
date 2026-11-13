from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserProfile
from apps.notifications_app.models import NotificationPreference

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile_and_preferences(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance, defaults={'nickname': instance.first_name or instance.username})
        NotificationPreference.objects.get_or_create(user=instance)

