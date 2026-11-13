from django.core.management.base import BaseCommand
from apps.games.models import GameQuestion, GameType

QUESTIONS_DATA = [
    # 1. Action ou vérité
    {
        'game_type': GameType.TRUTH_OR_DARE,
        'category': 'truth',
        'question_text': 'Quel a été ton premier sentiment exact quand tu m’as vu(e) pour la première fois ?',
        'options': None
    },
    {
        'game_type': GameType.TRUTH_OR_DARE,
        'category': 'truth',
        'question_text': 'Quelle est la chose la plus folle que tu ferais pour moi sans hésiter ?',
        'options': None
    },
    {
        'game_type': GameType.TRUTH_OR_DARE,
        'category': 'dare',
        'question_text': 'Envoie-moi tout de suite un message vocal de 30 secondes en me disant pourquoi je suis exceptionnel(le).',
        'options': None
    },
    {
        'game_type': GameType.TRUTH_OR_DARE,
        'category': 'dare',
        'question_text': 'Prends un selfie tout de suite en faisant la grimace la plus mignonne possible.',
        'options': None
    },
    # 2. Tu préfères quoi ?
    {
        'game_type': GameType.WOULD_YOU_RATHER,
        'category': 'romantic',
        'question_text': 'Tu préfères quoi pour notre prochain week-end ?',
        'options': ['Une cabane isolée en pleine nature avec feu de bois', 'Un hôtel de luxe avec spa et vue sur l’océan']
    },
    {
        'game_type': GameType.WOULD_YOU_RATHER,
        'category': 'romantic',
        'question_text': 'Tu préfères quoi au quotidien ?',
        'options': ['Que je te cuisine un bon dîner aux chandelles', 'Qu’on commande et qu’on passe la soirée à se faire des câlins devant un film']
    },
    {
        'game_type': GameType.WOULD_YOU_RATHER,
        'category': 'fun',
        'question_text': 'Tu préfères quoi ?',
        'options': ['Ne pouvoir m’embrasser que sur le front pendant 1 mois', 'Ne pas pouvoir me tenir la main en public pendant 1 mois']
    },
    # 3. Quiz de couple
    {
        'game_type': GameType.COUPLE_QUIZ,
        'category': 'habits',
        'question_text': 'Quel est mon plat préféré au monde ?',
        'options': ['Thiéboudienne / Riz au poisson', 'Pastels / Dibi', 'Pizza artisanale', 'Burger gourmet']
    },
    {
        'game_type': GameType.COUPLE_QUIZ,
        'category': 'dreams',
        'question_text': 'Quelle est ma destination de voyage de rêve ultime ?',
        'options': ['Zanzibar / Îles Maldives', 'Japon / Tokyo', 'Paris / Italie', 'Bali / Indonésie']
    },
    # 4. Qui connaît mieux l'autre ?
    {
        'game_type': GameType.WHO_KNOWS_BETTER,
        'category': 'details',
        'question_text': 'Quelle est ma plus grande phobie secrète ?',
        'options': None
    },
    {
        'game_type': GameType.WHO_KNOWS_BETTER,
        'category': 'details',
        'question_text': 'Quelle chanson me fait immédiatement penser à toi ?',
        'options': None
    },
    # 5. Questions profondes
    {
        'game_type': GameType.DEEP_QUESTIONS,
        'category': 'future',
        'question_text': 'Où imagines-tu notre couple dans exactement 5 ans ?',
        'options': None
    },
    {
        'game_type': GameType.DEEP_QUESTIONS,
        'category': 'emotions',
        'question_text': 'À quel moment précis as-tu su que j’étais devenu(e) indispensable à ton bonheur ?',
        'options': None
    },
    # 6. Défis romantiques
    {
        'game_type': GameType.ROMANTIC_CHALLENGES,
        'category': 'challenge',
        'question_text': 'Écris-moi une lettre d’amour dans l’application avant minuit.',
        'options': None
    },
    {
        'game_type': GameType.ROMANTIC_CHALLENGES,
        'category': 'challenge',
        'question_text': 'Organise notre prochain date surprise sans me dire où on va !',
        'options': None
    },
    # 7. Devine ma réponse
    {
        'game_type': GameType.GUESS_MY_ANSWER,
        'category': 'guess',
        'question_text': 'Si nous devions adopter un animal de compagnie ensemble aujourd’hui, ce serait quoi ?',
        'options': None
    },
    {
        'game_type': GameType.GUESS_MY_ANSWER,
        'category': 'guess',
        'question_text': 'Quel est mon rituel du matin préféré quand nous sommes ensemble ?',
        'options': None
    }
]

class Command(BaseCommand):
    help = 'Peuple la base de données avec des questions romantiques pour les jeux de couple'

    def handle(self, *args, **options):
        created_count = 0
        for item in QUESTIONS_DATA:
            obj, created = GameQuestion.objects.get_or_create(
                game_type=item['game_type'],
                question_text=item['question_text'],
                defaults={
                    'category': item['category'],
                    'options': item['options']
                }
            )
            if created:
                created_count += 1
        self.stdout.write(self.style.SUCCESS(f'{created_count} questions romantiques créées avec succès !'))

