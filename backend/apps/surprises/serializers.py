from rest_framework import serializers
from django.utils import timezone
from .models import LoveLetter, Surprise
from apps.accounts.serializers import UserSerializer

class LoveLetterSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    is_unlocked = serializers.BooleanField(read_only=True)
    content_masked = serializers.SerializerMethodField()

    class Meta:
        model = LoveLetter
        fields = (
            'id', 'couple', 'sender', 'recipient', 'title', 'content',
            'content_masked', 'font_style', 'seal_color', 'unlock_at',
            'is_unlocked', 'is_opened', 'opened_at', 'created_at'
        )
        read_only_fields = ('id', 'couple', 'sender', 'recipient', 'is_opened', 'opened_at', 'created_at')

    def get_content_masked(self, obj):
        request = self.context.get('request')
        is_sender = request and request.user == obj.sender
        if is_sender or obj.is_unlocked:
            return False
        return True

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_sender = request and request.user == instance.sender
        # Hide secret text if locked and accessed by recipient
        if not is_sender and not instance.is_unlocked:
            data['content'] = "🔒 Cette lettre est scellée jusqu’à sa date de déverrouillage..."
        return data

class CreateLoveLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoveLetter
        fields = ('title', 'content', 'font_style', 'seal_color', 'unlock_at')

class SurpriseSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    can_be_revealed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Surprise
        fields = (
            'id', 'couple', 'creator', 'title', 'clue_text',
            'secret_message', 'secret_media', 'reveal_at',
            'can_be_revealed', 'is_revealed', 'created_at'
        )
        read_only_fields = ('id', 'couple', 'creator', 'created_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_creator = request and request.user == instance.creator
        if not is_creator and not instance.can_be_revealed:
            data['secret_message'] = "🎁 Surprise en attente... Révélation bientôt !"
            data['secret_media'] = None
        return data

class CreateSurpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Surprise
        fields = ('title', 'clue_text', 'secret_message', 'secret_media', 'reveal_at')

