from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from .models import Couple, CoupleMembership, CoupleInvitation
from .serializers import (
    CoupleSerializer,
    CreateCoupleSerializer,
    CoupleInvitationSerializer,
    JoinCoupleSerializer
)
from apps.messaging.models import Conversation
from apps.flames.models import Flame

class MyCoupleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not hasattr(request.user, 'couple_membership'):
            return Response({'detail': 'Aucun espace de couple trouvé pour cet utilisateur.'}, status=status.HTTP_404_NOT_FOUND)
        couple = request.user.couple_membership.couple
        serializer = CoupleSerializer(couple, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        if not hasattr(request.user, 'couple_membership'):
            return Response({'detail': 'Aucun espace de couple trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        couple = request.user.couple_membership.couple
        serializer = CoupleSerializer(couple, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class CreateCoupleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        if hasattr(request.user, 'couple_membership'):
            return Response({'detail': 'Vous appartenez déjà à un couple.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CreateCoupleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        couple = serializer.save()

        # Create creator membership
        CoupleMembership.objects.create(
            couple=couple,
            user=request.user,
            role='creator'
        )

        # Initialize 1-to-1 conversation and Flame tracker
        Conversation.objects.get_or_create(couple=couple)
        Flame.objects.get_or_create(couple=couple)

        # Update profile status
        request.user.profile.relationship_status = 'in_couple'
        request.user.profile.save()

        # Generate immediate invitation code
        invitation = CoupleInvitation.objects.create(
            couple=couple,
            inviter=request.user
        )

        couple_data = CoupleSerializer(couple, context={'request': request}).data
        return Response({
            'couple': couple_data,
            'invitation_code': invitation.code,
            'invitation_expires_at': invitation.expires_at
        }, status=status.HTTP_201_CREATED)

class GenerateInvitationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if not hasattr(request.user, 'couple_membership'):
            return Response({'detail': 'Vous devez créer un couple d’abord.'}, status=status.HTTP_400_BAD_REQUEST)

        couple = request.user.couple_membership.couple
        if couple.memberships.count() >= 2:
            return Response({'detail': 'Votre couple est déjà complet (2 membres maximum).'}, status=status.HTTP_400_BAD_REQUEST)

        # Invalidate old unused invitations
        CoupleInvitation.objects.filter(couple=couple, is_used=False).update(is_used=True)

        invitation = CoupleInvitation.objects.create(
            couple=couple,
            inviter=request.user
        )
        return Response(CoupleInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)

class JoinCoupleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        if hasattr(request.user, 'couple_membership'):
            return Response({'detail': 'Vous appartenez déjà à un couple.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = JoinCoupleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code'].strip().upper()

        try:
            invitation = CoupleInvitation.objects.select_for_update().get(code=code)
        except CoupleInvitation.DoesNotExist:
            return Response({'detail': 'Code d’invitation introuvable ou incorrect.'}, status=status.HTTP_404_NOT_FOUND)

        if not invitation.is_valid():
            return Response({'detail': 'Ce code d’invitation a expiré ou a déjà été utilisé.'}, status=status.HTTP_400_BAD_REQUEST)

        couple = invitation.couple
        if couple.memberships.count() >= 2:
            return Response({'detail': 'Cet espace de couple est déjà complet.'}, status=status.HTTP_400_BAD_REQUEST)

        if invitation.inviter == request.user:
            return Response({'detail': 'Vous ne pouvez pas rejoindre votre propre invitation.'}, status=status.HTTP_400_BAD_REQUEST)

        # Add partner membership
        CoupleMembership.objects.create(
            couple=couple,
            user=request.user,
            role='partner'
        )

        invitation.is_used = True
        invitation.used_by = request.user
        invitation.save()

        request.user.profile.relationship_status = 'in_couple'
        request.user.profile.save()

        # Ensure conversation and flame exist
        Conversation.objects.get_or_create(couple=couple)
        Flame.objects.get_or_create(couple=couple)

        return Response(CoupleSerializer(couple, context={'request': request}).data, status=status.HTTP_200_OK)

class LeaveCoupleView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        if not hasattr(request.user, 'couple_membership'):
            return Response({'detail': 'Vous ne faites partie d’aucun couple.'}, status=status.HTTP_404_NOT_FOUND)

        membership = request.user.couple_membership
        couple = membership.couple
        membership.delete()

        request.user.profile.relationship_status = 'single'
        request.user.profile.save()

        # If empty, delete couple
        if couple.memberships.count() == 0:
            couple.delete()

        return Response({'detail': 'Vous avez quitté l’espace de couple.'}, status=status.HTTP_200_OK)
