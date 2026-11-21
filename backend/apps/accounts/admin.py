from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('email', 'username', 'first_name', 'is_online_badge', 'last_seen_display', 'date_joined', 'is_staff')
    list_filter = ('is_staff', 'is_active', 'profile__is_online')
    search_fields = ('email', 'username', 'first_name', 'profile__nickname')
    ordering = ('-date_joined',)

    @admin.display(boolean=True, description='En ligne')
    def is_online_badge(self, obj):
        return hasattr(obj, 'profile') and obj.profile.is_online

    @admin.display(description='Dernière activité')
    def last_seen_display(self, obj):
        return obj.profile.last_seen if hasattr(obj, 'profile') else None


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'nickname', 'is_online', 'last_seen', 'relationship_status')
    list_filter = ('is_online', 'relationship_status')
    search_fields = ('user__email', 'user__username', 'nickname')
    ordering = ('-is_online', '-last_seen')
