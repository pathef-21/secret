from django.core.management.base import BaseCommand
from apps.games.models import GameQuestion, GameType

# Catalogue enrichi (250+ questions) — Culture Sénégalaise, Amour & Couple à Distance (Man Ak Bae ❤️)
QUESTIONS_DATA = [
    # =========================================================================
    # 1. ACTION OU VÉRITÉ (30 questions : 16 Vérités + 14 Actions)
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
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle est la toute première chose que tu as remarquée chez moi la première fois qu’on s’est vus ou parlé ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'As-tu déjà souri tout(e) seul(e) devant ton téléphone en public à cause d’un de mes messages ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quelle petite manie chez moi t’agace un tout petit peu… mais que tu trouves mignonne quand même ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Y a-t-il un secret ou un rêve que tu n’as encore jamais osé me raconter ?', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'As-tu déjà fait un rêve (en dormant) sur nous deux ? Raconte-le moi en détail !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'truth', 'question_text': 'Quel est le plus beau compliment que je t’aie jamais fait et que tu n’oublieras jamais ?', 'options': None},

    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie-moi tout de suite un message vocal de 30 secondes en wolof pour me dire « Dama la nob » et pourquoi je suis unique.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Lance un appel vocal maintenant et chante-moi 10 secondes d’une chanson sénégalaise (Wally Seck, Viviane, Youssou Ndour ou Pape Diouf) !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie un selfie tout de suite là où tu es avec ton plus beau sourire pour me rapprocher de toi.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Écris-moi une petite déclaration d’amour mélangée français + wolof dans le chat !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Décris en détail le premier plat sénégalais qu’on va partager ensemble le jour de nos retrouvailles.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie un vocal où tu me fais une promesse officielle pour le jour où la distance sera terminée.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Change mon surnom sur ton téléphone en un surnom doux en wolof (ex: Sama Xol, Sama Yaakaar) pendant 24h.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie une photo de ce que tu vois autour de toi maintenant pour que je voyage un peu avec toi.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie-moi un vocal en chuchotant 3 choses que tu aimes le plus chez moi.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Imite ma façon de parler ou mon expression préférée dans un vocal de 15 secondes !', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Écris un mini poème de 4 lignes avec mon prénom et envoie-le dans le chat.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Envoie-moi dans le chat le tout dernier emoji que tu utilises le plus quand tu penses à moi et explique pourquoi.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Ajoute un souvenir ou une photo de toi dans Notre Galerie aujourd’hui avec un petit mot doux.', 'options': None},
    {'game_type': GameType.TRUTH_OR_DARE, 'category': 'dare', 'question_text': 'Fais-moi un vocal de 20 secondes où tu me racontes comment tu imagines notre premier matin sous le même toit.', 'options': None},

    # =========================================================================
    # 2. MODE PIMENTÉ 🔥 (20 questions)
    # =========================================================================
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Le jour de nos retrouvailles, quelle est la toute première chose que tu veux qu’on fasse une fois seuls ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Qu’est-ce qui te fait le plus craquer dans ma voix quand on s’appelle tard la nuit ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Décris notre week-end romantique idéal à Saly ou sur la Petite Côte, loin de tout le monde.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel parfum ou thiouraye te rappelle immédiatement moi ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Si je pouvais apparaître dans ta chambre pendant 10 minutes maintenant, tu ferais quoi ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel mot doux en wolof ou en français tu adores m’entendre chuchoter en vocal ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Envoie-moi dans le chat un message mystérieux qui va me faire compter les secondes jusqu’à nos retrouvailles.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Tu préfères les longs câlins silencieux à l’aéroport ou les baisers volés dès qu’on est seuls ?', 'options': ['Longs câlins à l’aéroport 🤗', 'Baisers volés dès qu’on est seuls 💋']},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle partie de mon visage ou de mon corps te manque le plus quand on est loin ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle tenue chez moi te fait instantanément perdre tes moyens ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle est la chose la plus romantique ou audacieuse que tu rêves qu’on fasse lors de notre prochaine soirée ensemble ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Tu préfères les baisers lents et tendres ou passionnés et intenses ?', 'options': ['Lents et tendres 🌹', 'Passionnés et intenses 🔥', 'Un mélange des deux 💋']},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Décris en 3 mots l’effet que je te fais quand je te regarde droit dans les yeux.', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quel est ton endroit préféré où tu adores que je t’embrasse ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Si on avait une villa privée face à l’océan pour 48h sans téléphone, quel serait ton programme ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle musique mettrais-tu en fond pour une soirée ultra romantique rien que nous deux ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'As-tu déjà pensé à moi en plein milieu d’une réunion ou d’un cours au point de perdre le fil ?', 'options': ['Oui, trop souvent 😅', 'Quelques fois 🙈', 'Jamais (menteur/se !)']},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Qu’est-ce que tu adores que je fasse quand je te prends dans mes bras ?', 'options': None},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Entre un massage relaxant à la bougie ou un dîner romantique suivi d’une danse collée-serrée, tu choisis quoi ?', 'options': ['Massage à la bougie 🕯️', 'Dîner + danse collée-serrée 💃']},
    {'game_type': GameType.SPICY_COUPLES, 'category': 'spicy', 'question_text': 'Quelle est ta pensée secrète sur moi qui te fait rougir dès que tu y repenses ?', 'options': None},

    # =========================================================================
    # 3. QUI DE NOUS DEUX ? (22 questions)
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
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est le plus têtu lors d’un débat ?', 'options': ['Moi 😤', 'Mon Bae 😤', 'On est impossibles tous les deux 😂']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux est le plus romantique et attentionné ?', 'options': ['Moi 🌹', 'Mon Bae 🌹', 'Égalité parfaite ❤️']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux dépense le plus vite son argent en shopping ou sorties ?', 'options': ['Moi 🛍️', 'Mon Bae 🛍️', 'On gère bien !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux met le plus de temps à se préparer avant de sortir ?', 'options': ['Moi 🪞', 'Mon Bae 🪞', 'Toujours prêts à l’heure !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux danse le mieux sur du mbalax ?', 'options': ['Moi 💃', 'Mon Bae 🕺', 'On met le feu tous les deux 🔥']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux garde le plus de captures d’écran de nos conversations ?', 'options': ['Moi 📸', 'Mon Bae 📸', 'On garde tout !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux est le plus gourmand devant un bon Dibi ou Fataya ?', 'options': ['Moi 😋', 'Mon Bae 😋', 'Deux vrais gourmands !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux oublie le plus souvent où il/elle a posé son téléphone ?', 'options': ['Moi 🤦', 'Mon Bae 🤦', 'Aucun des deux']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux veut le plus d’enfants plus tard ?', 'options': ['Moi 👶', 'Mon Bae 👶', 'On est d’accord sur le nombre !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux fait les meilleures blagues pour faire rire l’autre ?', 'options': ['Moi 😂', 'Mon Bae 😂', 'Duo de comiques !']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'romantic', 'question_text': 'Qui de nous deux ferait le plus de kilomètres par surprise juste pour voir l’autre 24h ?', 'options': ['Moi ✈️', 'Mon Bae ✈️', 'Nous deux sans hésiter ❤️']},
    {'game_type': GameType.MOST_LIKELY_TO, 'category': 'fun', 'question_text': 'Qui de nous deux pique toute la couverture la nuit ?', 'options': ['Moi 🛏️', 'Mon Bae 🛏️', 'Chacun sa couette !']},

    # =========================================================================
    # 4. JE N'AI JAMAIS (20 questions)
    # =========================================================================
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais laissé l’appel tourner toute la nuit juste pour t’entendre respirer malgré la distance.', 'options': ['Déjà fait ❤️', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais imaginé notre grand mariage traditionnel sénégalais (Takk) ensemble.', 'options': ['Déjà fait 💍', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais vérifié si tu étais en ligne sans oser envoyer le premier message.', 'options': ['Déjà fait 🙈', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais compté les jours sur le calendrier avant qu’on se revoie enfin.', 'options': ['Déjà fait ⏳', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais écouté du mbalax ou de l’afrobeat en pensant à nous deux en train de danser.', 'options': ['Déjà fait 💃', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais regardé nos photos ou relu nos anciens messages quand la distance devenait dure.', 'options': ['Déjà fait 📸', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais fait exprès de bouder en appel pour voir comment tu allais me calmer.', 'options': ['Déjà fait 😅', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais parlé de toi avec fierté à ma famille ou mes amis proches.', 'options': ['Déjà fait ✨', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais choisi les prénoms de nos futurs enfants dans ma tête.', 'options': ['Déjà fait 👶', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais fait semblant d’être occupé(e) alors que j’attendais juste ton message.', 'options': ['Déjà fait 🤭', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais réécouté un de tes vocaux en boucle juste pour entendre le son de ta voix.', 'options': ['Déjà fait 🎧', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais raté un rendez-vous ou été en retard parce que j’étais au téléphone avec toi.', 'options': ['Déjà fait ⏰', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais prié pour qu’Allah protège notre couple et nous réunisse vite.', 'options': ['Déjà fait 🤲', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais pris 10 selfies avant de t’en envoyer un seul pour être sûr(e) qu’il soit parfait.', 'options': ['Déjà fait 🤳', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais versé une petite larme parce que tu me manquais trop.', 'options': ['Déjà fait 🥺', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais stalké tes anciennes photos juste pour admirer ton sourire.', 'options': ['Déjà fait 😍', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais imaginé la décoration de notre future maison ensemble.', 'options': ['Déjà fait 🏡', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais dit « je vais dormir » puis continué à te parler pendant encore 2 heures.', 'options': ['Déjà fait 🌙', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'romantic', 'question_text': 'Je n’ai jamais eu le cœur qui bat à 100 à l’heure rien qu’en voyant ton nom s’afficher sur mon écran.', 'options': ['Déjà fait 💓', 'Jamais !']},
    {'game_type': GameType.NEVER_HAVE_I_EVER, 'category': 'fun', 'question_text': 'Je n’ai jamais voulu téléporter un bon plat de chez moi directement dans ton assiette.', 'options': ['Déjà fait 🍲', 'Jamais !']},

    # =========================================================================
    # 5. TU PRÉFÈRES QUOI ? (20 questions)
    # =========================================================================
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour nos retrouvailles au Sénégal, tu préfères...', 'options': ['Un week-end détente à Saly / Somone au bord de la mer', 'Une escapade romantique à Saint-Louis ou l’Île de Gorée']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour notre premier repas ensemble après la distance, tu préfères...', 'options': ['Un bon Thiéboudienne bou khonk fait maison', 'Un Yassa poulet + Bissap bien glacé']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'À distance, tu préfères qu’on...', 'options': ['S’appelle 2 heures chaque soir avant de dormir', 'S’envoie plein de petits vocaux et photos toute la journée']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour une balade en amoureux à Dakar, tu préfères...', 'options': ['Coucher de soleil sur la Corniche / Almadies', 'Soirée tranquille autour d’un bon Ataya à la maison']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour la fête de la Korité ou Tabaski, tu préfères...', 'options': ['Qu’on porte des tenues assorties (bazin/boubou)', 'Qu’on fasse une grande séance photo de couple']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères que je te fasse la surprise...', 'options': ['D’arriver sans prévenir pour te voir', 'Qu’on prépare le compte à rebours ensemble pendant des semaines']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour briser la routine à distance ce week-end, tu préfères...', 'options': ['Regarder un film ou une série sénégalaise en même temps en appel', 'Faire une soirée jeux + confidences sur Man Ak Bae']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour notre lune de miel, tu préfères...', 'options': ['Plage paradisiaque au Cap Skirring / Zanzibar 🌴', 'Voyage découverte dans une grande capitale européenne ou Dubaï ✈️']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour notre mariage, tu préfères...', 'options': ['Une cérémonie intime et chic avec les plus proches 💍', 'Une grande fête mémorable avec musique, bazin et toute la famille 🎉']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères recevoir de moi...', 'options': ['Une longue lettre d’amour manuscrite 💌', 'Un cadeau surprise livré chez toi 🎁']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Le dimanche matin ensemble, tu préfères...', 'options': ['Grasse matinée + petit-déjeuner au lit (café Touba & pain tapalapa)', 'Sortie tôt à la plage ou balade au calme']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Pour une soirée d’anniversaire de couple, tu préfères...', 'options': ['Un dîner chic aux chandelles au restaurant 🍽️', 'Un dîner préparé ensemble à la maison avec musique douce 🕯️']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Tu préfères qu’on vive plus tard...', 'options': ['Dans une belle villa calme proche de la mer 🌊', 'Dans un appartement moderne en plein centre-ville 🏙️']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Quand tu es stressé(e), tu préfères que je...', 'options': ['T’écoute en silence et te rassure tendrement', 'Te fasse rire et te change les idées tout de suite']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour un dîner rapide ensemble le soir, tu préfères...', 'options': ['Dibi + pain + oignons bien pimentés 🔥', 'Fataya / Chawarma + jus de gingembre 🌯']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères qu’on ait...', 'options': ['Un petit rituel sacré chaque matin au réveil ☀️', 'Un long debrief amoureux chaque soir avant de dormir 🌙']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'En voyage ensemble, tu préfères...', 'options': ['Tout planifier à l’avance pour ne rien rater 🗺️', 'Improviser selon nos envies du moment ✨']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Tu préfères revivre...', 'options': ['Notre tout premier rendez-vous comme au premier jour 💫', 'Avancer directement au jour où on vivra enfin ensemble 🏡']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'fun', 'question_text': 'Pour nos photos de couple, tu préfères...', 'options': ['Des photos naturelles prises sur le vif 📸', 'Un vrai shooting élégant en tenues coordonnées ✨']},
    {'game_type': GameType.WOULD_YOU_RATHER, 'category': 'romantic', 'question_text': 'Si on pouvait avoir un super-pouvoir pour notre couple, tu préfères...', 'options': ['Se téléporter près de l’autre 1h par jour ⚡', 'Lire les pensées d’amour de l’autre à tout moment 💭']},

    # =========================================================================
    # 6. CECI OU CELA (RAPIDE — 22 questions)
    # =========================================================================
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Plat sénégalais du dimanche ?', 'options': ['Thiéboudienne 🐟', 'Yassa / Mafé 🍗']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Boisson locale bien fraîche ?', 'options': ['Bissap rouge 🌺', 'Bouye ou Gingembre 🥤']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Pour se sentir proche à distance ?', 'options': ['Long appel vocal 📞', 'Pluie de vocaux 🎙️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Sortie à Dakar ?', 'options': ['Plage des Almadies / Ngor 🏖️', 'Resto chic sur la Corniche 🍽️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Ambiance musicale ?', 'options': ['Mbalax pour danser 🥁', 'Afrobeat / R&B doux 🎶']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Goûter ensemble ?', 'options': ['Ataya + cacahuètes 🍵', 'Thiakry / Lakh bien frais 🥣']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Retrouvailles ?', 'options': ['Course et câlin à l’aéroport AIBD ✈️', 'Retrouvailles calmes rien qu’à deux 🏡']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Style de tenue ?', 'options': ['Grand boubou / Bazin traditionnel ✨', 'Tenue moderne chic 👗']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Petit-déjeuner ?', 'options': ['Café Touba bien chaud ☕', 'Thé / Chocolat + croissants 🥐']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Moment préféré de la journée ?', 'options': ['Lever de soleil calme 🌅', 'Coucher de soleil romantique 🌇']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Soirée idéale ?', 'options': ['Netflix & câlins sous la couette 🎬', 'Sortie chic en ville ✨']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Preuve d’amour ?', 'options': ['Mots doux & déclarations 💌', 'Petites attentions & cadeaux 🎁']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Grillades du soir ?', 'options': ['Dibi mouton bien tendre 🍖', 'Poisson braisé au bord de la mer 🐟']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Vacances de rêve ?', 'options': ['Mer & plage paradisiaque 🏝️', 'Grande ville & shopping 🛍️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Langage de l’amour ?', 'options': ['Temps de qualité ensemble ⏳', 'Câlins & tendresse 🤗']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : À la maison ?', 'options': ['Cuisiner ensemble 👨‍🍳', 'Commander et se reposer 🛵']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Rythme de vie ?', 'options': ['Lève-tôt plein d’énergie ☀️', 'Oiseau de nuit jusqu’à 2h 🌙']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Saison préférée ?', 'options': ['Fraîcheur douce de décembre 🌬️', 'Chaleur d’été & plage ☀️']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Fête préférée ?', 'options': ['Korité ✨', 'Tabaski 🐑']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Surnom préféré ?', 'options': ['Sama Xol / Mon Cœur ❤️', 'Bae / Chéri(e) 💕']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Pour se réconcilier ?', 'options': ['Un gros câlin qui efface tout 🤗', 'Une vraie discussion calme 💬']},
    {'game_type': GameType.THIS_OR_THAT, 'category': 'fast', 'question_text': 'Ceci ou Cela : Dessert ?', 'options': ['Thiakry sucré bien frais 🥣', 'Gâteau au chocolat / glace 🍰']},

    # =========================================================================
    # 7. QUIZ DE COUPLE (20 questions)
    # =========================================================================
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quel est mon plat sénégalais préféré au monde ?', 'options': ['Thiéboudienne (riz au poisson)', 'Yassa poulet / poisson', 'Mafé / Domoda', 'Dibi / Grillades']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle est ma boisson sénégalaise préférée ?', 'options': ['Bissap bien glacé', 'Jus de Bouye (baobab)', 'Gingembre (Gnamakoudji)', 'Ataya bien sucré']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'distance', 'question_text': 'Qu’est-ce qui me manque le plus chez toi avec la distance ?', 'options': ['Ta présence et tes câlins 🤗', 'Entendre ta voix en vrai 🎙️', 'Nos sorties et fous rires 😂', 'Tout chez toi ❤️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Où est-ce que je rêve qu’on parte en voyage ensemble au Sénégal ?', 'options': ['Saly / Somone 🏖️', 'Casamance / Cap Skirring 🌴', 'Saint-Louis / Langue de Barbarie ⛵', 'Sine-Saloum / Lac Rose 🌅']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'love_language', 'question_text': 'Qu’est-ce qui me rassure le plus quand la distance me pèse ?', 'options': ['Un appel vocal surprise 📞', 'Un long message sincère 💌', 'Des projets concrets pour notre avenir 💍', 'Tes vocaux doux au réveil ☀️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'À quel moment j’aime le plus qu’on se parle ?', 'options': ['Tôt le matin (Salam / Bonjour)', 'Pendant la pause de midi', 'Tard le soir au calme 🌙', 'Toute la journée dès qu’on peut ❤️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle est ma réaction quand je suis vraiment fatigué(e) ?', 'options': ['Je deviens tout calme / silencieux(se)', 'Je m’endors en 2 minutes 😴', 'J’ai juste besoin de ta voix pour me détendre', 'Je deviens un peu irritable 😅']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'love_language', 'question_text': 'Quel est mon langage d’amour principal ?', 'options': ['Les paroles valorisantes & mots doux 💌', 'Les moments de qualité ensemble ⏳', 'Les câlins et gestes tendres 🤗', 'Les petites attentions & cadeaux 🎁']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quel genre de films ou séries je préfère regarder ?', 'options': ['Comédie & fous rires 😂', 'Romance & drame ❤️', 'Action & suspense 🔥', 'Séries sénégalaises / africaines 🎬']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Quel est mon plus grand objectif dans les 3 prochaines années ?', 'options': ['Réussir ma carrière / mon business 💼', 'Construire notre foyer ensemble 🏡', 'Voyager et découvrir le monde ✈️', 'Tout ça en même temps ✨']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Comment je réagis quand je reçois une belle surprise ?', 'options': ['Je saute de joie et je crie ! 🎉', 'Je souris avec les yeux qui brillent 🥺', 'Je fais semblant de rester calme mais je fonds 🙈', 'Je te serre dans mes bras pendant 10 minutes 🤗']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'distance', 'question_text': 'Qu’est-ce que je fais en premier quand j’ai un coup de mou ?', 'options': ['Je t’appelle ou je t’envoie un vocal', 'J’écoute de la musique au calme 🎧', 'Je prie et je prends du recul 🤲', 'Je regarde nos photos ensemble 📸']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle couleur me va le mieux selon moi ?', 'options': ['Noir chic 🖤', 'Blanc pur 🤍', 'Rose / Rouge / Bordeaux ❤️', 'Bleu / Vert / Couleurs vives 💙']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quel est mon plus gros défaut mignon ?', 'options': ['Un peu têtu(e) 😅', 'Un peu jaloux(se) 👀', 'Trop perfectionniste ✨', 'Toujours un peu en retard ⏰']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'love_language', 'question_text': 'Quelle petite attention me fait fondre à coup sûr ?', 'options': ['Un message « Bien arrivé(e) ? »', 'Un compliment inattendu 😍', 'Se souvenir d’un petit détail que j’ai dit', 'Un vocal doux sans raison 🎙️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Comment j’imagine notre dimanche parfait plus tard ?', 'options': ['Cuisine ensemble + film + sieste 🍲', 'Plage / sortie + glacier 🏖️', 'Visite à la famille + bon repas 🏡', 'Rien faire à deux au calme ❤️']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle est ma plus grande qualité en amour ?', 'options': ['Ma fidélité et ma loyauté 💍', 'Ma tendresse et mon écoute ❤️', 'Mon humour qui détend tout 😂', 'Mon soutien dans les moments durs 💪']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'distance', 'question_text': 'Combien de temps maximum je peux tenir sans de tes nouvelles ?', 'options': ['Moins de 2 heures 😅', 'Une demi-journée maximum', 'Une journée si tu es très occupé(e)', 'Impossible de dormir sans ton « bonne nuit » 🌙']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'habits', 'question_text': 'Quelle musique me met immédiatement de bonne humeur ?', 'options': ['Mbalax sénégalais 🥁', 'Afrobeat / Amapiano 🎶', 'R&B / Slow romantique 💕', 'Rap / Hip-Hop 🎤']},
    {'game_type': GameType.COUPLE_QUIZ, 'category': 'dreams', 'question_text': 'Qu’est-ce qui compte le plus pour moi dans notre couple ?', 'options': ['La confiance et l’honnêteté 💯', 'La communication au quotidien 💬', 'Le respect et la paix du cœur 🕊️', 'L’amour et la complicité ❤️']},

    # =========================================================================
    # 8. QUI CONNAÎT MIEUX L'AUTRE ? (20 questions)
    # =========================================================================
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle expression en wolof ou en français je répète tout le temps au téléphone ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel plat sénégalais je pourrais manger tous les jours sans jamais me lasser ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est la première chose que je fais le matin quand je prends mon téléphone ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel artiste sénégalais ou africain j’écoute le plus en ce moment ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Comment tu sais immédiatement à ma voix au téléphone que quelque chose ne va pas ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel surnom affectueux je préfère que tu utilises pour moi ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est ma date d’anniversaire exacte et ce que j’aimerais recevoir cette année ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est le plat ou l’aliment que je déteste absolument ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est ma plus grande peur ou phobie ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est ma série ou mon film préféré de tous les temps ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est mon parfum préféré ou le genre d’odeur que j’adore ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Qu’est-ce qui me met le plus rapidement en colère ou de mauvaise humeur ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle est la chose la plus simple qui me redonne le sourire en 10 secondes ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est mon plus grand rêve professionnel ou personnel ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel pays ou quelle ville je rêve de visiter absolument avec toi ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Qui est la personne de ma famille dont je suis le/la plus proche ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Qu’est-ce que je commande presque toujours quand on va au restaurant ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'À quelle heure j’ai l’habitude de m’endormir la semaine ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quel est mon souvenir d’enfance que j’adore raconter ?', 'options': None},
    {'game_type': GameType.WHO_KNOWS_BETTER, 'category': 'details', 'question_text': 'Quelle qualité chez moi les gens remarquent en premier ?', 'options': None},

    # =========================================================================
    # 9. QUESTIONS PROFONDES (20 questions)
    # =========================================================================
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Comment imagines-tu notre vie une fois que la distance sera enfin derrière nous ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Qu’est-ce que la distance nous a appris de plus fort sur notre amour ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quelles valeurs de la Teranga et de la famille sénégalaise veux-tu transmettre dans notre foyer ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Comment puis-je mieux te soutenir à distance quand tu traverses une journée difficile ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Dans 5 ans, où nous vois-tu vivre et quels projets aurons-nous construits ensemble ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quelle est la plus grande preuve d’amour ou de loyauté que tu as ressentie de ma part malgré les kilomètres ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Qu’est-ce qui a changé positivement en toi depuis que nous sommes ensemble ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quelle tradition de couple aimerais-tu qu’on garde toute notre vie, même à 70 ans ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Y a-t-il une chose que tu aimerais que je fasse plus souvent pour que tu te sentes encore plus aimé(e) ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quelle est ta plus grande fierté personnelle cette année ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Comment aimerais-tu qu’on gère nos désaccords quand on vivra sous le même toit ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quel moment de notre histoire t’a fait comprendre qu’on était vraiment faits l’un pour l’autre ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Qu’est-ce que signifie « aimer vraiment quelqu’un » pour toi aujourd’hui ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Si on pouvait réaliser un grand projet commun (maison, entreprise, association), ce serait lequel ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'De quoi as-tu le plus besoin dans ta vie en ce moment pour te sentir en paix ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quelle leçon de vie importante tes parents ou ta famille t’ont transmise ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Quelles qualités aimerais-tu que nos futurs enfants héritent de moi et de toi ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quand tu penses à nous deux, quel est le premier mot qui te vient au cœur ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'emotions', 'question_text': 'Quelle épreuve t’a rendu(e) plus fort(e) et comment puis-je en prendre soin avec toi ?', 'options': None},
    {'game_type': GameType.DEEP_QUESTIONS, 'category': 'future', 'question_text': 'Si tu pouvais écrire une lettre au couple que nous serons dans 10 ans, que nous dirais-tu ?', 'options': None},

    # =========================================================================
    # 10. DÉFIS ROMANTIQUES (20 défis 100 % réalisables à distance !)
    # =========================================================================
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Envoie-moi un vocal doux de bonne nuit ou de bonjour en wolof et français aujourd’hui.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Planifions un « date à distance » dans notre Agenda cette semaine (film ou repas en appel ensemble).', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Écris-moi une Lettre d’Amour dans l’app sur ce que tu ressens pour moi malgré la distance.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Ajoute dans l’onglet Souvenirs une photo qui te rappelle moi ou un moment qu’on a partagé.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Fais-moi un appel vocal de 5 minutes aujourd’hui juste pour me dire 3 choses que tu admires chez moi.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Partage-moi une chanson sénégalaise ou afrobeat qui te fait penser à notre histoire.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Écris-moi 5 raisons précises pour lesquelles tu es heureux(se) de m’avoir dans ta vie.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Prends un Instant du Jour original avec un petit cœur fait avec tes mains ❤️', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Prépare une mini playlist de 3 chansons qui résument notre amour et envoie-moi les titres.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Programme une Lettre Secrète dans l’app qui ne s’ouvrira que dans 1 mois !', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Envoie-moi un vocal où tu me racontes ta journée en 60 secondes comme si j’étais à côté de toi.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Invente un nouveau surnom romantique rien que pour nous deux et explique sa signification.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Décris notre prochain rendez-vous en vrai de A à Z : lieu, tenue, repas et musique.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Fais-moi une prière ou un vœu sincère pour notre couple dans un message vocal.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Envoie-moi une ancienne photo de toi enfant ou ado que je n’ai jamais vue !', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Défi sourire : envoie-moi un message tellement drôle ou mignon que je suis obligé(e) de sourire en le lisant.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Dis-moi 3 choses que tu veux absolument qu’on fasse ensemble avant la fin de l’année.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Choisissons ensemble une date dans notre Agenda pour notre prochaine soirée jeux & appels.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Fais-moi un compliment sur quelque chose que tu n’as jamais encore mentionné chez moi.', 'options': None},
    {'game_type': GameType.ROMANTIC_CHALLENGES, 'category': 'challenge', 'question_text': 'Enregistre un vocal de 15 secondes « spécial coup de mou » que je pourrai réécouter quand tu me manques.', 'options': None},

    # =========================================================================
    # 11. COMPLÈTE MA PHRASE (20 questions)
    # =========================================================================
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Malgré les kilomètres entre nous, ce qui me donne le sourire chaque matin c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Le jour où je te serrerai enfin dans mes bras à notre retour, je ne lâcherai pas avant...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Si on préparait un Thiéboudienne ensemble, toi tu t’occuperais de... et moi de...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'En wolof, le mot qui décrit le mieux ce que je ressens pour toi c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'La promesse que je te fais tant qu’on est à distance, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Dans 20 ans, autour d’un bon Ataya, on rira encore de...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Ce que j’aime le plus quand j’entends ta voix, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Si notre histoire d’amour était un film, son titre serait...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Si tu gagnais 50 millions de FCFA demain, la première chose qu’on ferait ensemble c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Mon endroit préféré dans le monde entier sera toujours...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Quand je pense à notre mariage, le moment que j’attends le plus c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'La chose la plus drôle que tu fais sans t’en rendre compte, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Ce qui rend notre couple différent de tous les autres, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Même si on se dispute un jour, je n’oublierai jamais que...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Si on partait vivre sur une île déserte, je prendrais toi, un téléphone et...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Le moment de ma vie où j’ai eu le plus besoin de toi, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Dans ma tête, notre futur chez-nous ressemble à...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'fun', 'question_text': 'Si tu devais me décrire en 3 emojis seulement, ce serait...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Le petit détail chez toi dont je ne me lasserai jamais, c’est...', 'options': None},
    {'game_type': GameType.COMPLETE_SENTENCE, 'category': 'romantic', 'question_text': 'Si je pouvais t’offrir un seul vœu réalisé aujourd’hui, je choisirais...', 'options': None},

    # =========================================================================
    # 12. DEVINE MA RÉPONSE (22 questions — Secret jusqu'à ce que les 2 répondent !)
    # =========================================================================
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est le tout premier endroit au Sénégal où j’ai envie qu’on aille ensemble dès qu’on se retrouve ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel plat sénégalais j’aimerais que tu me prépares (ou qu’on mange) le soir de nos retrouvailles ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est la chose que j’adore le plus faire avec toi en appel à distance ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel cadeau symbolique venant du Sénégal ou de là où tu es me ferait le plus plaisir ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle qualité chez toi me fait rester fidèle et amoureux(se) malgré la distance ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'À quelle heure de la journée je pense le plus fort à toi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle chanson je choisirais pour notre danse de mariage ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est ma plus grande envie pour notre couple cette année ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est mon moment préféré de la semaine avec toi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Si on devait adopter un animal ou choisir une plante pour notre maison, je choisirais quoi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Combien d’enfants j’aimerais qu’on ait idéalement ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle destination de voyage à l’étranger je mets en numéro 1 sur notre liste ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est le mot ou la phrase qui me calme instantanément quand je suis énervé(e) ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est la première chose que je vais te dire quand je te verrai en vrai la prochaine fois ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle tenue ou couleur j’aimerais te voir porter pour notre prochain grand rendez-vous ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est mon plus beau souvenir depuis qu’on est ensemble ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle est la chose dont je suis le/la plus fier(e) chez toi ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel petit geste du quotidien me prouve le plus ton amour ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Dans quelle ville du Sénégal (ou du monde) j’aimerais qu’on construise notre maison ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Si je pouvais revivre une journée de notre histoire, laquelle je choisirais ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quel est mon dessert ou snack préféré le soir devant un film ?', 'options': None},
    {'game_type': GameType.GUESS_MY_ANSWER, 'category': 'guess', 'question_text': 'Quelle note sur 10 je donne à notre complicité en ce moment (et pourquoi) ?', 'options': None},
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
