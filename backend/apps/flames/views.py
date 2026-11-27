from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import views, status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Flame, DailyInstant, get_current_dakar_date
from .serializers import FlameSerializer
from apps.couples.permissions import IsCoupleMember
from apps.notifications_app.services import send_push_notification


def _serialize_instant_meta(instant, is_mine):
    if not instant:
        return None
    sender = instant.sender
    sender_name = (
        sender.profile.nickname
        if hasattr(sender, 'profile') and sender.profile.nickname
        else (sender.first_name or sender.username)
    )
    return {
        'id': str(instant.id),
        'media_type': instant.media_type,
        'caption': instant.caption,
        'sender_name': sender_name,
        'is_mine': is_mine,
        'viewed_by_partner': instant.viewed_by_partner,
        'can_view': (not is_mine) and (not instant.viewed_by_partner),
        'viewed_at': instant.viewed_at.isoformat() if instant.viewed_at else None,
        'created_at': instant.created_at.isoformat(),
    }


class FlameDetailView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        couple = request.user.couple_membership.couple
        flame, _ = Flame.objects.get_or_create(couple=couple)
        serializer = FlameSerializer(flame, context={'request': request})
        return Response(serializer.data)


class DailyInstantsView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        user = request.user
        couple = user.couple_membership.couple
        today = get_current_dakar_date()
        partner = couple.get_partner_of(user)

        my_latest = DailyInstant.objects.filter(
            couple=couple, sender=user, instant_date=today
        ).order_by('-created_at').first()

        partner_latest = None
        partner_unviewed_count = 0
        if partner:
            partner_qs = DailyInstant.objects.filter(
                couple=couple, sender=partner, instant_date=today
            ).order_by('-created_at')
            # Show the newest unviewed instant first, else the latest viewed instant
            partner_latest = partner_qs.filter(viewed_by_partner=False).first() or partner_qs.first()
            partner_unviewed_count = partner_qs.filter(viewed_by_partner=False).count()

        flame, _ = Flame.objects.get_or_create(couple=couple)
        return Response({
            'date': str(today),
            'my_sent_today': my_latest is not None,
            'partner_sent_today': partner_latest is not None,
            'partner_unviewed_count': partner_unviewed_count,
            'my_instant': _serialize_instant_meta(my_latest, is_mine=True),
            'partner_instant': _serialize_instant_meta(partner_latest, is_mine=False),
            'flame': {
                'current_streak': flame.current_streak,
                'longest_streak': flame.longest_streak,
                'is_lit_today': flame.last_streak_date == today,
            },
        })

    def post(self, request):
        user = request.user
        couple = user.couple_membership.couple
        media_file = request.FILES.get('media_file') or request.FILES.get('file')
        if not media_file:
            return Response({'detail': 'Une photo ou vidéo est requise.'}, status=status.HTTP_400_BAD_REQUEST)

        media_type = (request.data.get('media_type') or 'image').strip().lower()
        if media_type not in ('image', 'video'):
            content_type = getattr(media_file, 'content_type', '') or ''
            media_type = 'video' if content_type.startswith('video/') else 'image'

        caption = (request.data.get('caption') or '').strip()[:160]
        today = get_current_dakar_date()

        instant = DailyInstant.objects.create(
            couple=couple,
            sender=user,
            instant_date=today,
            media_file=media_file,
            media_type=media_type,
            caption=caption,
        )

        # Validate daily instant criterion for the Flame streak
        flame, _ = Flame.objects.get_or_create(couple=couple)
        flame_increased, current_streak = flame.record_instant(user)

        # Notify partner
        partner = couple.get_partner_of(user)
        if partner:
            sender_name = (
                user.profile.nickname
                if hasattr(user, 'profile') and user.profile.nickname
                else (user.first_name or user.username)
            )
            try:
                send_push_notification(
                    user=partner,
                    title=f"🔥 Instant de {sender_name}",
                    body="Nouvel Instant (photo/vidéo) à voir une seule fois !",
                    data={'type': 'instant', 'instant_id': str(instant.id)},
                    notification_type='flame',
                )
            except Exception:
                pass

        return Response({
            'instant': _serialize_instant_meta(instant, is_mine=True),
            'flame_increased': flame_increased,
            'current_streak': current_streak,
            'is_lit_today': flame.last_streak_date == today,
        }, status=status.HTTP_201_CREATED)


class ViewDailyInstantView(views.APIView):
    """
    Ouvre l'Instant du partenaire UNE SEULE FOIS.
    Toute tentative ultérieure renvoie 410 Gone.
    """
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def post(self, request, instant_id):
        user = request.user
        couple = user.couple_membership.couple
        instant = get_object_or_404(DailyInstant, id=instant_id, couple=couple)

        if instant.sender_id == user.id:
            return Response(
                {'detail': 'Vous ne pouvez pas consommer votre propre Instant.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if instant.viewed_by_partner:
            return Response(
                {'detail': 'Cet Instant a déjà été vu (lecture unique) 🔥'},
                status=status.HTTP_410_GONE,
            )

        instant.viewed_by_partner = True
        instant.viewed_at = timezone.now()
        instant.save(update_fields=['viewed_by_partner', 'viewed_at'])

        media_url = instant.media_file.url if instant.media_file else ''
        if media_url and not media_url.startswith('http'):
            media_url = request.build_absolute_uri(media_url)

        sender = instant.sender
        sender_name = (
            sender.profile.nickname
            if hasattr(sender, 'profile') and sender.profile.nickname
            else (sender.first_name or sender.username)
        )

        return Response({
            'id': str(instant.id),
            'media_url': media_url,
            'media_type': instant.media_type,
            'caption': instant.caption,
            'sender_name': sender_name,
            'created_at': instant.created_at.isoformat(),
        }, status=status.HTTP_200_OK)
