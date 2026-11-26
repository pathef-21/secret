import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Conversation, Message, MessageReadStatus
from apps.flames.models import Flame

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')

        # Refuse connection if user is not authenticated or has no couple
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.couple_id = await self.get_user_couple_id()
        if not self.couple_id:
            await self.close(code=4002)
            return

        self.room_group_name = f'chat_couple_{self.couple_id}'

        # Join couple's private room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Update user status to online
        await self.set_user_online(True)

        # Notify partner that user is online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'user_id': self.user.id,
                'is_online': True
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Update user status to offline
            await self.set_user_online(False)

            # Notify partner
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'is_online': False
                }
            )

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'send_message':
                content = data.get('content', '').strip()
                message_type = data.get('message_type', 'text')
                reply_to_id = data.get('reply_to')

                if content or message_type == 'heart':
                    msg_obj = await self.save_message(content, message_type, reply_to_id)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': msg_obj
                        }
                    )

            elif action == 'typing':
                is_typing = data.get('is_typing', False)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': self.user.id,
                        'is_typing': is_typing
                    }
                )

            elif action == 'read':
                await self.mark_messages_read()
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'messages_read_receipt',
                        'reader_id': self.user.id
                    }
                )

            elif action == 'call_signal':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'call_signal_event',
                        'sender_id': self.user.id,
                        'sender_name': (
                            self.user.profile.nickname
                            if hasattr(self.user, 'profile') and self.user.profile.nickname
                            else (self.user.first_name or self.user.username)
                        ),
                        'signal_type': data.get('signal_type'),
                        'payload': data.get('payload') or {},
                    }
                )

        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    # Event handlers dispatched from group_send
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def typing_indicator(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))

    async def presence_update(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'presence',
                'user_id': event['user_id'],
                'is_online': event['is_online']
            }))

    async def messages_read_receipt(self, event):
        if event['reader_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'read_receipt',
                'reader_id': event['reader_id']
            }))

    async def call_signal_event(self, event):
        if event['sender_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'call_signal',
                'sender_id': event['sender_id'],
                'sender_name': event.get('sender_name', 'Mon Bae'),
                'signal_type': event['signal_type'],
                'payload': event.get('payload', {}),
            }))

    # Database helpers
    @database_sync_to_async
    def get_user_couple_id(self):
        if hasattr(self.user, 'couple_membership'):
            return str(self.user.couple_membership.couple_id)
        return None

    @database_sync_to_async
    def set_user_online(self, is_online):
        if hasattr(self.user, 'profile'):
            self.user.profile.is_online = is_online
            self.user.profile.last_seen = timezone.now()
            self.user.profile.save(update_fields=['is_online', 'last_seen'])

    @database_sync_to_async
    def save_message(self, content, message_type, reply_to_id=None):
        couple = self.user.couple_membership.couple
        conversation, _ = Conversation.objects.get_or_create(couple=couple)

        reply_to = None
        if reply_to_id:
            reply_to = Message.objects.filter(id=reply_to_id, conversation=conversation).first()

        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
            message_type=message_type,
            reply_to=reply_to
        )

        # Record flame participation
        flame, _ = Flame.objects.get_or_create(couple=couple)
        flame.record_activity(self.user)

        # Read status for partner
        partner = couple.get_partner_of(self.user)
        if partner:
            MessageReadStatus.objects.create(
                message=message,
                recipient=partner,
                status='sent'
            )

        sender_avatar = self.user.profile.avatar.url if self.user.profile.avatar else None

        return {
            'id': str(message.id),
            'content': message.content,
            'message_type': message.message_type,
            'created_at': message.created_at.isoformat(),
            'sender': {
                'id': self.user.id,
                'username': self.user.username,
                'nickname': self.user.profile.nickname or self.user.username,
                'avatar': sender_avatar
            },
            'reply_to': str(reply_to.id) if reply_to else None,
            'attachments': [],
            'reactions': []
        }

    @database_sync_to_async
    def mark_messages_read(self):
        couple = self.user.couple_membership.couple
        conversation, _ = Conversation.objects.get_or_create(couple=couple)
        MessageReadStatus.objects.filter(
            message__conversation=conversation,
            recipient=self.user,
            status__in=['sent', 'delivered']
        ).update(status='read', status_updated_at=timezone.now())

