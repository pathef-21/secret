from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import MemoryAlbum, Memory, MemoryComment
from .serializers import MemoryAlbumSerializer, MemorySerializer, MemoryCommentSerializer
from apps.couples.permissions import IsCoupleMember

class MemoryAlbumViewSet(viewsets.ModelViewSet):
    serializer_class = MemoryAlbumSerializer
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        couple = self.request.user.couple_membership.couple
        return MemoryAlbum.objects.filter(couple=couple).prefetch_related('memories')

    def perform_create(self, serializer):
        couple = self.request.user.couple_membership.couple
        serializer.save(couple=couple)

class MemoryViewSet(viewsets.ModelViewSet):
    serializer_class = MemorySerializer
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        couple = self.request.user.couple_membership.couple
        queryset = Memory.objects.filter(couple=couple).select_related('created_by', 'created_by__profile', 'album').prefetch_related('comments', 'comments__user')
        album_id = self.request.query_params.get('album')
        if album_id:
            queryset = queryset.filter(album_id=album_id)
        return queryset

    def perform_create(self, serializer):
        couple = self.request.user.couple_membership.couple
        serializer.save(couple=couple, created_by=self.request.user)

class MemoryCommentViewSet(viewsets.ModelViewSet):
    serializer_class = MemoryCommentSerializer
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get_queryset(self):
        couple = self.request.user.couple_membership.couple
        return MemoryComment.objects.filter(memory__couple=couple).select_related('user', 'user__profile')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
