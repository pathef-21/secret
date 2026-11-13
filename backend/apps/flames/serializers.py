from rest_framework import serializers
from .models import Flame, FlameActivity, get_current_dakar_date
from apps.accounts.serializers import UserSerializer

class FlameActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = FlameActivity
        fields = ('id', 'user', 'activity_date', 'has_participated', 'message_count', 'updated_at')

class FlameSerializer(serializers.ModelSerializer):
    today_status = serializers.SerializerMethodField()
    history = serializers.SerializerMethodField()

    class Meta:
        model = Flame
        fields = ('id', 'current_streak', 'longest_streak', 'last_streak_date', 'today_status', 'history')

    def get_today_status(self, obj):
        request = self.context.get('request')
        today = get_current_dakar_date()
        user_participated = False
        partner_participated = False

        if request and request.user:
            user_participated = FlameActivity.objects.filter(
                flame=obj,
                user=request.user,
                activity_date=today,
                has_participated=True
            ).exists()

            partner = obj.couple.get_partner_of(request.user)
            if partner:
                partner_participated = FlameActivity.objects.filter(
                    flame=obj,
                    user=partner,
                    activity_date=today,
                    has_participated=True
                ).exists()

        return {
            'today_date': today.isoformat(),
            'user_participated': user_participated,
            'partner_participated': partner_participated,
            'is_flame_lit_today': obj.last_streak_date == today
        }

    def get_history(self, obj):
        activities = FlameActivity.objects.filter(flame=obj).select_related('user', 'user__profile')[:30]
        return FlameActivitySerializer(activities, many=True).data

