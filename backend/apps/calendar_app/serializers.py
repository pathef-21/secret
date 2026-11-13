from rest_framework import serializers
from .models import CalendarEvent
from apps.accounts.serializers import UserSerializer

class CalendarEventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = (
            'id', 'couple', 'created_by', 'title', 'description',
            'category', 'category_display', 'location', 'start_time',
            'end_time', 'is_all_day', 'reminder_minutes_before',
            'is_reminder_sent', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'couple', 'created_by', 'is_reminder_sent', 'created_at', 'updated_at')

