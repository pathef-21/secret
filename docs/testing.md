# Rapport de Tests & Assurance Qualité — MAN AK BAE ❤️

## 1. Tests Automatisés Backend

La suite de tests automatisée est gérée par `pytest` et `pytest-django`.

### Exécution locale des tests
```powershell
Set-Location backend
.\venv\Scripts\pytest.exe
```

### Couverture des Tests (`backend/tests/test_full_suite.py`)
1. **`test_authentication_workflow`** :
   - Inscription d'un nouvel utilisateur avec email unique et mot de passe conforme aux règles de sécurité.
   - Connexion et vérification de la génération des tokens JWT (`access` et `refresh`).
   - Création automatique du profil associé (`UserProfile`) et des préférences de notification.
2. **`test_couple_creation_and_partner_joining`** :
   - Création d'un couple par l'utilisateur créateur.
   - Génération du code d'invitation à 8 caractères alphanumériques.
   - Adhésion du partenaire avec le code secret.
   - **Test de sécurité** : Tentative d'intrusion d'un 3ème utilisateur avec le même code d'invitation. Résultat : Rejeté avec statut HTTP 400 (Règle des 2 membres respectée).
3. **`test_messaging_and_flame_streaks`** :
   - Envoi d'un message par le premier partenaire : participation enregistrée, streak non incrémenté car participation du partenaire en attente.
   - Réponse du partenaire pour la même journée (fuseau `Africa/Dakar`) : validation immédiate de la flamme, incrémentation du streak à 1 jour.
   - Vérification du statut de la flamme sur l'endpoint `/api/flames/`.
4. **`test_love_letters_lock_mechanism`** :
   - Rédaction d'une lettre d'amour programmée dans le futur (7 jours plus tard).
   - Tentative de lecture par le partenaire avant l'échéance : le contenu est masqué (`content_masked: true`).
   - Tentative d'ouverture forcée via l'endpoint de déverrouillage : bloquée avec statut HTTP 403 Forbidden.

### Résultat de l'exécution
```
tests\test_full_suite.py .... [100%]
============================= 4 passed in 49.63s ==============================
```

---

## 2. Validation Mobile

L'intégrité de la structure mobile et de la configuration Expo Router a été vérifiée :
```powershell
Set-Location mobile
npx expo config --type public
```
- Résultat : Validation à 100% sans erreur de plugins ni de dépendances.

