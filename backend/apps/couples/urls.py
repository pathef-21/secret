from django.urls import path
from .views import (
    MyCoupleView,
    CreateCoupleView,
    GenerateInvitationView,
    JoinCoupleView,
    LeaveCoupleView
)
from .dashboard_views import HomeDashboardView

urlpatterns = [
    path('me/', MyCoupleView.as_view(), name='couple_me'),
    path('dashboard/', HomeDashboardView.as_view(), name='couple_dashboard'),
    path('create/', CreateCoupleView.as_view(), name='couple_create'),
    path('invite/', GenerateInvitationView.as_view(), name='couple_invite'),
    path('join/', JoinCoupleView.as_view(), name='couple_join'),
    path('leave/', LeaveCoupleView.as_view(), name='couple_leave'),
]
