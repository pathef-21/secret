from rest_framework import serializers
from .models import GameQuestion, GameSession, GameAnswer, GameType
from apps.accounts.serializers import UserSerializer

class GameQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameQuestion
        fields = ('id', 'game_type', 'question_text', 'category', 'options')

class GameAnswerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    question = GameQuestionSerializer(read_only=True)

    class Meta:
        model = GameAnswer
        fields = ('id', 'user', 'question', 'answer_text', 'partner_guess', 'is_matched', 'created_at')

class GameSessionSerializer(serializers.ModelSerializer):
    answers = GameAnswerSerializer(many=True, read_only=True)
    game_type_display = serializers.CharField(source='get_game_type_display', read_only=True)

    class Meta:
        model = GameSession
        fields = (
            'id', 'game_type', 'game_type_display', 'status',
            'score_initiator', 'score_partner', 'current_turn',
            'answers', 'created_at', 'updated_at'
        )

