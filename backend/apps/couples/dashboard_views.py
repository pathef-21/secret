import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from .models import Couple
from apps.couples.permissions import IsCoupleMember
from apps.accounts.serializers import UserSerializer
from apps.messaging.models import Conversation, Message, MessageReadStatus
from apps.messaging.serializers import MessageSerializer
from apps.calendar_app.models import CalendarEvent
from apps.calendar_app.serializers import CalendarEventSerializer
from apps.memories.models import Memory
from apps.memories.serializers import MemorySerializer
from apps.surprises.models import LoveLetter, Surprise

ROMANTIC_QUOTES = [
    "« Chaque seconde passée loin de toi me rappelle combien tu es précieux/se à mon cœur. »",
    "« Man Ak Yaw, pour l'éternité et au-delà. ❤️ »",
    "« Le plus bel endroit sur terre, c’est dans tes bras. »",
    "« Aimer, ce n’est pas se regarder l’un l’autre, c’est regarder ensemble dans la même direction. »",
    "« Mon bonheur commence là où ton sourire s’illumine. »",
    "« Deux âmes, un seul cœur : Man Ak Bae ❤️ »",
]

class HomeDashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        user = request.user
        couple = user.couple_membership.couple
        partner = couple.get_partner_of(user)

        # 1. Calcul durée de relation
        relationship_days = 0
        if couple.relationship_start_date:
            delta = timezone.now().date() - couple.relationship_start_date
            relationship_days = max(0, delta.days)

        # 2. Compteur de flammes
        flame_info = {
            'current_streak': 0,
            'longest_streak': 0,
            'last_streak_date': None,
            'is_lit_today': False
        }
        if hasattr(couple, 'flame'):
            flame = couple.flame
            flame_info = {
                'current_streak': flame.current_streak,
                'longest_streak': flame.longest_streak,
                'last_streak_date': flame.last_streak_date,
                'is_lit_today': flame.last_streak_date == timezone.now().date()
            }

        # 3. Derniers messages & compteur non lus
        conversation, _ = Conversation.objects.get_or_create(couple=couple)
        recent_messages = Message.objects.filter(conversation=conversation, deleted_for_all=False).select_related('sender', 'sender__profile').order_by('-created_at')[:3]
        recent_messages_data = MessageSerializer(recent_messages, many=True, context={'request': request}).data
        unread_messages_count = MessageReadStatus.objects.filter(
            message__conversation=conversation,
            message__deleted_for_all=False,
            recipient=user,
            status__in=['sent', 'delivered']
        ).count()

        # 4. Prochain rendez-vous
        now = timezone.now()
        next_event = CalendarEvent.objects.filter(couple=couple, start_time__gte=now).order_by('start_time').first()
        next_event_data = CalendarEventSerializer(next_event).data if next_event else None

        # 5. Derniers souvenirs
        recent_memories = Memory.objects.filter(couple=couple).select_related('created_by').order_by('-memory_date', '-created_at')[:4]
        recent_memories_data = MemorySerializer(recent_memories, many=True, context={'request': request}).data

        # 6. Lettres / Surprises en attente
        unread_letters_count = LoveLetter.objects.filter(
            couple=couple,
            recipient=user,
            is_opened=False,
            unlock_at__lte=now
        ).count()

        pending_surprises_count = Surprise.objects.filter(
            couple=couple,
            reveal_at__lte=now,
            is_revealed=False
        ).exclude(creator=user).count()

        # 7. Citation du jour
        quote_of_the_day = random.choice(ROMANTIC_QUOTES)

        return Response({
            'couple': {
                'id': str(couple.id),
                'name': couple.name,
                'relationship_start_date': couple.relationship_start_date,
                'relationship_days': relationship_days,
            },
            'user': UserSerializer(user, context={'request': request}).data,
            'partner': UserSerializer(partner, context={'request': request}).data if partner else None,
            'flame': flame_info,
            'recent_messages': recent_messages_data,
            'unread_messages_count': unread_messages_count,
            'next_event': next_event_data,
            'recent_memories': recent_memories_data,
            'unread_letters_count': unread_letters_count,
            'pending_surprises_count': pending_surprises_count,
            'quote_of_the_day': quote_of_the_day,
        })

