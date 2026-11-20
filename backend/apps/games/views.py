import random
import uuid
from datetime import timedelta
from django.utils import timezone
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
                'description': 'Choisissez Action ou Vérité : des dizaines de révélations et de gages tendres, fun ou coquins.',
                'icon': 'flame-outline',
                'supports_modes': ['all', 'truth', 'dare'],
            },
            {
                'id': GameType.SPICY_COUPLES,
                'title': 'Mode Pimenté 🔥',
                'description': 'Questions passionnées et défis complices pour faire monter la température à deux.',
                'icon': 'bonfire-outline',
            },
            {
                'id': GameType.MOST_LIKELY_TO,
                'title': 'Qui de nous deux ?',
                'description': 'Désignez en même temps celui ou celle qui correspond le plus à la situation !',
                'icon': 'people-outline',
            },
            {
                'id': GameType.NEVER_HAVE_I_EVER,
                'title': 'Je n’ai jamais',
                'description': 'Découvrez vos petits secrets, expériences cachées et anecdotes inavouées.',
                'icon': 'hand-left-outline',
            },
            {
                'id': GameType.WOULD_YOU_RATHER,
                'title': 'Tu préfères quoi ?',
                'description': 'Des dilemmes amoureux impossibles et amusants à trancher ensemble.',
                'icon': 'options-outline',
            },
            {
                'id': GameType.THIS_OR_THAT,
                'title': 'Ceci ou Cela (Rapide)',
                'description': 'Enchaînez des choix express pour comparer vos goûts en amour et au quotidien.',
                'icon': 'flash-outline',
            },
            {
                'id': GameType.COUPLE_QUIZ,
                'title': 'Quiz de Couple',
                'description': 'Testez votre complicité sur vos habitudes, souvenirs et préférences.',
                'icon': 'help-circle-outline',
            },
            {
                'id': GameType.WHO_KNOWS_BETTER,
                'title': 'Qui connaît mieux l’autre ?',
                'description': 'Découvrez qui retient le plus de détails sur la vie et les goûts de son Bae.',
                'icon': 'heart-circle-outline',
            },
            {
                'id': GameType.DEEP_QUESTIONS,
                'title': 'Questions profondes',
                'description': 'Pour mieux se comprendre, parler d’avenir et renforcer votre connexion émotionnelle.',
                'icon': 'chatbubbles-outline',
            },
            {
                'id': GameType.ROMANTIC_CHALLENGES,
                'title': 'Défis Romantiques',
                'description': 'Des missions douces et passionnées à réaliser en direct ou dans la semaine.',
                'icon': 'sparkles-outline',
            },
            {
                'id': GameType.COMPLETE_SENTENCE,
                'title': 'Complète ma phrase',
                'description': 'Terminez la phrase spontanément pour voir si vous êtes sur la même longueur d’onde.',
                'icon': 'create-outline',
            },
            {
                'id': GameType.GUESS_MY_ANSWER,
                'title': 'Devine ma réponse',
                'description': 'Répondez secrètement puis devinez ce que votre moitié a répondu !',
                'icon': 'eye-outline',
            },
        ]
        return Response(games)


class RandomQuestionView(views.APIView):
    permission_classes = (permissions.IsAuthenticated, IsCoupleMember)

    def get(self, request, game_type):
        couple = request.user.couple_membership.couple
        base_qs = GameQuestion.objects.filter(game_type=game_type, is_active=True)

        category = request.query_params.get('category', '').strip().lower()
        if category and category != 'all':
            filtered = base_qs.filter(category=category)
            if filtered.exists():
                base_qs = filtered

        total_count = base_qs.count()
        if total_count == 0:
            return Response(
                {'detail': 'Aucune question disponible pour ce jeu.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Exclure les IDs déjà vus aujourd'hui côté client (?exclude=uuid1,uuid2,...)
        excluded_ids = set()
        exclude_param = request.query_params.get('exclude', '').strip()
        if exclude_param:
            for raw_id in exclude_param.split(','):
                raw_id = raw_id.strip()
                if not raw_id:
                    continue
                try:
                    excluded_ids.add(uuid.UUID(raw_id))
                except ValueError:
                    pass

        # 2. Exclure les questions déjà répondues par ce couple au cours des 14 derniers jours
        recent_cutoff = timezone.now() - timedelta(days=14)
        recent_answered_ids = set(
            GameAnswer.objects.filter(
                session__couple=couple,
                question__game_type=game_type,
                created_at__gte=recent_cutoff,
            ).values_list('question_id', flat=True)
        )

        # Priorité 1 : ni vues aujourd'hui, ni répondues ces 14 derniers jours
        unseen_qs = base_qs.exclude(id__in=excluded_ids | recent_answered_ids)
        pool = unseen_qs

        # Priorité 2 : si tout a été répondu récemment, exclure au moins celles vues dans la session/journée
        if not pool.exists() and excluded_ids:
            pool = base_qs.exclude(id__in=excluded_ids)

        # Priorité 3 : si 100% épuisées aujourd'hui, repartir sur tout le catalogue
        if not pool.exists():
            pool = base_qs

        pool_ids = list(pool.values_list('id', flat=True))
        chosen_id = random.choice(pool_ids)
        question = base_qs.get(id=chosen_id)

        data = GameQuestionSerializer(question).data
        data['remaining_count'] = max(0, len(pool_ids) - 1)
        data['total_count'] = total_count
        return Response(data)


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
