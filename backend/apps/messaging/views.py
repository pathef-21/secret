from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Conversation, Message, MessageAttachment, MessageReaction, MessageReadStatus
from .serializers import MessageSerializer, CreateMessageSerializer, MessageReactionSerializer
from apps.couples.permissions import IsCoupleMember
from apps.flames.models import Flame
from apps.notifications_app.services import send_push_notification

class ConversationMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get_queryset(self):
        user = self.request.user
        couple = user.couple_membership.couple
        conversation, _ = Conversation.objects.get_or_create(couple=couple)
        return Message.objects.filter(
            conversation=conversation,
            deleted_for_all=False
        ).select_related('sender', 'sender__profile', 'reply_to', 'reply_to__sender')\
         .prefetch_related('attachments', 'reactions', 'reactions__user', 'statuses')\
         .order_by('-created_at')

class SendMessageView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        user = request.user
        couple = user.couple_membership.couple
        conversation, _ = Conversation.objects.get_or_create(couple=couple)

        serializer = CreateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            message_type=serializer.validated_data.get('message_type', 'text'),
            content=serializer.validated_data.get('content', ''),
            reply_to=serializer.validated_data.get('reply_to', None)
        )

        # Handle file attachments (images, video, audio)
        files = request.FILES.getlist('files')
        if 'file' in request.FILES:
            files.append(request.FILES['file'])

        attachment_type = request.data.get('attachment_type') or message.message_type
        if attachment_type not in ['image', 'video', 'audio']:
            attachment_type = 'image'

        duration = request.data.get('duration_seconds')
        duration_int = int(duration) if duration and duration.isdigit() else None

        for file_obj in files:
            MessageAttachment.objects.create(
                message=message,
                file=file_obj,
                attachment_type=attachment_type,
                file_size=file_obj.size,
                duration_seconds=duration_int
            )

        # Record Flame participation for today (Africa/Dakar)
        flame, _ = Flame.objects.get_or_create(couple=couple)
        flame_increased, current_streak = flame.record_activity(user)

        # Record ReadStatus for partner + send push notification
        partner = couple.get_partner_of(user)
        if partner:
            MessageReadStatus.objects.create(
                message=message,
                recipient=partner,
                status='sent'
            )
            sender_name = (
                user.profile.nickname
                if hasattr(user, 'profile') and user.profile.nickname
                else (user.first_name or user.username)
            )
            preview = message.content[:100] if message.content else '📷 Nouveau média partagé'
            try:
                send_push_notification(
                    user=partner,
                    title=f"💌 {sender_name}",
                    body=preview,
                    data={'type': 'message', 'message_id': str(message.id)},
                    notification_type='message',
                )
            except Exception:
                pass

        response_data = MessageSerializer(message, context={'request': request}).data
        response_data['flame_info'] = {
            'increased': flame_increased,
            'current_streak': current_streak
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

class ReactToMessageView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def post(self, request, message_id):
        user = request.user
        couple = user.couple_membership.couple
        message = get_object_or_404(Message, id=message_id, conversation__couple=couple)

        emoji = request.data.get('emoji')
        if not emoji:
            return Response({'detail': 'Emoji requis.'}, status=status.HTTP_400_BAD_REQUEST)

        # Toggle reaction
        existing_reaction = MessageReaction.objects.filter(message=message, user=user, emoji=emoji).first()
        if existing_reaction:
            existing_reaction.delete()
            return Response({'status': 'removed', 'emoji': emoji}, status=status.HTTP_200_OK)
        else:
            reaction = MessageReaction.objects.create(message=message, user=user, emoji=emoji)
            return Response(MessageReactionSerializer(reaction).data, status=status.HTTP_201_CREATED)

class MarkMessagesAsReadView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def post(self, request):
        user = request.user
        couple = user.couple_membership.couple
        conversation, _ = Conversation.objects.get_or_create(couple=couple)

        # Update sent / delivered statuses for messages where this user is recipient
        updated_count = MessageReadStatus.objects.filter(
            message__conversation=conversation,
            recipient=user,
            status__in=['sent', 'delivered']
        ).update(status='read', status_updated_at=timezone.now())

        return Response({'marked_read': updated_count}, status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        user = request.user
        couple = user.couple_membership.couple
        conversation, _ = Conversation.objects.get_or_create(couple=couple)
        unread_count = MessageReadStatus.objects.filter(
            message__conversation=conversation,
            message__deleted_for_all=False,
            recipient=user,
            status__in=['sent', 'delivered']
        ).count()
        latest_unread = (
            MessageReadStatus.objects.filter(
                message__conversation=conversation,
                message__deleted_for_all=False,
                recipient=user,
                status__in=['sent', 'delivered']
            )
            .select_related('message', 'message__sender', 'message__sender__profile')
            .order_by('-message__created_at')
            .first()
        )
        latest_preview = None
        if latest_unread:
            m = latest_unread.message
            s = m.sender
            sender_name = (
                s.profile.nickname
                if hasattr(s, 'profile') and s.profile.nickname
                else (s.first_name or s.username)
            )
            latest_preview = {
                'id': str(m.id),
                'sender_name': sender_name,
                'content': m.content[:100] if m.content else '📷 Photo partagée',
                'created_at': m.created_at.isoformat(),
            }
        return Response({
            'unread_count': unread_count,
            'latest_unread': latest_preview,
        }, status=status.HTTP_200_OK)

class DeleteMessageView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def delete(self, request, message_id):
        user = request.user
        couple = user.couple_membership.couple
        message = get_object_or_404(Message, id=message_id, conversation__couple=couple)

        if message.sender != user:
            return Response({'detail': 'Vous ne pouvez supprimer que vos propres messages.'}, status=status.HTTP_403_FORBIDDEN)

        delete_for_all = request.data.get('for_all', True)
        if delete_for_all:
            message.deleted_for_all = True
            message.content = "Ce message a été supprimé."
            message.save(update_fields=['deleted_for_all', 'content'])
        else:
            message.is_deleted = True
            message.save(update_fields=['is_deleted'])

        return Response({'detail': 'Message supprimé.'}, status=status.HTTP_200_OK)
