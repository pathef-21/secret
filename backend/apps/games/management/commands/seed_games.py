from django.core.management.base import BaseCommand
from apps.games.models import GameQuestion, GameType

# Catalogue 100 % Culture Sénégalaise & Couple à Distance (Man Ak Bae ❤️)
QUESTIONS_DATA = [
    # =========================================================================
    # 1. ACTION OU VÉRITÉ (Culture Sénégalaise + Distance)
    # =========================================================================
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'À quel moment exact tu t’es dit « Ki moy sama xol, sama jëkkër/jabar » ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Malgré la distance, quel est le moment où je te manque le plus dans ta journée ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'As-tu déjà fait semblant d’être fâché(e) au téléphone juste pour que je te dise « baal ma sama chéri(e) » ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel est ton plus beau souvenir de nous deux au Sénégal ou en appel tard le soir ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Si j’atterrissais par surprise à AIBD (ou devant ta porte) ce soir, quelle serait ta toute première réaction ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle habitude bien sénégalaise chez moi te fait le plus rire ou fondre ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle a été ta plus grosse crise de jalousie à distance sans me le dire ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel vocal de moi as-tu réécouté plusieurs fois quand tu te sentais seul(e) ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Comment imagines-tu notre premier Tabaski ou Korité ensemble dans notre propre maison ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Qu’est-ce qui te rassure le plus dans notre relation malgré les kilomètres ?', 'options': None},

    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie-moi tout de suite un message vocal de 30 secondes en wolof pour me dire « Dama la nob » et pourquoi je suis unique.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Lance un appel vocal maintenant et chante-moi 10 secondes d’une chanson sénégalaise (Wally Seck, Viviane, Youssou Ndour ou Pape Diouf) !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie un selfie tout de suite là où tu es avec ton plus beau sourire pour me rapprocher de toi.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Écris-moi une petite déclaration d’amour mélangée français + wolof dans le chat !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Décris en détail le premier plat sénégalais qu’on va partager ensemble le jour de nos retrouvailles.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie un vocal où tu me fais une promesse officielle pour le jour où la distance sera terminée.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Change mon surnom sur ton téléphone en un surnom doux en wolof (ex: Sama Xol, Sama Yaakaar) pendant 24h.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie une photo de ce que tu vois autour de toi maintenant pour que je voyage un peu avec toi.', 'options': None},

    # =========================================================================
    # 2. MODE PIMENTÉ 🔥 (À distance + Retrouvailles)
    # =========================================================================
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Le jour de nos retrouvailles, quelle est la toute première chose que tu veux qu’on fasse une fois seuls ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Qu’est-ce qui te fait le plus craquer dans ma voix quand on s’appelle tard la nuit ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Décris notre week-end romantique idéal à Saly ou sur la Petite Côte, loin de tout le monde.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel parfum ou thiouraye te rappelle immédiatement moi ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Si je pouvais apparaître dans ta chambre pendant 10 minutes maintenant, tu ferais quoi ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel mot doux en wolof ou en français tu adores m’entendre chuchoter en vocal ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Envoie-moi dans le chat un message mystérieux qui va me faire compter les secondes jusqu’à nos retrouvailles.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Tu préfères les longs câlins silencieux à l’aéroport ou les baisers volés dès qu’on est seuls ?', 'options': ['Longs câlins à l’aéroport 🤗', 'Baisers volés dès qu’on est seuls 💋']},

    # =========================================================================
    # 3. QUI DE NOUS DEUX ? (Sénégal + Distance)
    # =========================================================================
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux s’endort en premier pendant nos appels tard le soir ?', 'options': ['Moi 😴', 'Mon Bae 😴', 'On tient jusqu’à Fajr !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est le plus jaloux / la plus jalouse à distance ?', 'options': ['Moi 😅', 'Mon Bae ❤️', 'À égalité !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux prépare le meilleur Thiéboudienne ou Yassa ?', 'options': ['Moi 👨‍🍳', 'Mon Bae 👩‍🍳', 'On cuisine ensemble !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux pleurera en premier le jour des retrouvailles à AIBD ?', 'options': ['Moi 🥺', 'Mon Bae 🥺', 'Nous deux ensemble ❤️']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux met le plus de temps à répondre aux messages quand il/elle est occupé(e) ?', 'options': ['Moi 📱', 'Mon Bae 📱', 'On répond vite tous les deux']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux fait le meilleur Ataya (les 3 verres bien moussus) ?', 'options': ['Moi 🍵', 'Mon Bae 🍵', 'Aucun des deux 😅']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux envoie les plus longs vocaux de 5 minutes ?', 'options': ['Moi 🎙️', 'Mon Bae 🎙️', 'Tous les deux !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est toujours le plus sapé(e) en boubou le jour de la Korité / Tabaski ?', 'options': ['Moi ✨', 'Mon Bae ✨', 'Couple le plus chic du Sénégal !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux dit « Dama la nob / Je t’aime » en premier après une petite dispute ?', 'options': ['Moi ❤️', 'Mon Bae ❤️', 'On fait la paix vite']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux regarde le téléphone toutes les 2 minutes en attendant un message de l’autre ?', 'options': ['Moi 👀', 'Mon Bae 👀', 'Nous deux !']},

    # =========================================================================
    # 4. JE N'AI JAMAIS (Sénégal + Distance)
    # =========================================================================
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais laissé l’appel tourner toute la nuit juste pour t’entendre respirer malgré la distance.', 'options': ['Déjà fait ❤️', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais imaginé notre grand mariage traditionnel sénégalais (Takk) ensemble.', 'options': ['Déjà fait 💍', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais vérifié si tu étais en ligne sans oser envoyer le premier message.', 'options': ['Déjà fait 🙈', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais compté les jours sur le calendrier avant qu’on se revoie enfin.', 'options': ['Déjà fait ⏳', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais écouté du mbalax ou de l’afrobeat en pensant à nous deux en train de danser.', 'options': ['Déjà fait 💃', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais regardé nos photos ou relu nos anciens messages quand la distance devenait dure.', 'options': ['Déjà fait 📸', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais fait exprès de bouder en appel pour voir comment tu allais me calmer.', 'options': ['Déjà fait 😅', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais parlé de toi avec fierté à ma famille ou mes amis proches.', 'options': ['Déjà fait ✨', 'Jamais !']},

    # =========================================================================
    # 5. TU PRÉFÈRES QUOI ? (Sénégal + Distance)
    # =========================================================================
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour nos retrouvailles au Sénégal, tu préfères...', 'options': ['Un week-end détente à Saly / Somone au bord de la mer', 'Une escapade romantique à Saint-Louis ou l’Île de Gorée']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour notre premier repas ensemble après la distance, tu préfères...', 'options': ['Un bon Thiéboudienne bou khonk fait maison', 'Un Yassa poulet + Bissap bien glacé']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'À distance, tu préfères qu’on...', 'options': ['S’appelle 2 heures chaque soir avant de dormir', 'S’envoie plein de petits vocaux et photos toute la journée']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour une balade en amoureux à Dakar, tu préfères...', 'options': ['Coucher de soleil sur la Corniche / Almadies', 'Soirée tranquille autour d’un bon Ataya à la maison']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour la fête de la Korité ou Tabaski, tu préfères...', 'options': ['Qu’on porte des tenues assorties (bazin/boubou)', 'Qu’on fasse une grande séance photo de couple']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères que je te fasse la surprise...', 'options': ['D’arriver sans prévenir pour te voir', 'Qu’on prépare le compte à rebours ensemble pendant des semaines']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour briser la routine à distance ce week-end, tu préfères...', 'options': ['Regarder un film ou une série sénégalaise en même temps en appel', 'Faire une soirée jeux + confidences sur Man Ak Bae']},

    # =========================================================================
    # 6. CECI OU CELA (RAPIDE — Sénégal & Distance)
    # =========================================================================
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Plat sénégalais du dimanche ?', 'options': ['Thiéboudienne 🐟', 'Yassa / Mafé 🍗']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Boisson locale bien fraîche ?', 'options': ['Bissap rouge 🌺', 'Bouye ou Gingembre 🥤']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Pour se sentir proche à distance ?', 'options': ['Long appel vocal 📞', 'Pluie de vocaux 🎙️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Sortie à Dakar ?', 'options': ['Plage des Almadies / Ngor 🏖️', 'Resto chic sur la Corniche 🍽️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Ambiance musicale ?', 'options': ['Mbalax pour danser 🥁', 'Afrobeat / R&B doux 🎶']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Goûter ensemble ?', 'options': ['Ataya + cacahuètes 🍵', 'Thiakry / Lakh bien frais 🥣']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Retrouvailles ?', 'options': ['Course et câlin à l’aéroport AIBD ✈️', 'Retrouvailles calmes rien qu’à deux 🏡']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Style de tenue ?', 'options': ['Grand boubou / Bazin traditionnel ✨', 'Tenue moderne chic 👗']},

    # =========================================================================
    # 7. QUIZ DE COUPLE (Sénégal + Distance)
    # =========================================================================
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quel est mon plat sénégalais préféré au monde ?', 'options': ['Thiéboudienne (riz au poisson)', 'Yassa poulet / poisson', 'Mafé / Domoda', 'Dibi / Grillades']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle est ma boisson sénégalaise préférée ?', 'options': ['Bissap bien glacé', 'Jus de Bouye (baobab)', 'Gingembre (Gnamakoudji)', 'Ataya bien sucré']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'distance', 'question_text': 'Qu’est-ce qui me manque le plus chez toi avec la distance ?', 'options': ['Ta présence et tes câlins 🤗', 'Entendre ta voix en vrai 🎙️', 'Nos sorties et fous rires 😂', 'Tout chez toi ❤️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Où est-ce que je rêve qu’on parte en voyage ensemble au Sénégal ?', 'options': ['Saly / Somone 🏖️', 'Casamance / Cap Skirring 🌴', 'Saint-Louis / Langue de Barbarie ⛵', 'Sine-Saloum / Lac Rose 🌅']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'love_language', 'question_text': 'Qu’est-ce qui me rassure le plus quand la distance me pèse ?', 'options': ['Un appel vocal surprise 📞', 'Un long message sincère 💌', 'Des projets concrets pour notre avenir 💍', 'Tes vocaux doux au réveil ☀️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'À quel moment j’aime le plus qu’on se parle ?', 'options': ['Tôt le matin (Salam / Bonjour)', 'Pendant la pause de midi', 'Tard le soir au calme 🌙', 'Toute la journée dès qu’on peut ❤️']},

    # =========================================================================
    # 8. QUI CONNAÎT MIEUX L'AUTRE ? (Sénégal + Distance)
    # =========================================================================
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle expression en wolof ou en français je répète tout le temps au téléphone ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel plat sénégalais je pourrais manger tous les jours sans jamais me lasser ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est la première chose que je fais le matin quand je prends mon téléphone ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel artiste sénégalais ou africain j’écoute le plus en ce moment ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Comment tu sais immédiatement à ma voix au téléphone que quelque chose ne va pas ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel surnom affectueux je préfère que tu utilises pour moi ?', 'options': None},

    # =========================================================================
    # 9. QUESTIONS PROFONDES (Teranga, Valeurs & Distance)
    # =========================================================================
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Comment imagines-tu notre vie une fois que la distance sera enfin derrière nous ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Qu’est-ce que la distance nous a appris de plus fort sur notre amour ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quelles valeurs de la Teranga et de la famille sénégalaise veux-tu transmettre dans notre foyer ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Comment puis-je mieux te soutenir à distance quand tu traverses une journée difficile ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Dans 5 ans, où nous vois-tu vivre et quels projets aurons-nous construits ensemble ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quelle est la plus grande preuve d’amour ou de loyauté que tu as ressentie de ma part malgré les kilomètres ?', 'options': None},

    # =========================================================================
    # 10. DÉFIS ROMANTIQUES (100 % réalisables à distance !)
    # =========================================================================
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Envoie-moi un vocal doux de bonne nuit ou de bonjour en wolof et français aujourd’hui.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Planifions un « date à distance » dans notre Agenda cette semaine (film ou repas en appel ensemble).', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Écris-moi une Lettre d’Amour dans l’app sur ce que tu ressens pour moi malgré la distance.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Ajoute dans l’onglet Souvenirs une photo qui te rappelle moi ou un moment qu’on a partagé.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Fais-moi un appel vocal de 5 minutes aujourd’hui juste pour me dire 3 choses que tu admires chez moi.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Partage-moi une chanson sénégalaise ou afrobeat qui te fait penser à notre histoire.', 'options': None},

    # =========================================================================
    # 11. COMPLÈTE MA PHRASE (Sénégal + Distance)
    # =========================================================================
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Malgré les kilomètres entre nous, ce qui me donne le sourire chaque matin c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Le jour où je te serrerai enfin dans mes bras à notre retour, je ne lâcherai pas avant...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Si on préparait un Thiéboudienne ensemble, toi tu t’occuperais de... et moi de...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'En wolof, le mot qui décrit le mieux ce que je ressens pour toi c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'La promesse que je te fais tant qu’on est à distance, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Dans 20 ans, autour d’un bon Ataya, on rira encore de...', 'options': None},

    # =========================================================================
    # 12. DEVINE MA RÉPONSE (Secret jusqu'à ce que les 2 répondent !)
    # =========================================================================
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est le tout premier endroit au Sénégal où j’ai envie qu’on aille ensemble dès qu’on se retrouve ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel plat sénégalais j’aimerais que tu me prépares (ou qu’on mange) le soir de nos retrouvailles ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est la chose que j’adore le plus faire avec toi en appel à distance ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel cadeau symbolique venant du Sénégal ou de là où tu es me ferait le plus plaisir ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle qualité chez toi me fait rester fidèle et amoureux(se) malgré la distance ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'À quelle heure de la journée je pense le plus fort à toi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle chanson je choisirais pour notre danse de mariage ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est ma plus grande envie pour notre couple cette année ?', 'options': None},
]


class Command(BaseCommand):
    help = 'Peuple la base de données avec les questions Man Ak Bae orientées culture sénégalaise et couple à distance'

    def handle(self, *args, **options):
        new_keys = {(item['game_type'], item['question_text']) for item in QUESTIONS_DATA}

        # Désactiver les anciennes questions génériques sans casser l'historique des réponses
        deactivated = 0
        for q in GameQuestion.objects.filter(is_active=True):
            if (q.game_type, q.question_text) not in new_keys:
                q.is_active = False
                q.save(update_fields=['is_active'])
                deactivated += 1

        # Créer ou réactiver toutes les questions sénégalaises & couple à distance
        created = 0
        for item in QUESTIONS_DATA:
            obj, was_created = GameQuestion.objects.update_or_create(
                game_type=item['game_type'],
                question_text=item['question_text'],
                defaults={
                    'category': item['category'],
                    'options': item['options'],
                    'is_active': True,
                },
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Catalogue Sénégal & Distance prêt : {created} créées, {deactivated} anciennes désactivées (total actif : {len(QUESTIONS_DATA)}).'
            )
        )
