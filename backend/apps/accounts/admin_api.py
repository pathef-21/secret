from datetime import timedelta
from django.utils import timezone
from django.db.models import Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import get_user_model

from apps.couples.models import Couple
from apps.messaging.models import Message
from apps.flames.models import Flame
from apps.memories.models import Memory
from apps.surprises.models import LoveLetter
from apps.calendar_app.models import CalendarEvent
from apps.games.models import GameSession

User = get_user_model()


class AdminStatsAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated, permissions.IsAdminUser)

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        last_24h = now - timedelta(hours=24)

        users_qs = User.objects.select_related('profile', 'couple_membership__couple').order_by('-date_joined')
        total_users = users_qs.count()
        new_users_today = users_qs.filter(date_joined__gte=today_start).count()
        online_users = users_qs.filter(profile__is_online=True).count()
        active_24h = users_qs.filter(profile__last_seen__gte=last_24h).count()

        couples_qs = Couple.objects.prefetch_related('memberships__user__profile').select_related('flame').order_by('-created_at')
        total_couples = couples_qs.count()
        complete_couples = sum(1 for c in couples_qs if c.memberships.count() >= 2)

        total_messages = Message.objects.count()
        messages_today = Message.objects.filter(created_at__gte=today_start).count()
        max_flame = Flame.objects.aggregate(best=Max('longest_streak'))['best'] or 0
        total_memories = Memory.objects.count()
        total_letters = LoveLetter.objects.count()
        total_events = CalendarEvent.objects.count()
        total_games = GameSession.objects.count()

        users_list = []
        for u in users_qs[:100]:
            prof = getattr(u, 'profile', None)
            membership = getattr(u, 'couple_membership', None)
            users_list.append({
                'id': u.id,
                'email': u.email,
                'username': u.username,
                'first_name': u.first_name or u.username,
                'nickname': prof.nickname if prof else '',
                'is_online': prof.is_online if prof else False,
                'last_seen': prof.last_seen.isoformat() if (prof and prof.last_seen) else None,
                'couple_name': membership.couple.name if membership else None,
                'is_staff': u.is_staff,
                'date_joined': u.date_joined.isoformat(),
            })

        couples_list = []
        for c in couples_qs[:50]:
            members = [
                (m.user.profile.nickname if hasattr(m.user, 'profile') and m.user.profile.nickname else m.user.first_name or m.user.username)
                for m in c.memberships.all()
            ]
            flame_streak = c.flame.current_streak if hasattr(c, 'flame') else 0
            flame_best = c.flame.longest_streak if hasattr(c, 'flame') else 0
            couples_list.append({
                'id': str(c.id),
                'name': c.name,
                'members': members,
                'members_count': len(members),
                'current_streak': flame_streak,
                'longest_streak': flame_best,
                'created_at': c.created_at.isoformat(),
            })

        return Response({
            'kpis': {
                'total_users': total_users,
                'new_users_today': new_users_today,
                'online_users': online_users,
                'active_24h': active_24h,
                'total_couples': total_couples,
                'complete_couples': complete_couples,
                'total_messages': total_messages,
                'messages_today': messages_today,
                'max_flame': max_flame,
                'total_memories': total_memories,
                'total_letters': total_letters,
                'total_events': total_events,
                'total_games': total_games,
            },
            'users': users_list,
            'couples': couples_list,
            'updated_at': now.isoformat(),
        })
