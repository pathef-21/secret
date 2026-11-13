from rest_framework import viewsets, permissions
from django.utils import timezone
from .models import CalendarEvent
from .serializers import CalendarEventSerializer
from apps.couples.permissions import IsCoupleMember

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get_queryset(self):
        couple = self.request.user.couple_membership.couple
        queryset = CalendarEvent.objects.filter(couple=couple).select_related('created_by', 'created_by__profile')
        filter_type = self.request.query_params.get('filter')
        now = timezone.now()

        if filter_type == 'upcoming':
            queryset = queryset.filter(start_time__gte=now).order_by('start_time')
        elif filter_type == 'past':
            queryset = queryset.filter(start_time__lt=now).order_by('-start_time')
        else:
            queryset = queryset.order_by('start_time')

        return queryset

    def perform_create(self, serializer):
        couple = self.request.user.couple_membership.couple
        serializer.save(couple=couple, created_by=self.request.user)
