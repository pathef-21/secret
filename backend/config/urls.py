"""
URL configuration for Man Ak Bae ❤️ project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/couples/', include('apps.couples.urls')),
    path('api/chat/', include('apps.messaging.urls')),
    path('api/flames/', include('apps.flames.urls')),
    path('api/games/', include('apps.games.urls')),
    path('api/memories/', include('apps.memories.urls')),
    path('api/calendar/', include('apps.calendar_app.urls')),
    path('api/surprises/', include('apps.surprises.urls')),
    path('api/notifications/', include('apps.notifications_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
