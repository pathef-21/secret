import uuid
import secrets
import string
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

def generate_invite_code():
    alphabet = string.ascii_uppercase + string.digits
    # Exclude confusing characters
    for ch in ['O', '0', 'I', '1', 'L']:
        alphabet = alphabet.replace(ch, '')
    return ''.join(secrets.choice(alphabet) for _ in range(8))

class Couple(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, default='Man Ak Bae ❤️')
    cover_image = models.ImageField(upload_to='couples/covers/', blank=True, null=True)
    relationship_start_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.memberships.count()

    def get_partner_of(self, user):
        partner_membership = self.memberships.exclude(user=user).select_related('user', 'user__profile').first()
        return partner_membership.user if partner_membership else None

class CoupleMembership(models.Model):
    ROLE_CHOICES = (
        ('creator', 'Créateur'),
        ('partner', 'Partenaire'),
    )
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='memberships')
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='couple_membership')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='partner')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['couple', 'user'], name='unique_couple_member')
        ]

    def __str__(self):
        return f"{self.user.username} in couple {self.couple.id} ({self.role})"

def default_invitation_expiry():
    return timezone.now() + timedelta(days=2)

class CoupleInvitation(models.Model):
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='invitations')
    inviter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    code = models.CharField(max_length=12, unique=True, default=generate_invite_code)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_invitation_expiry)
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_invitations'
    )

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at and self.couple.memberships.count() < 2

    def __str__(self):
        return f"Invite code {self.code} for couple {self.couple.id}"
