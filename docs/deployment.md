# Procédure de Déploiement Permanent — MAN AK BAE ❤️

Ce document détaille comment déployer **de manière permanente et 100 % gratuite** le backend Django ASGI (API + WebSockets), la base de données PostgreSQL, les médias, le site Web et l'application mobile Android.

---

## Architecture 100 % Gratuite & Permanente (Recommandée)

| Composant | Service | Pourquoi ? |
| :--- | :--- | :--- |
| **Base de données PostgreSQL** | **[Neon](https://neon.tech)** (ou Supabase) | Plan gratuit **permanent** (n'expire pas au bout de 30 jours contrairement à Render Postgres). |
| **Backend Django + WebSockets** | **[Render](https://render.com)** | Plan gratuit permanent (750h/mois). *Note : se met en veille après 15 min d'inactivité (~50s au réveil).* |
| **Frontend Web (URL)** | **[Vercel](https://vercel.com)** (ou Cloudflare Pages) | Plan gratuit permanent, HTTPS automatique, zéro mise en veille. |
| **Application Android (APK)** | **[Expo EAS](https://expo.dev)** | Compile un fichier `.apk` installable directement et durablement sur Android. |
| **Stockage Photos & Vidéos** | **[Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)** | 10 Go gratuits/mois, 0 frais de bande passante (évite la perte de fichiers au redémarrage de Render). |

---

## Étape 1 : Base de données PostgreSQL permanente (Neon)

1. Crée un compte gratuit sur [neon.tech](https://neon.tech) et crée un projet nommé `man-ak-bae`.
2. Copie la **Connection String** PostgreSQL (format : `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`).
3. Garde cette URL de côté pour l'étape suivante (`DATABASE_URL`).

---

## Étape 2 : Déploiement du Backend sur Render

1. Pousse ton code sur GitHub.
2. Connecte-toi sur [render.com](https://render.com) → **New +** → **Blueprint**.
3. Sélectionne ton dépôt GitHub : Render détecte automatiquement le fichier `render.yaml` à la racine.
4. Lorsque Render demande les variables marquées `sync: false` :
   - **`DATABASE_URL`** : colle l'URL PostgreSQL de **Neon** (étape 1).
   - **`CORS_ALLOWED_ORIGINS`** : tu pourras y ajouter ton domaine personnalisé plus tard (les domaines `*.vercel.app` et `*.pages.dev` sont déjà autorisés automatiquement).
5. Lance le déploiement. Une fois terminé, note l'URL de ton backend, par exemple :
   `https://man-ak-bae.onrender.com`

---

## Étape 3 : Déploiement du Frontend Web sur Vercel (Permanent & Gratuit)

1. Connecte-toi sur [vercel.com](https://vercel.com) avec GitHub → **Add New Project**.
2. Importe ton dépôt GitHub `man-ak-bae`.
3. Dans **Root Directory**, sélectionne **`mobile`**.
   - Vercel détectera automatiquement `mobile/vercel.json` (`npm run build:web` → dossier `dist`).
4. Ajoute les variables d'environnement dans Vercel :
   - `EXPO_PUBLIC_API_URL` = `https://man-ak-bae.onrender.com/api` *(remplace par ton URL Render)*
   - `EXPO_PUBLIC_WS_URL` = `wss://man-ak-bae.onrender.com/ws/chat/`
5. Clique sur **Deploy** : tu obtiens une URL permanente `https://ton-projet.vercel.app` accessible sur téléphone et ordinateur.

---

## Étape 4 : Application Mobile Android (APK via Expo EAS)

Le fichier `mobile/eas.json` est déjà configuré.

```powershell
npm install -g eas-cli
cd mobile
eas login
```

Pour générer un fichier `.apk` installable directement sur Android :

```powershell
eas build -p android --profile preview
```

EAS compile l'app dans le cloud et te donne un lien de téléchargement de l'APK.

*(Pour définir une autre URL backend lors du build EAS, configure `EXPO_PUBLIC_API_URL` et `EXPO_PUBLIC_WS_URL` dans les variables d'environnement de ton projet Expo sur [expo.dev](https://expo.dev).)*

---

## Étape 5 : Stockage Permanent des Photos & Vidéos (Cloudflare R2)

Sur Render gratuit, les fichiers locaux sont effacés à chaque redémarrage. Pour garder les souvenirs de couple de façon permanente :

1. Crée un bucket privé `manakbae-media` sur **Cloudflare R2**.
2. Ajoute ces variables dans les paramètres **Environment** de ton service Render :
   ```env
   USE_S3_STORAGE=True
   AWS_ACCESS_KEY_ID=<votre_cle_id>
   AWS_SECRET_ACCESS_KEY=<votre_cle_secrete>
   AWS_STORAGE_BUCKET_NAME=manakbae-media
   AWS_S3_ENDPOINT_URL=https://<votre_account_id>.r2.cloudflarestorage.com
   ```

---

## Alternative sans mise en veille : Railway (Payant léger ~5 \$/mois)

Si tu veux supprimer totalement le délai de réveil de ~50s de Render, le fichier `railway.json` à la racine est prêt pour [railway.app](https://railway.app) :
1. Crée un projet sur Railway, ajoute **PostgreSQL** et **Redis**.
2. Lie le dépôt GitHub et ajoute `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=*.railway.app`, `USE_REDIS_CHANNEL_LAYER=True`, `TIME_ZONE=Africa/Dakar`.
