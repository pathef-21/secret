from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('id', 'nickname', 'avatar', 'bio', 'birth_date', 'relationship_status', 'last_seen', 'is_online')
        read_only_fields = ('last_seen', 'is_online')

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    has_couple = serializers.SerializerMethodField()
    couple_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'profile', 'has_couple', 'couple_id')
        read_only_fields = ('id', 'has_couple', 'couple_id')

    def get_has_couple(self, obj):
        return hasattr(obj, 'couple_membership') and obj.couple_membership is not None

    def get_couple_id(self, obj):
        if hasattr(obj, 'couple_membership') and obj.couple_membership is not None:
            return str(obj.couple_membership.couple_id)
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    nickname = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'password', 'password_confirm', 'nickname')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        nickname = validated_data.pop('nickname', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        if nickname and hasattr(user, 'profile'):
            user.profile.nickname = nickname
            user.profile.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

