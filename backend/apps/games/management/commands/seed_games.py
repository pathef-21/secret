from django.core.management.base import BaseCommand
from apps.games.models import GameQuestion, GameType

QUESTIONS_DATA = [
    # =========================================================================
    # 1. ACTION OU VÉRITÉ (30 questions : 15 Vérités + 15 Actions)
    # =========================================================================
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel a été ton premier sentiment exact quand tu m’as vu(e) pour la première fois ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle est la chose la plus folle que tu ferais pour moi sans hésiter ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle est la petite habitude chez moi que tu trouves secrètement irrésistible ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'As-tu déjà été jaloux/jalouse à cause de moi sans jamais me l’avouer ? Raconte !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel est ton souvenir préféré de nous deux jusqu’à aujourd’hui ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle est la première chose que tu remarques quand j’entre dans une pièce ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Si tu pouvais revivre une seule journée de notre relation, laquelle choisirais-tu ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel message de moi as-tu relu plusieurs fois avec le sourire ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle est la chose que tu as encore un peu peur de me demander ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'À quel moment t’es-tu dit : « C’est vraiment lui/elle que je veux dans ma vie » ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel est le compliment que tu adores le plus recevoir de ma part ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle tenue ou style vestimentaire me va le mieux selon toi ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Y a-t-il un petit défaut chez moi qui te fait finalement rire ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel rêve romantique aimerais-tu absolument réaliser avec moi cette année ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle est la chose la plus douce que j’aie jamais faite pour toi ?', 'options': None},

    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie-moi tout de suite un message vocal de 30 secondes en me disant pourquoi je suis exceptionnel(le).', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Prends un selfie tout de suite en faisant la grimace la plus mignonne possible.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Chuchote-moi (ou envoie en vocal) une déclaration d’amour comme dans un film romantique.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Écris un poème improvisé de 4 lignes sur nous deux dans le chat !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Donne-moi 5 qualités que tu aimes chez moi en moins de 15 secondes.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Fais-moi un massage des épaules ou des mains de 3 minutes dès qu’on se voit (promesse officielle !).', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Imite ma façon de parler ou de rire pendant 20 secondes.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Change mon surnom dans ton téléphone pour quelque chose d’ultra romantique pendant 24h.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Choisis une chanson qui représente notre couple et envoie-la-moi maintenant.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie-moi 3 emojis qui décrivent ce que tu aimerais faire avec moi ce soir.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Regarde-moi dans les yeux pendant 30 secondes sans rire (ou en appel vidéo) !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Décris notre prochain rendez-vous idéal en 3 phrases ultra détaillées.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Avoue-moi un petit gage que tu me dois cette semaine et note-le dans notre Agenda.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Fais un câlin de 20 secondes minimum la prochaine fois qu’on se croise sans lâcher.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie une photo de l’endroit où tu es maintenant avec un petit cœur dessiné dessus.', 'options': None},

    # =========================================================================
    # 2. MODE PIMENTÉ 🔥 (14 questions & défis complices)
    # =========================================================================
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel est le geste ou le regard de moi qui te fait instantanément fondre ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Où préfères-tu que je t’embrasse quand nous sommes seuls tous les deux ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Décris la soirée parfaite à deux, lumières tamisées, juste toi et moi.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel est ton fantasme romantique le plus doux que tu aimerais vivre avec moi ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel moment de tension ou de séduction entre nous t’a le plus marqué(e) ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Si j’étais juste à côté de toi en ce moment précis, que ferais-tu en premier ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle partie de mon physique ou de ma voix te fait le plus d’effet ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Envoie-moi dans le chat un message mystérieux qui me donne hâte de te retrouver.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Tu préfères les baisers lents et passionnés ou les petits baisers volés par surprise ?', 'options': ['Lents et passionnés 🔥', 'Volés par surprise 💋']},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle musique mettrait l’ambiance parfaite pour une soirée romantique à deux ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Donne une note sur 10 à mon dernier baiser et dis-moi comment avoir 11/10 !', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle surprise coquine ou romantique aimerais-tu que je te prépare un week-end ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Est-ce que tu aimes quand je prends les initiatives ou quand c’est toi qui mènes la danse ?', 'options': ['Quand tu prends les initiatives', 'Quand c’est moi qui mène', 'Un peu des deux 😉']},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Dis-moi un mot ou une phrase que tu adores m’entendre chuchoter à l’oreille.', 'options': None},

    # =========================================================================
    # 3. QUI DE NOUS DEUX ? (15 questions)
    # =========================================================================
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est le plus jaloux / la plus jalouse ?', 'options': ['Moi 😅', 'Mon Bae ❤️', 'À égalité !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux met le plus de temps à se préparer avant un rendez-vous ?', 'options': ['Moi 😅', 'Mon Bae ❤️', 'À égalité !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux dit « Je t’aime » le plus souvent dans la journée ?', 'options': ['Moi ❤️', 'Mon Bae ❤️', 'Autant l’un que l’autre']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux s’endort en premier devant un film ?', 'options': ['Moi 😴', 'Mon Bae 😴', 'On tient jusqu’au bout !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est le plus gourmand / commande toujours les desserts ?', 'options': ['Moi 🍰', 'Mon Bae 🍰', 'Nous deux !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux fait les meilleures surprises ?', 'options': ['Moi ✨', 'Mon Bae ✨', 'Tous les deux !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux boude en premier mais craque aussi en premier ?', 'options': ['Moi 🙈', 'Mon Bae 🙈', 'Personne ne boude !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux prend le plus de photos de couple ?', 'options': ['Moi 📸', 'Mon Bae 📸', 'À égalité']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est le plus drôle / fait le plus rire l’autre ?', 'options': ['Moi 😂', 'Mon Bae 😂', 'Duo comique !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux est tombé amoureux en premier ?', 'options': ['Moi 💘', 'Mon Bae 💘', 'Coup de foudre simultané !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux a toujours raison lors d’un petit débat ?', 'options': ['Moi 👑', 'Mon Bae 👑', 'On trouve toujours un compromis']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux perd le plus souvent son téléphone ou ses clés ?', 'options': ['Moi 🔍', 'Mon Bae 🔍', 'Aucun des deux']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux est le plus câlin le matin ?', 'options': ['Moi 🤗', 'Mon Bae 🤗', 'Nous deux !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux choisit toujours le restaurant ou le film ?', 'options': ['Moi 🎬', 'Mon Bae 🎬', 'On décide ensemble']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux pleurerait en premier devant un film très émouvant ?', 'options': ['Moi 🥺', 'Mon Bae 🥺', 'Nous deux ensemble']},

    # =========================================================================
    # 4. JE N'AI JAMAIS (15 questions)
    # =========================================================================
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais souri tout(e) seul(e) devant mon téléphone en pensant à toi.', 'options': ['Déjà fait ❤️', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais stalké tes anciennes photos avant qu’on soit ensemble.', 'options': ['Déjà fait 🙈', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais imaginé notre futur mariage ou notre future maison ensemble.', 'options': ['Déjà fait 💍', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais fait semblant d’être fâché(e) juste pour avoir un câlin ou de l’attention.', 'options': ['Déjà fait 😅', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais gardé un petit objet (ticket, photo, mot) en souvenir d’une sortie avec toi.', 'options': ['Déjà fait 💌', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais volé un vêtement (pull, t-shirt, parfum) de mon partenaire.', 'options': ['Déjà fait 👕', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais rêvé de toi la nuit et voulu te le raconter dès le réveil.', 'options': ['Déjà fait 🌙', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais tapé un long message puis tout effacé par timidité.', 'options': ['Déjà fait 😳', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais dit à mes amis à quel point j’ai de la chance de t’avoir.', 'options': ['Déjà fait ✨', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais regardé ton écran discrètement pour voir qui t’envoyait un message.', 'options': ['Déjà fait 👀', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais voulu que le temps s’arrête quand j’étais dans tes bras.', 'options': ['Déjà fait ❤️', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais mangé quelque chose qui t’était destiné en secret.', 'options': ['Déjà fait 🍫', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais écouté une chanson en boucle parce qu’elle me rappelait toi.', 'options': ['Déjà fait 🎵', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais vérifié si tu étais en ligne sans t’envoyer de message.', 'options': ['Déjà fait 📱', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais compté les heures avant notre prochaine rencontre.', 'options': ['Déjà fait ⏳', 'Jamais !']},

    # =========================================================================
    # 5. TU PRÉFÈRES QUOI ? (14 questions)
    # =========================================================================
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères quoi pour notre prochain week-end ?', 'options': ['Une cabane isolée en pleine nature avec feu de bois', 'Un hôtel de luxe avec spa et vue sur l’océan']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères quoi au quotidien ?', 'options': ['Que je te cuisine un bon dîner aux chandelles', 'Qu’on commande et qu’on passe la soirée en câlins devant un film']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Tu préfères quoi ?', 'options': ['Ne pouvoir m’embrasser que sur le front pendant 1 mois', 'Ne pas pouvoir me tenir la main en public pendant 1 mois']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères recevoir...', 'options': ['Une longue lettre d’amour manuscrite', 'Un voyage surprise organisé en secret']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour une soirée parfaite à deux, tu préfères...', 'options': ['Une balade nocturne au bord de la mer', 'Une soirée jeux, musique et rires à la maison']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères qu’on...', 'options': ['Fasse le tour du monde pendant 1 an ensemble', 'Construise la maison de nos rêves tout de suite']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Tu préfères...', 'options': ['Pouvoir lire dans mes pensées pendant 1 heure', 'Revivre notre tout premier rendez-vous']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Le matin, tu préfères...', 'options': ['Un petit-déjeuner au lit préparé par moi', 'Faire la grasse matinée dans mes bras jusqu’à midi']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour fêter notre anniversaire de couple, tu préfères...', 'options': ['Un dîner gastronomique ultra chic', 'Un pique-nique romantique au coucher du soleil']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères qu’on se parle...', 'options': ['Par longs appels tard le soir', 'Par petits messages et vocaux tout au long de la journée']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Tu préfères...', 'options': ['Qu’on adopte un chiot adorable ensemble', 'Qu’on adopte un petit chat câlin ensemble']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères un partenaire...', 'options': ['Qui t’écrit des poèmes chaque semaine', 'Qui te fait des massages chaque soir']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Tu préfères...', 'options': ['Partir en vacances à la plage sous les cocotiers', 'Partir à la montagne sous la neige devant la cheminée']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères...', 'options': ['Des grandes déclarations en public', 'Des mots doux chuchotés rien qu’entre nous']},

    # =========================================================================
    # 6. CECI OU CELA (RAPIDE) (12 questions)
    # =========================================================================
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Ambiance du soir ?', 'options': ['Netflix & Câlins 🎬', 'Sortie Restaurant 🍽️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Pour se parler à distance ?', 'options': ['Messages vocaux 🎙️', 'Appel vidéo 📹']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Cadeau romantique ?', 'options': ['Fleurs & Chocolats 🌹', 'Parfum ou Bijou 💎']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Moment préféré de la journée ?', 'options': ['Lever du soleil ensemble 🌅', 'Minuit sous les étoiles 🌌']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Style de vacances ?', 'options': ['Détente & Plage 🏖️', 'Aventure & Découverte 🗺️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Affection ?', 'options': ['Longs câlins 🤗', 'Baisers passionnés 💋']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Repas à deux ?', 'options': ['Cuisiner ensemble 👩‍🍳', 'Commander un festin 🍕']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Week-end ?', 'options': ['Improvisation totale 🎲', 'Programme planifié 📅']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Musique à deux ?', 'options': ['Afrobeat / R&B doux 🎶', 'Slow romantique 🎻']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Souvenirs ?', 'options': ['Photos spontanées 📸', 'Vidéos souvenirs 🎥']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Petit-déjeuner ?', 'options': ['Sucré (crêpes, chocolat) 🥞', 'Salé (omelette, café) ☕']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Soirée idéale ?', 'options': ['Danser ensemble 💃', 'Discuter jusqu’à l’aube 💬']},

    # =========================================================================
    # 7. QUIZ DE COUPLE (12 questions)
    # =========================================================================
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quel est mon plat préféré au monde ?', 'options': ['Thiéboudienne / Riz au poisson', 'Yassa / Mafé', 'Pizza / Burger gourmet', 'Pâtes / Grillades']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Quelle est ma destination de voyage de rêve ultime ?', 'options': ['Zanzibar / Îles Maldives', 'Dubaï / Maroc', 'Paris / Italie', 'Japon / Bali']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Comment est-ce que je réagis le plus souvent quand je suis fatigué(e) ?', 'options': ['Je deviens silencieux/se', 'J’ai besoin d’un gros câlin', 'Je dors immédiatement', 'Je deviens un peu râleur/se 😅']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'love_language', 'question_text': 'Quel est mon langage d’amour principal ?', 'options': ['Les paroles valorisantes 💬', 'Les moments de qualité ⏳', 'Le toucher physique 🤗', 'Les petites attentions & cadeaux 🎁']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle est ma boisson préférée ?', 'options': ['Jus local (Bissap / Bouye / Gingembre)', 'Café / Thé', 'Smoothie / Milkshake', 'Eau fraîche / Soda']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'fun', 'question_text': 'Quel genre de film ou série je préfère regarder avec toi ?', 'options': ['Romance / Comédie romantique', 'Action / Thriller', 'Comédie pour rire', 'Séries à suspense']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'À quel moment de la journée suis-je de la meilleure humeur ?', 'options': ['Tôt le matin ☀️', 'L’après-midi 🌤️', 'Le soir / La nuit 🌙', 'Dès que je te vois ❤️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Qu’est-ce qui me rend le plus fier/fière dans la vie ?', 'options': ['Réussir mes projets professionnels', 'Rendre ma famille et toi heureux', 'Voyager et découvrir le monde', 'Me dépasser chaque jour']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle couleur me correspond le mieux selon toi ?', 'options': ['Noir élégant', 'Rose / Rouge passion', 'Blanc pur', 'Bleu / Violet']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'fun', 'question_text': 'Si je gagne à la loterie demain, quelle est ma première dépense ?', 'options': ['Un voyage de rêve pour nous deux ✈️', 'Une grande maison 🏡', 'Un cadeau fou pour toi 🎁', 'Investir pour notre avenir 💼']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle est ma pire manie le matin ?', 'options': ['Repousser le réveil 5 fois ⏰', 'Regarder mon téléphone au lit 📱', 'Mettre du temps à parler 😴', 'Être déjà hyper actif/ve !']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'love_language', 'question_text': 'Qu’est-ce qui me console le plus vite quand j’ai passé une mauvaise journée ?', 'options': ['T’entendre me rassurer', 'Un long câlin silencieux', 'Manger mon plat préféré', 'Rire avec toi']},

    # =========================================================================
    # 8. QUI CONNAÎT MIEUX L'AUTRE ? (12 questions)
    # =========================================================================
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est ma plus grande phobie ou peur secrète ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle chanson me fait immédiatement penser à toi ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est ma date d’anniversaire exacte et mon signe astrologique ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est le tout premier cadeau ou geste que je t’aie offert ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est mon parfum ou odeur préférée ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel plat je déteste absolument manger ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel était mon rêve d’enfant (métier ou projet) ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est mon expression ou phrase que je répète tout le temps ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Comment j’aime qu’on m’appelle quand on est rien que tous les deux ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est la chose qui m’énerve le plus vite au quotidien ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est mon endroit préféré pour me détendre ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est ma plus grande qualité selon mes proches ?', 'options': None},

    # =========================================================================
    # 9. QUESTIONS PROFONDES (12 questions)
    # =========================================================================
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Où imagines-tu notre couple dans exactement 5 ans ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'À quel moment précis as-tu su que j’étais devenu(e) indispensable à ton bonheur ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Qu’est-ce que notre relation a changé de plus beau en toi ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quelle tradition aimerais-tu qu’on garde toute notre vie ensemble ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quand te sens-tu le plus aimé(e) et en sécurité à mes côtés ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Comment puis-je être un(e) partenaire encore meilleur(e) pour toi cette année ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quelles sont les 3 valeurs les plus importantes pour notre couple selon toi ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'De quoi es-tu le plus reconnaissant(e) concernant notre histoire ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quelle épreuve nous a le plus rapprochés et rendus plus forts ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quel grand projet de vie rêves-tu qu’on réalise main dans la main ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Qu’est-ce que tu admires le plus dans ma personnalité ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Si tu devais résumer notre amour en une seule phrase pour un livre, laquelle écrirais-tu ?', 'options': None},

    # =========================================================================
    # 10. DÉFIS ROMANTIQUES (12 missions)
    # =========================================================================
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Écris-moi une lettre d’amour dans l’application avant minuit.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Organise notre prochain date surprise sans me dire où on va !', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Ajoute une de nos plus belles photos dans l’onglet Souvenirs avec une belle légende.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Planifie un rendez-vous surprise dans notre Agenda pour cette semaine.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Envoie-moi aujourd’hui 3 raisons précises pour lesquelles tu m’aimes.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Prépare une mini-playlist de 5 chansons qui nous représentent et partage les titres dans le chat.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Écris un message du matin ultra doux pour que je le lise dès mon réveil demain.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Offre-moi une soirée « sans téléphones » (1h minimum) dédiée uniquement à nous deux.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Cuisine ou commande mon plat/snack préféré lors de notre prochaine rencontre.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Raconte-moi en détail le moment où tu m’as trouvé(e) le/la plus irrésistible cette semaine.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Cache un petit mot doux (ou envoie une lettre scellée pour la semaine prochaine).', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Prends une nouvelle photo de nous deux lors de notre prochaine sortie pour agrandir notre album.', 'options': None},

    # =========================================================================
    # 11. COMPLÈTE MA PHRASE (12 questions)
    # =========================================================================
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Ce que j’aime par-dessus tout quand tu me regardes, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Avec toi, même une journée ordinaire devient...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Notre couple ressemble à un film de genre...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'La promesse que je veux toujours tenir envers toi, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Si on était bloqués sur une île déserte, tu serais le/la premier(ère) à...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Le moment où tu me manques le plus, c’est quand...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Mon plus beau souhait pour nous deux cette année, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Ce qui me fait toujours craquer même quand j’essaie de rester sérieux(se), c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Quand je suis dans tes bras, j’oublie complètement...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Si je devais te remercier pour une seule chose aujourd’hui, ce serait...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Dans 30 ans, on sera encore en train de rire de...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Pour moi, le vrai bonheur à deux c’est...', 'options': None},

    # =========================================================================
    # 12. DEVINE MA RÉPONSE (12 questions)
    # =========================================================================
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Si nous devions adopter un animal de compagnie ensemble aujourd’hui, ce serait quoi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est mon rituel du matin préféré quand nous sommes ensemble ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Si je pouvais me téléporter n’importe où avec toi ce soir, où irions-nous ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel super-pouvoir j’aimerais avoir pendant une journée ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est la première chose que je ferais si on avait une journée entière sans aucune obligation ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel dessert me ferait craquer à coup sûr ce soir ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel surnom secret je préfère quand tu m’appelles ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle saison de l’année je préfère le plus ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Si je devais choisir une chanson pour notre première danse, laquelle choisirais-je ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle activité folle aimerais-je tester au moins une fois avec toi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est le meilleur moment de la semaine pour moi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle qualité chez toi m’a fait tomber sous ton charme dès le début ?', 'options': None},
]


class Command(BaseCommand):
    help = 'Peuple rapidement la base de données avec plus de 170 questions variées pour les 12 jeux de couple'

    def handle(self, *args, **options):
        existing = set(
            GameQuestion.objects.values_list('game_type', 'question_text')
        )
        to_create = [
            GameQuestion(
                game_type=item['game_type'],
                question_text=item['question_text'],
                category=item['category'],
                options=item['options'],
            )
            for item in QUESTIONS_DATA
            if (item['game_type'], item['question_text']) not in existing
        ]
        if to_create:
            GameQuestion.objects.bulk_create(to_create)
        self.stdout.write(
            self.style.SUCCESS(
                f'{len(to_create)} nouvelles questions créées (total catalogue : {len(existing) + len(to_create)}) !'
            )
        )
