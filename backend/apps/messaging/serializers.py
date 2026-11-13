from rest_framework import serializers
from .models import Message, MessageAttachment, MessageReaction, MessageReadStatus
from apps.accounts.serializers import UserSerializer

class MessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAttachment
        fields = ('id', 'file', 'attachment_type', 'file_size', 'duration_seconds', 'thumbnail', 'created_at')

class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MessageReaction
        fields = ('id', 'user', 'emoji', 'created_at')

class MessageReadStatusSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = MessageReadStatus
        fields = ('id', 'recipient', 'status', 'status_updated_at')

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    statuses = MessageReadStatusSerializer(many=True, read_only=True)
    reply_to_details = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'sender', 'message_type', 'content',
            'reply_to', 'reply_to_details', 'attachments', 'reactions',
            'statuses', 'is_deleted', 'deleted_for_all', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'conversation', 'sender', 'created_at', 'updated_at')

    def get_reply_to_details(self, obj):
        if obj.reply_to and not obj.reply_to.is_deleted:
            return {
                'id': str(obj.reply_to.id),
                'sender_name': obj.reply_to.sender.profile.nickname or obj.reply_to.sender.username,
                'content': obj.reply_to.content[:60] if obj.reply_to.content else f"[{obj.reply_to.get_message_type_display()}]",
                'message_type': obj.reply_to.message_type
            }
        return None

class CreateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('message_type', 'content', 'reply_to')

