# MAN AK BAE ❤️ — Application Mobile Privée pour Couples

> **« Moi et ma copine »** : Une bulle d'intimité numérique, moderne, fluide et sécurisée réservée exclusivement à deux personnes en couple.

---

## 🌟 Présentation du Projet

**Man Ak Bae ❤️** réunit le meilleur de la messagerie instantanée, des souvenirs partagés et de la complicité amoureuse au sein d'une interface mobile élégante en mode sombre, sublimée par une palette romantique équilibrée :
- **Noir profond** : `#17151C`
- **Rose principal** : `#F2A7C6`
- **Rose clair** : `#FCE4ED`
- **Violet** : `#A78BFA`
- **Blanc cassé** : `#FFF9F7`

L'application garantit une **isolation étanche** : chaque espace de couple est limité à **exactement deux partenaires**. Aucun tiers ne peut accéder aux conversations, photos ou événements d'un autre couple.

---

## 📱 Les 5 Onglets Principaux & Fonctionnalités

1. **Accueil / Dashboard** :
   - Photos de profil et prénoms face à face avec cœur central.
   - Compteur de la relation en jours (« Ensemble depuis X jours »).
   - Compteur de **Flammes ❤️🔥** consécutives (calcul côté serveur, fuseau `Africa/Dakar`).
   - Citation romantique inspirante du jour.
   - Prochain rendez-vous amoureux et accès rapide aux lettres d'amour.

2. **Messagerie Privée Temps Réel** :
   - Échanges instantanés par WebSockets (Django Channels + Redis).
   - Messages texte, photos, vidéos et vocaux.
   - Réactions aux messages avec émojis (❤️, 🔥, 😂, etc.).
   - Bouton pulsation « Coup de Cœur » rapide.
   - Indicateur de frappe « est en train d'écrire... » et présence en ligne en direct.
   - Accusés de lecture (« Envoyé », « Reçu », « Lu »).

3. **Jeux de Couple Complices (7 jeux)** :
   - *Action ou vérité*
   - *Tu préfères quoi ?*
   - *Quiz de couple*
   - *Qui connaît mieux l’autre ?*
   - *Questions profondes*
   - *Défis romantiques*
   - *Devine ma réponse*
   - Base de questions romantiques intégrée et extensible.

4. **Souvenirs** :
   - Albums thématiques (voyages, dates, sorties).
   - Ajout de photos et vidéos avec date, lieu et titre.
   - Commentaires tendres sous chaque souvenir.

5. **Agenda Partagé** :
   - Calendrier des rendez-vous et célébrations (dîners, cinéma, anniversaires).
   - Vue chronologique avec filtres « À venir » et « Moments passés ».

6. **Boîte aux Lettres Secrètes & Surprises** :
   - Rédaction de lettres d'amour avec sceau de cire.
   - **Déverrouillage temporel programmé** : Le partenaire ne peut pas lire le contenu avant la date/heure choisie (cadenas doré).
   - Surprises avec indices.

---

## 🛠️ Stack Technologique

- **Application Mobile** : React Native, Expo SDK 52, Expo Router, React Native Reanimated, Expo SecureStore, Expo ImagePicker, Expo AV, Axios.
- **Backend** : Python 3.13, Django 5.2, Django REST Framework, Django Channels (WebSockets), Daphne, SimpleJWT (rotation et révocation).
- **Base de Données & Cache** : PostgreSQL 16, Redis 7.
- **Infrastructure & CI/CD** : Docker, Docker Compose, GitHub Actions, Expo EAS.

---

## 🚀 Guide de Démarrage Rapide (Windows PowerShell)

### 1. Cloner et préparer les variables d'environnement
```powershell
# Cloner le projet
git clone <URL_DU_DEPOT>
cd "man ak bae"

# Créer votre fichier d'environnement
Copy-Item .env.example .env
```

### 2. Démarrer le Backend Django
```powershell
cd backend

# Activer l'environnement virtuel (déjà créé dans backend/venv)
.\venv\Scripts\Activate.ps1

# Appliquer les migrations de base de données
python manage.py migrate

# Peupler la base avec les 17 questions romantiques initiales
python manage.py seed_games

# Lancer le serveur ASGI avec support WebSockets
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```
Le backend est accessible sur `http://localhost:8000/api/` et le WebSocket sur `ws://localhost:8000/ws/chat/`.

### 3. Exécuter les Tests Automatisés
```powershell
cd backend
.\venv\Scripts\pytest.exe
```

### 4. Lancer l'Application Mobile Expo
Dans un second terminal PowerShell :
```powershell
cd mobile

# Démarrer le serveur Metro Expo
npx expo start
```
- Appuyez sur **`a`** pour lancer sur un émulateur Android.
- Scannez le QR Code avec l'application **Expo Go** sur votre smartphone physique.

---

## 📦 Compilation de l'APK Android (Installable)
Pour produire un fichier installable `.apk` via Expo EAS :
```powershell
cd mobile
npx eas login
npx eas build -p android --profile preview
```

---

## 📚 Documentation Détaillée
- [Architecture Technique](docs/architecture.md)
- [Base de Données](docs/database.md)
- [Documentation des API](docs/api.md)
- [Sécurité & Confidentialité](docs/security.md)
- [Déploiement](docs/deployment.md)
- [Rapport de Tests](docs/testing.md)

