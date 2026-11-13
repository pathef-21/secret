from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CurrentUserView,
    UpdateProfileView,
    ChangePasswordView,
    LogoutView,
    DeleteAccountView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='user_me'),
    path('profile/', UpdateProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('delete-account/', DeleteAccountView.as_view(), name='auth_delete_account'),
]

