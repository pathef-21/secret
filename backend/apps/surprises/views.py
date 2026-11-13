from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import LoveLetter, Surprise
from .serializers import (
    LoveLetterSerializer,
    CreateLoveLetterSerializer,
    SurpriseSerializer,
    CreateSurpriseSerializer
)
from apps.couples.permissions import IsCoupleMember

class LoveLettersView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        couple = request.user.couple_membership.couple
        letters = LoveLetter.objects.filter(couple=couple).select_related('sender', 'sender__profile', 'recipient', 'recipient__profile')
        serializer = LoveLetterSerializer(letters, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        couple = request.user.couple_membership.couple
        partner = couple.get_partner_of(request.user)
        if not partner:
            return Response({'detail': 'Votre partenaire doit avoir rejoint le couple pour recevoir une lettre.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CreateLoveLetterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        letter = LoveLetter.objects.create(
            couple=couple,
            sender=request.user,
            recipient=partner,
            **serializer.validated_data
        )
        return Response(LoveLetterSerializer(letter, context={'request': request}).data, status=status.HTTP_201_CREATED)

class OpenLoveLetterView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def post(self, request, letter_id):
        couple = request.user.couple_membership.couple
        letter = get_object_or_404(LoveLetter, id=letter_id, couple=couple)

        if not letter.is_unlocked:
            return Response({'detail': 'Cette lettre est encore scellée par son cadenas d’amour.'}, status=status.HTTP_403_FORBIDDEN)

        if not letter.is_opened and letter.recipient == request.user:
            letter.is_opened = True
            letter.opened_at = timezone.now()
            letter.save(update_fields=['is_opened', 'opened_at'])

        return Response(LoveLetterSerializer(letter, context={'request': request}).data)

class SurprisesView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        couple = request.user.couple_membership.couple
        surprises = Surprise.objects.filter(couple=couple).select_related('creator', 'creator__profile')
        serializer = SurpriseSerializer(surprises, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        couple = request.user.couple_membership.couple
        serializer = CreateSurpriseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        surprise = Surprise.objects.create(
            couple=couple,
            creator=request.user,
            **serializer.validated_data
        )
        return Response(SurpriseSerializer(surprise, context={'request': request}).data, status=status.HTTP_201_CREATED)

class RevealSurpriseView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def post(self, request, surprise_id):
        couple = request.user.couple_membership.couple
        surprise = get_object_or_404(Surprise, id=surprise_id, couple=couple)

        if not surprise.can_be_revealed:
            return Response({'detail': 'La date et l’heure de révélation ne sont pas encore arrivées ! Patience ❤️'}, status=status.HTTP_403_FORBIDDEN)

        surprise.is_revealed = True
        surprise.save(update_fields=['is_revealed'])
        return Response(SurpriseSerializer(surprise, context={'request': request}).data)
