import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from apps.couples.models import Couple, CoupleInvitation
from apps.messaging.models import Conversation, Message
from apps.flames.models import Flame
from apps.surprises.models import LoveLetter

User = get_user_model()

@pytest.mark.django_db
class TestManAkBaeCore:
    def setup_method(self):
        self.client = APIClient()

        # Create User A (Moi)
        self.user_a = User.objects.create_user(
            username='user_a',
            email='a@example.com',
            password='Password123!',
            first_name='Abdoulaye'
        )

        # Create User B (Bae)
        self.user_b = User.objects.create_user(
            username='user_b',
            email='b@example.com',
            password='Password123!',
            first_name='Fatou'
        )

        # Create User C (Intruder)
        self.user_c = User.objects.create_user(
            username='user_c',
            email='c@example.com',
            password='Password123!',
            first_name='Intrus'
        )

    def test_authentication_workflow(self):
        # 1. Inscription
        register_url = reverse('auth_register')
        res = self.client.post(register_url, {
            'username': 'new_lover',
            'email': 'lover@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'nickname': 'Mon Trésor'
        })
        assert res.status_code == status.HTTP_201_CREATED
        assert 'access' in res.data
        assert 'refresh' in res.data

        # 2. Login
        login_url = reverse('auth_login')
        login_res = self.client.post(login_url, {
            'email': 'lover@example.com',
            'password': 'StrongPassword123!'
        })
        assert login_res.status_code == status.HTTP_200_OK
        assert 'access' in login_res.data

    def test_couple_creation_and_partner_joining(self):
        self.client.force_authenticate(user=self.user_a)

        # User A creates couple
        create_url = reverse('couple_create')
        res = self.client.post(create_url, {
            'name': 'Abdoulaye & Fatou ❤️',
            'relationship_start_date': '2023-01-15'
        })
        assert res.status_code == status.HTTP_201_CREATED
        invite_code = res.data['invitation_code']
        assert invite_code is not None

        # User B joins with invite code
        self.client.force_authenticate(user=self.user_b)
        join_url = reverse('couple_join')
        join_res = self.client.post(join_url, {'code': invite_code})
        assert join_res.status_code == status.HTTP_200_OK
        assert len(join_res.data['memberships']) == 2

        # User C tries to join the same couple (MUST FAIL - max 2 partners)
        self.client.force_authenticate(user=self.user_c)
        fail_res = self.client.post(join_url, {'code': invite_code})
        assert fail_res.status_code == status.HTTP_400_BAD_REQUEST

    def test_messaging_and_flame_streaks(self):
        # Setup couple
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(reverse('couple_create'), {'name': 'Love Couple'})
        invite_code = res.data['invitation_code']

        self.client.force_authenticate(user=self.user_b)
        self.client.post(reverse('couple_join'), {'code': invite_code})

        # User A sends a message
        self.client.force_authenticate(user=self.user_a)
        msg_res = self.client.post(reverse('send_message'), {
            'message_type': 'text',
            'content': 'Bonjour mon cœur ❤️'
        })
        assert msg_res.status_code == status.HTTP_201_CREATED
        # User A has participated, but partner has not yet, so streak not yet incremented to full day
        assert msg_res.data['flame_info']['increased'] is False

        # User B replies
        self.client.force_authenticate(user=self.user_b)
        reply_res = self.client.post(reverse('send_message'), {
            'message_type': 'text',
            'content': 'Bonjour ma vie ! ❤️🔥'
        })
        assert reply_res.status_code == status.HTTP_201_CREATED
        # Now both participated today! Flame increases!
        assert reply_res.data['flame_info']['increased'] is True
        assert reply_res.data['flame_info']['current_streak'] == 1

        # Check Flame detail endpoint
        flame_res = self.client.get(reverse('flame_detail'))
        assert flame_res.status_code == status.HTTP_200_OK
        assert flame_res.data['current_streak'] == 1
        assert flame_res.data['today_status']['user_participated'] is True
        assert flame_res.data['today_status']['partner_participated'] is True

    def test_love_letters_lock_mechanism(self):
        # Setup couple
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(reverse('couple_create'), {'name': 'Love Letters Test'})
        invite_code = res.data['invitation_code']

        self.client.force_authenticate(user=self.user_b)
        self.client.post(reverse('couple_join'), {'code': invite_code})

        # User A writes a future love letter (unlocks in 7 days)
        self.client.force_authenticate(user=self.user_a)
        future_date = timezone.now() + timedelta(days=7)
        create_letter_res = self.client.post(reverse('love_letters'), {
            'title': 'Pour nos 2 ans',
            'content': 'Je t’aime plus que tout au monde, surprise secrète !',
            'unlock_at': future_date.isoformat(),
            'font_style': 'romantic_serif',
            'seal_color': '#F2A7C6'
        })
        assert create_letter_res.status_code == status.HTTP_201_CREATED
        letter_id = create_letter_res.data['id']

        # User B (recipient) tries to read it before unlock
        self.client.force_authenticate(user=self.user_b)
        list_res = self.client.get(reverse('love_letters'))
        letter_data = list_res.data[0]
        # The content MUST be masked!
        assert letter_data['content_masked'] is True
        assert "scellée" in letter_data['content']

        # User B tries to force open
        open_res = self.client.post(reverse('open_love_letter', kwargs={'letter_id': letter_id}))
        assert open_res.status_code == status.HTTP_403_FORBIDDEN

