# Documentation de l'API REST & WebSockets — MAN AK BAE ❤️

Format des données : `application/json`.
Authentification : En-tête `Authorization: Bearer <jwt_access_token>`.

---

## 1. Authentification & Profil (`/api/auth/`)

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Inscription nouvel utilisateur | Public |
| `POST` | `/api/auth/login/` | Connexion et obtention des jetons JWT | Public |
| `POST` | `/api/auth/refresh/` | Rafraîchissement du jeton d'accès | Public |
| `GET` | `/api/auth/me/` | Récupération des informations de l'utilisateur connecté | Authentifié |
| `PATCH`| `/api/auth/profile/` | Mise à jour du surnom, bio et avatar | Authentifié |
| `POST` | `/api/auth/change-password/` | Changement sécurisé de mot de passe | Authentifié |
| `POST` | `/api/auth/logout/` | Révocation du Refresh Token (Blacklist) | Authentifié |
| `POST` | `/api/auth/delete-account/` | Suppression irréversible du compte et des données | Authentifié |

---

## 2. Espace de Couple & Dashboard (`/api/couples/`)

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| `GET` | `/api/couples/me/` | Détails complets de mon espace couple | Membre Couple |
| `GET` | `/api/couples/dashboard/` | Données agrégées pour l'écran d'accueil | Membre Couple |
| `POST` | `/api/couples/create/` | Création d'un nouvel espace couple et code d'invitation | Authentifié |
| `POST` | `/api/couples/invite/` | Génération d'un nouveau code d'invitation (48h) | Membre Couple |
| `POST` | `/api/couples/join/` | Rejoindre un couple avec un code d'invitation | Authentifié |
| `POST` | `/api/couples/leave/` | Quitter l'espace de couple | Membre Couple |

---

## 3. Messagerie & WebSockets (`/api/chat/`)

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| `GET` | `/api/chat/messages/` | Historique paginé des messages | Membre Couple |
| `POST` | `/api/chat/send/` | Envoi d'un message texte ou média (multipart) | Membre Couple |
| `POST` | `/api/chat/messages/<id>/react/` | Ajouter/retirer une réaction emoji | Membre Couple |
| `POST` | `/api/chat/messages/read/` | Marquer les messages reçus comme lus | Membre Couple |
| `DELETE`| `/api/chat/messages/<id>/` | Supprimer son propre message | Membre Couple |

### WebSocket Temps Réel
- **URL** : `ws://<HOST>/ws/chat/?token=<access_token>`
- **Événements envoyés par le client** :
  - `send_message` : `{"action": "send_message", "content": "Je t'aime", "message_type": "text"}`
  - `typing` : `{"action": "typing", "is_typing": true}`
  - `read` : `{"action": "read"}`
- **Événements reçus par le client** :
  - `new_message` : Nouveau message reçu instantanément
  - `typing` : Partenaire en train de taper
  - `presence` : Statut en ligne / hors ligne
  - `read_receipt` : Accusé de lecture instantané

---

## 4. Flammes & Streaks (`/api/flames/`)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/flames/` | Récupère le streak en cours, le record, et l'état du jour (Dakar) |

---

## 5. Jeux pour Deux (`/api/games/`)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/games/list/` | Liste des 7 jeux romantiques disponibles |
| `GET` | `/api/games/question/<game_type>/` | Tire une question aléatoire pour un type de jeu |
| `POST`| `/api/games/sessions/` | Démarre une nouvelle session de jeu pour le couple |
| `POST`| `/api/games/sessions/<session_id>/answer/` | Soumet la réponse ou devinette et compare |

---

## 6. Souvenirs (`/api/memories/`)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/memories/items/` | Liste ou ajout d'un souvenir (photo/vidéo) |
| `GET` / `POST` | `/api/memories/albums/` | Liste ou création d'albums |
| `POST` | `/api/memories/comments/` | Ajouter un commentaire tendre sous un souvenir |

---

## 7. Agenda du Couple (`/api/calendar/`)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/calendar/events/?filter=upcoming` | Rendez-vous à venir |
| `GET` | `/api/calendar/events/?filter=past` | Rendez-vous passés |
| `POST` | `/api/calendar/events/` | Ajouter un rendez-vous amoureux |
| `DELETE`| `/api/calendar/events/<id>/` | Supprimer un événement |

---

## 8. Lettres Secrètes & Surprises (`/api/surprises/`)

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/surprises/letters/` | Lister ou rédiger une lettre d'amour |
| `POST` | `/api/surprises/letters/<id>/open/` | Ouvrir et décacheter une lettre déverrouillée |
| `GET` / `POST` | `/api/surprises/surprises/` | Lister ou programmer une surprise |
| `POST` | `/api/surprises/surprises/<id>/reveal/` | Révéler le message secret de la surprise |

