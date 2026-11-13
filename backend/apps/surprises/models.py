import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.couples.models import Couple

class LoveLetter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='love_letters')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_letters')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_letters')
    title = models.CharField(max_length=150)
    content = models.TextField()
    font_style = models.CharField(max_length=30, default='serif')
    seal_color = models.CharField(max_length=20, default='#F2A7C6')  # Rose principal Man Ak Bae
    unlock_at = models.DateTimeField(default=timezone.now, help_text="Date et heure à partir de laquelle la lettre est lisible")
    is_opened = models.BooleanField(default=False)
    opened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_unlocked(self):
        return timezone.now() >= self.unlock_at

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Love letter '{self.title}' from {self.sender.username}"

class Surprise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='surprises')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_surprises')
    title = models.CharField(max_length=150)
    clue_text = models.TextField(help_text="Indice visible avant le déverrouillage")
    secret_message = models.TextField(help_text="Message secret découvert à la révélation")
    secret_media = models.FileField(upload_to='surprises/media/%Y/%m/', null=True, blank=True)
    reveal_at = models.DateTimeField()
    is_revealed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def can_be_revealed(self):
        return timezone.now() >= self.reveal_at

    class Meta:
        ordering = ['-reveal_at']

    def __str__(self):
        return f"Surprise '{self.title}' for {self.couple.name}"
