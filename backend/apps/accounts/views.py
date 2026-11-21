import os
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, ChangePasswordSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Bootstrap initial admin account automatically if no superuser exists yet
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@manakbae.com').strip().lower()
        admin_password = os.getenv('ADMIN_PASSWORD', 'ManAkBae2026!')
        req_email = (request.data.get('email') or request.data.get('username') or '').strip().lower()
        req_password = request.data.get('password') or ''

        if (
            req_email == admin_email
            and req_password == admin_password
            and not User.objects.filter(is_superuser=True).exists()
        ):
            user = User.objects.filter(email=admin_email).first()
            if not user:
                user = User.objects.create_superuser(
                    username=os.getenv('ADMIN_USERNAME', 'admin_manakbae'),
                    email=admin_email,
                    password=admin_password,
                    first_name='Admin',
                    last_name='Man Ak Bae',
                )
            else:
                user.is_staff = True
                user.is_superuser = True
                user.set_password(admin_password)
                user.save()

        return super().post(request, *args, **kwargs)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UpdateProfileView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user.profile

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': ['Mot de passe actuel incorrect.']}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Jeton invalide ou déjà révoqué.'}, status=status.HTTP_400_BAD_REQUEST)

class DeleteAccountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'detail': 'Mot de passe requis et valide pour confirmer la suppression.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        # Si membre d'un couple, traiter la dissolution ou notification
        if hasattr(user, 'couple_membership'):
            membership = user.couple_membership
            couple = membership.couple
            couple.delete()  # Cascade supprime le couple et les données associées

        user.delete()
        return Response({'detail': 'Compte supprimé définitivement.'}, status=status.HTTP_200_OK)
