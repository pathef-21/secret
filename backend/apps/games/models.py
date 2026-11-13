import uuid
from django.db import models
from django.conf import settings
from apps.couples.models import Couple

class GameType(models.TextChoices):
    TRUTH_OR_DARE = 'truth_or_dare', 'Action ou Vérité'
    WOULD_YOU_RATHER = 'would_you_rather', 'Tu Préfères Quoi ?'
    COUPLE_QUIZ = 'couple_quiz', 'Quiz de Couple'
    WHO_KNOWS_BETTER = 'who_knows_better', 'Qui Connaît Mieux L’autre ?'
    DEEP_QUESTIONS = 'deep_questions', 'Questions Pour Mieux Se Connaître'
    ROMANTIC_CHALLENGES = 'romantic_challenges', 'Défis Romantiques'
    GUESS_MY_ANSWER = 'guess_my_answer', 'Devine Ma Réponse'

class GameQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game_type = models.CharField(max_length=30, choices=GameType.choices, db_index=True)
    question_text = models.TextField()
    category = models.CharField(max_length=50, blank=True, default='romantic')
    options = models.JSONField(blank=True, null=True, help_text="Liste des choix pour QCM ou Tu préfères")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_game_type_display()}] {self.question_text[:50]}"

class GameSession(models.Model):
    STATUS_CHOICES = (
        ('active', 'En cours'),
        ('completed', 'Terminée'),
        ('abandoned', 'Abandonnée'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='game_sessions')
    game_type = models.CharField(max_length=30, choices=GameType.choices)
    current_turn = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_game_turns'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    score_initiator = models.PositiveIntegerField(default=0)
    score_partner = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.game_type} - {self.couple.name} ({self.status})"

class GameAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(GameQuestion, on_delete=models.CASCADE, related_name='session_answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_answers')
    answer_text = models.TextField()
    partner_guess = models.TextField(blank=True, null=True, help_text="Ce que le partenaire avait deviné")
    is_matched = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
