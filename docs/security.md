# Mesures de Sécurité — MAN AK BAE ❤️

La sécurité et la confidentialité sont la priorité absolue du projet.

## 1. Isolation Stricte des Données de Chaque Couple

- Chaque requête vers les données privées (messages, souvenirs, calendrier, jeux, lettres) est filtrée côté backend par la classe de permission `IsCoupleMember` et le `couple_id` de l'utilisateur authentifié.
- Il est impossible pour un utilisateur A d'un couple 1 d'accéder aux données d'un couple 2, même en forgeant un UUID.
- Chaque couple est limité à **exactement deux partenaires**. L'acceptation d'un code d'invitation vérifie de manière atomique avec verrouillage de ligne PostgreSQL (`select_for_update()`) que le couple ne contient pas déjà deux membres.

## 2. Authentification & Gestion des Jetons JWT

- **Jeton d'accès (Access Token)** : Durée de vie courte (60 minutes).
- **Jeton de rafraîchissement (Refresh Token)** : Durée de vie contrôlée (30 jours).
- **Rotation obligatoire des jetons** : À chaque renouvellement, un nouveau refresh token est émis et l'ancien est blacklisté (`ROTATE_REFRESH_TOKENS=True`, `BLACKLIST_AFTER_ROTATION=True`).
- **Stockage Mobile Sécurisé** : Les tokens sont stockés dans le trousseau matériel via **`expo-secure-store`** (KeyStore sous Android, Keychain sous iOS) et jamais dans `localStorage` ou `AsyncStorage`.
- **Révocation à la Déconnexion** : L'endpoint `/api/auth/logout/` révoque immédiatement le refresh token dans la table des jetons blacklistés.

## 3. Sécurité des WebSockets

- Toute tentative de connexion au endpoint `/ws/chat/` sans token JWT valide est immédiatement refusée avec le code `4001`.
- Les utilisateurs sont cloisonnés dans des canaux Redis distincts : `chat_couple_<couple_id>`. Un utilisateur n'est jamais inscrit à la room d'un autre couple.

## 4. Masquage et Cadenas Temporels

- **Lettres d'amour programmées** : Le contenu d'une lettre programmée dans le futur n'est jamais transmis par l'API au destinataire tant que `now < unlock_at`. Le filtrage est appliqué au niveau du serializer Django (`to_representation`), empêchant toute extraction réseau prématurée.

## 5. Protection contre les Injections & Force Brute

- Utilisation intégrale de l'ORM Django (requêtes paramétrées contre les injections SQL).
- Validation stricte des données entrantes avec DRF Serializers.
- Protection CSRF et configuration CORS restrictive en production.
- Mots de passe chiffrés avec les algorithmes forts de Django (PBKDF2 SHA256 avec sel ou Argon2).

