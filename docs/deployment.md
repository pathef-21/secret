# Procédure de Déploiement Complet — MAN AK BAE ❤️

Ce document détaille les étapes concrètes pour mettre en production le backend Django ASGI, la base de données PostgreSQL, Redis et l'application mobile React Native.

---

## 1. Déploiement Backend & WebSockets

### Option A : Déploiement Recommandé sur Railway (Support natif WebSockets, Postgres & Redis)

Railway est particulièrement adapté pour Man Ak Bae car il gère nativement Daphne (WebSockets) sans coupure et propose des plugins PostgreSQL et Redis en un clic.

1. Connectez votre dépôt GitHub à [railway.app](https://railway.app).
2. Ajoutez un service **PostgreSQL** (fournit automatiquement la variable `DATABASE_URL`).
3. Ajoutez un service **Redis** (fournit automatiquement `REDIS_URL`).
4. Ajoutez votre service Django en liant le dépôt GitHub :
   - Railway détecte automatiquement le fichier `railway.json` à la racine.
   - Ajoutez les variables d'environnement dans l'onglet **Variables** :
     - `SECRET_KEY`: Une clé aléatoire de 50+ caractères.
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `*.railway.app,votre-domaine.com`
     - `USE_REDIS_CHANNEL_LAYER`: `True`
     - `TIME_ZONE`: `Africa/Dakar`
     - `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`: `60`
     - `JWT_REFRESH_TOKEN_LIFETIME_DAYS`: `30`
   - Le script de démarrage exécute automatiquement les migrations et les seeds :
     `cd backend && python manage.py migrate && python manage.py seed_games && daphne -b 0.0.0.0 -p $PORT config.asgi:application`

### Option B : Déploiement sur Render

Le fichier `render.yaml` situé à la racine du projet permet de déployer l'infrastructure complète (Web Service + PostgreSQL + Redis) via **Render Blueprints**.

---

## 2. Stockage des Médias Privés (Photos & Vidéos)

Pour une conservation durable des souvenirs sans surcharger le serveur d'application, utilisez un stockage S3 ou **Cloudflare R2** (très avantageux car 0 frais de bande passante) :

1. Créez un bucket privé nommé `manakbae-media`.
2. Configurez les variables d'environnement dans le backend :
   ```env
   USE_S3_STORAGE=True
   AWS_ACCESS_KEY_ID=<votre_cle_id>
   AWS_SECRET_ACCESS_KEY=<votre_cle_secrete>
   AWS_STORAGE_BUCKET_NAME=manakbae-media
   AWS_S3_ENDPOINT_URL=https://<votre_account_id>.r2.cloudflarestorage.com
   ```

---

## 3. Déploiement Mobile avec Expo EAS

Le fichier `eas.json` est déjà configuré à la racine de `mobile/`.

### Préparation de l'environnement EAS
```powershell
npm install -g eas-cli
cd mobile
eas login
```

### Génération d'un APK Android installable immédiatement
Pour générer un fichier `.apk` distribuable directement sur les téléphones Android (sans passer par Google Play Store) :
```powershell
eas build -p android --profile preview
```
EAS compile l'application dans le cloud et fournit un lien de téléchargement direct de l'APK installable sur tout smartphone Android.

### Préparation pour publication Google Play Store (AAB) & iOS App Store
```powershell
eas build -p android --profile production
eas build -p ios --profile production
```
*(Nécessite vos comptes développeurs Google Play et Apple Developer).*

