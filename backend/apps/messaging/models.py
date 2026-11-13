import uuid
from django.db import models
from django.conf import settings
from apps.couples.models import Couple

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.OneToOneField(Couple, on_delete=models.CASCADE, related_name='conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation for couple {self.couple.id}"

class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Texte'),
        ('image', 'Photo'),
        ('video', 'Vidéo'),
        ('audio', 'Message Vocal'),
        ('heart', 'Coup de Cœur'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(blank=True, default='')
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )
    is_deleted = models.BooleanField(default=False)
    deleted_for_all = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message {self.id} by {self.sender.username} ({self.message_type})"

class MessageAttachment(models.Model):
    ATTACHMENT_TYPES = (
        ('image', 'Photo'),
        ('video', 'Vidéo'),
        ('audio', 'Audio/Vocal'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='chat_attachments/%Y/%m/%d/')
    attachment_type = models.CharField(max_length=10, choices=ATTACHMENT_TYPES)
    file_size = models.PositiveIntegerField(help_text="Taille en octets", default=0)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True, help_text="Durée en secondes pour l'audio/vidéo")
    thumbnail = models.ImageField(upload_to='chat_thumbnails/%Y/%m/%d/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['message', 'user', 'emoji'], name='unique_message_user_reaction')
        ]

class MessageReadStatus(models.Model):
    STATUS_CHOICES = (
        ('sent', 'Envoyé'),
        ('delivered', 'Reçu'),
        ('read', 'Lu'),
    )
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='statuses')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_message_statuses')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    status_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['message', 'recipient'], name='unique_message_recipient_status')
        ]
