import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Crée automatiquement le compte administrateur Man Ak Bae si inexistant'

    def handle(self, *args, **options):
        email = os.getenv('ADMIN_EMAIL', 'admin@manakbae.com').strip().lower()
        username = os.getenv('ADMIN_USERNAME', 'admin_manakbae').strip()
        password = os.getenv('ADMIN_PASSWORD', 'ManAkBae2026!')

        user = User.objects.filter(email=email).first()
        if user:
            if not user.is_staff or not user.is_superuser:
                user.is_staff = True
                user.is_superuser = True
                user.save(update_fields=['is_staff', 'is_superuser'])
            self.stdout.write(self.style.SUCCESS(f'Compte admin déjà présent : {email}'))
            return

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='Admin',
            last_name='Man Ak Bae',
        )
        if hasattr(user, 'profile'):
            user.profile.nickname = 'Admin ❤️'
            user.profile.save(update_fields=['nickname'])
        self.stdout.write(self.style.SUCCESS(f'Compte admin créé avec succès : {email}'))
