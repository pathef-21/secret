from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemoryAlbumViewSet, MemoryViewSet, MemoryCommentViewSet

router = DefaultRouter()
router.register(r'albums', MemoryAlbumViewSet, basename='memory-album')
router.register(r'items', MemoryViewSet, basename='memory-item')
router.register(r'comments', MemoryCommentViewSet, basename='memory-comment')

urlpatterns = [
    path('', include(router.urls)),
]

