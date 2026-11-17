"""
URL configuration for Man Ak Bae ❤️ project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import JsonResponse

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html'), name='web_app_home'),
    path('health/', lambda r: JsonResponse({'status': 'ok', 'app': 'Man Ak Bae ❤️'}), name='health_check'),
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

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
