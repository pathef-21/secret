from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_data = models.BinaryField(null=True, blank=True, help_text="Sauvegarde binaire permanente de l'avatar")
    avatar_mime_type = models.CharField(max_length=80, blank=True, default='')
    bio = models.TextField(max_length=300, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    relationship_status = models.CharField(
        max_length=20,
        choices=[('single', 'Célibataire'), ('in_couple', 'En couple')],
        default='single'
    )
    last_seen = models.DateTimeField(default=timezone.now)
    is_online = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email} ({self.nickname or self.user.username})"
