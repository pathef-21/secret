import requests
import logging
from django.conf import settings
from .models import DeviceToken, AppNotification

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def send_push_notification(user, title, body, data=None, notification_type='message'):
    """
    Envoie une notification push vers les appareils mobiles de l'utilisateur via Expo,
    et enregistre l'historique in-app dans AppNotification.
    """
    # 1. Enregistrer dans la base in-app
    AppNotification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        body=body,
        data=data or {}
    )

    # 2. Vérifier les préférences
    if hasattr(user, 'notification_preferences'):
        prefs = user.notification_preferences
        if notification_type == 'message' and not prefs.messages_enabled:
            return
        elif notification_type == 'flame' and not prefs.flames_enabled:
            return
        elif notification_type == 'letter' and not prefs.letters_enabled:
            return
        elif notification_type == 'calendar' and not prefs.calendar_enabled:
            return
        elif notification_type == 'game' and not prefs.games_enabled:
            return

    # 3. Récupérer les tokens actifs
    tokens = list(DeviceToken.objects.filter(user=user, is_active=True).values_list('token', flat=True))
    if not tokens:
        return

    messages = []
    for token in tokens:
        if token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken["):
            messages.append({
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {},
                "priority": "high",
            })

    if not messages:
        return

    headers = {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }
    expo_access_token = getattr(settings, 'EXPO_ACCESS_TOKEN', None)
    if expo_access_token:
        headers["Authorization"] = f"Bearer {expo_access_token}"

    try:
        response = requests.post(EXPO_PUSH_URL, json=messages, headers=headers, timeout=5)
        response.raise_for_status()
    except Exception as exc:
        logger.warning(f"Expo push notification failed: {exc}")

