from django.contrib import admin
from .models import Couple, CoupleMembership, CoupleInvitation


class CoupleMembershipInline(admin.TabularInline):
    model = CoupleMembership
    extra = 0


@admin.register(Couple)
class CoupleAdmin(admin.ModelAdmin):
    inlines = (CoupleMembershipInline,)
    list_display = ('name', 'relationship_start_date', 'members_count', 'created_at')
    search_fields = ('name',)

    @admin.display(description='Membres')
    def members_count(self, obj):
        return obj.memberships.count()


@admin.register(CoupleInvitation)
class CoupleInvitationAdmin(admin.ModelAdmin):
    list_display = ('code', 'couple', 'inviter', 'is_used', 'expires_at', 'created_at')
    list_filter = ('is_used',)
    search_fields = ('code', 'couple__name', 'inviter__email')
