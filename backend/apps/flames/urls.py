from django.urls import path
from .views import FlameDetailView, DailyInstantsView, ViewDailyInstantView

urlpatterns = [
    path('', FlameDetailView.as_view(), name='flame_detail'),
    path('instants/', DailyInstantsView.as_view(), name='daily_instants'),
    path('instants/<uuid:instant_id>/view/', ViewDailyInstantView.as_view(), name='view_daily_instant'),
]
