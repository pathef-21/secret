from django.urls import path
from .views import FlameDetailView

urlpatterns = [
    path('', FlameDetailView.as_view(), name='flame_detail'),
]

