import uuid
from django.db import models
from django.conf import settings
from apps.couples.models import Couple

class MemoryAlbum(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='albums')
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    cover_image = models.ImageField(upload_to='memories/album_covers/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Memory(models.Model):
    MEDIA_TYPES = (
        ('image', 'Photo'),
        ('video', 'Vidéo'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='memories')
    album = models.ForeignKey(MemoryAlbum, on_delete=models.SET_NULL, null=True, blank=True, related_name='memories')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_memories')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    media_file = models.FileField(upload_to='memories/files/%Y/%m/')
    file_data = models.BinaryField(null=True, blank=True, help_text="Sauvegarde binaire permanente")
    mime_type = models.CharField(max_length=80, blank=True, default='')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    memory_date = models.DateField(help_text="Date où le souvenir s'est produit")
    location = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-memory_date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.memory_date})"

class MemoryComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    memory = models.ForeignKey(Memory, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memory_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
