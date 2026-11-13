import random
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import GameQuestion, GameSession, GameAnswer, GameType
from .serializers import GameQuestionSerializer, GameSessionSerializer, GameAnswerSerializer
from apps.couples.permissions import IsCoupleMember

class AvailableGamesView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        games = [
            {
                'id': GameType.TRUTH_OR_DARE,
                'title': 'Action ou Vérité',
                'description': 'Pimentez votre complicité avec des révélations et des gages coquins ou tendres.',
                'icon': 'flame-outline'
            },
            {
                'id': GameType.WOULD_YOU_RATHER,
                'title': 'Tu préfères quoi ?',
                'description': 'Des dilemmes amoureux impossibles et amusants à trancher ensemble.',
                'icon': 'options-outline'
            },
            {
                'id': GameType.COUPLE_QUIZ,
                'title': 'Quiz de Couple',
                'description': 'Testez votre complicité sur vos habitudes, souvenirs et préférences.',
                'icon': 'help-circle-outline'
            },
            {
                'id': GameType.WHO_KNOWS_BETTER,
                'title': 'Qui connaît mieux l’autre ?',
                'description': 'Découvrez qui retient le plus de détails sur la vie et les goûts de son Bae.',
                'icon': 'heart-circle-outline'
            },
            {
                'id': GameType.DEEP_QUESTIONS,
                'title': 'Questions profondes',
                'description': 'Pour mieux se comprendre, parler d’avenir et renforcer votre connexion émotionnelle.',
                'icon': 'chatbubbles-outline'
            },
            {
                'id': GameType.ROMANTIC_CHALLENGES,
                'title': 'Défis Romantiques',
                'description': 'Des missions douces et passionnées à réaliser en direct ou dans la semaine.',
                'icon': 'sparkles-outline'
            },
            {
                'id': GameType.GUESS_MY_ANSWER,
                'title': 'Devine ma réponse',
                'description': 'Répondez secrètement puis devinez ce que votre moitié a répondu !',
                'icon': 'eye-outline'
            },
        ]
        return Response(games)

class RandomQuestionView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request, game_type):
        questions = GameQuestion.objects.filter(game_type=game_type, is_active=True)
        if not questions.exists():
            return Response({'detail': 'Aucune question disponible pour ce jeu.'}, status=status.HTTP_404_NOT_FOUND)

        # Get random question
        count = questions.count()
        random_index = random.randint(0, count - 1)
        question = questions[random_index]

        return Response(GameQuestionSerializer(question).data)

class ActiveSessionsView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request):
        couple = request.user.couple_membership.couple
        sessions = GameSession.objects.filter(couple=couple).order_by('-created_at')[:10]
        return Response(GameSessionSerializer(sessions, many=True).data)

    def post(self, request):
        couple = request.user.couple_membership.couple
        game_type = request.data.get('game_type')
        if not game_type:
            return Response({'detail': 'game_type requis.'}, status=status.HTTP_400_BAD_REQUEST)

        partner = couple.get_partner_of(request.user)
        session = GameSession.objects.create(
            couple=couple,
            game_type=game_type,
            current_turn=partner or request.user
        )
        return Response(GameSessionSerializer(session).data, status=status.HTTP_201_CREATED)

class SubmitGameAnswerView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def post(self, request, session_id):
        couple = request.user.couple_membership.couple
        session = get_object_or_404(GameSession, id=session_id, couple=couple)

        question_id = request.data.get('question_id')
        answer_text = request.data.get('answer_text', '').strip()
        partner_guess = request.data.get('partner_guess', '').strip()

        question = get_object_or_404(GameQuestion, id=question_id)

        answer = GameAnswer.objects.create(
            session=session,
            question=question,
            user=request.user,
            answer_text=answer_text,
            partner_guess=partner_guess
        )

        # Vérifier si l'autre partenaire avait répondu et comparer
        partner = couple.get_partner_of(request.user)
        if partner:
            partner_answer = GameAnswer.objects.filter(session=session, question=question, user=partner).first()
            if partner_answer and partner_guess:
                if partner_guess.lower() in partner_answer.answer_text.lower() or partner_answer.answer_text.lower() in partner_guess.lower():
                    answer.is_matched = True
                    answer.save(update_fields=['is_matched'])
                    if session.couple.memberships.filter(role='creator', user=request.user).exists():
                        session.score_initiator += 1
                    else:
                        session.score_partner += 1
                    session.save()

        return Response(GameAnswerSerializer(answer).data, status=status.HTTP_201_CREATED)
