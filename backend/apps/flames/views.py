from rest_framework import views, status, permissions
from rest_framework.response import Response
from .models import Flame
from .serializers import FlameSerializer
from apps.couples.permissions import IsCoupleMember

class FlameDetailView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        couple = request.user.couple_membership.couple
        flame, _ = Flame.objects.get_or_create(couple=couple)
        serializer = FlameSerializer(flame, context={'request': request})
        return Response(serializer.data)
