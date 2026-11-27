from rest_framework import serializers
from django.utils import timezone
from .models import Couple, CoupleMembership, CoupleInvitation
from apps.accounts.serializers import UserSerializer

class CoupleMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CoupleMembership
        fields = ('id', 'user', 'role', 'joined_at')

class CoupleSerializer(serializers.ModelSerializer):
    memberships = CoupleMembershipSerializer(many=True, read_only=True)
    partner = serializers.SerializerMethodField()
    relationship_days = serializers.SerializerMethodField()
    current_flame = serializers.SerializerMethodField()

    class Meta:
        model = Couple
        fields = (
            'id', 'name', 'cover_image', 'relationship_start_date',
            'is_active', 'created_at', 'memberships', 'partner',
            'relationship_days', 'current_flame'
        )

    def get_partner(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        partner = obj.get_partner_of(request.user)
        return UserSerializer(partner, context={'request': request}).data if partner else None

    def get_relationship_days(self, obj):
        if not obj.relationship_start_date:
            return None
        today = timezone.now().date()
        delta = today - obj.relationship_start_date
        return max(0, delta.days)

    def get_current_flame(self, obj):
        if hasattr(obj, 'flame'):
            return {
                'current_streak': obj.flame.current_streak,
                'longest_streak': obj.flame.longest_streak,
                'last_streak_date': obj.flame.last_streak_date
            }
        return {'current_streak': 0, 'longest_streak': 0, 'last_streak_date': None}

class CreateCoupleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Couple
        fields = ('name', 'cover_image', 'relationship_start_date')

class CoupleInvitationSerializer(serializers.ModelSerializer):
    inviter = UserSerializer(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = CoupleInvitation
        fields = ('id', 'code', 'inviter', 'created_at', 'expires_at', 'is_used', 'is_valid')

class JoinCoupleSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=12, required=True)

