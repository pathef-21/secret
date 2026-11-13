from rest_framework import serializers
from .models import MemoryAlbum, Memory, MemoryComment
from apps.accounts.serializers import UserSerializer

class MemoryCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MemoryComment
        fields = ('id', 'memory', 'user', 'content', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class MemorySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    comments = MemoryCommentSerializer(many=True, read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)

    class Meta:
        model = Memory
        fields = (
            'id', 'couple', 'album', 'created_by', 'title', 'description',
            'media_file', 'media_type', 'memory_date', 'location',
            'comments', 'comments_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'couple', 'created_by', 'created_at', 'updated_at')

class MemoryAlbumSerializer(serializers.ModelSerializer):
    memories_count = serializers.IntegerField(source='memories.count', read_only=True)

    class Meta:
        model = MemoryAlbum
        fields = ('id', 'couple', 'title', 'description', 'cover_image', 'memories_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'couple', 'created_at', 'updated_at')

