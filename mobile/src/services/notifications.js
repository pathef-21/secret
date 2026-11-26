import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from './api';

let swRegistration = null;

export async function initNotifications() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.warn('ServiceWorker registration failed:', e);
      }
    }
    return;
  }

  // Native iOS / Android Expo Push Token registration
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      const tokenObj = await Notifications.getExpoPushTokenAsync();
      if (tokenObj?.data) {
        await api.post('/notifications/token/', {
          token: tokenObj.data,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      }
    }
  } catch (e) {
    console.warn('Native push registration skipped:', e?.message || e);
  }
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { granted: false, reason: 'Ce navigateur ne supporte pas les notifications.' };
    }
    const perm = await window.Notification.requestPermission();
    if (perm === 'granted') {
      await initNotifications();
      showLocalNotification('Man Ak Bae ❤️', 'Les notifications sont activées ! 🔔');
      return { granted: true };
    }
    return { granted: false, reason: 'Permission refusée dans les réglages du navigateur.' };
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    await initNotifications();
    return { granted: true };
  }
  return { granted: false, reason: 'Permission refusée.' };
}

export function showLocalNotification(title, body) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;
    try {
      if (swRegistration && swRegistration.showNotification) {
        swRegistration.showNotification(title, {
          body,
          icon: '/dashboard-admin/logo.png',
          badge: '/dashboard-admin/logo.png',
          vibrate: [200, 100, 200],
          tag: 'man-ak-bae-msg',
          renotify: true,
        });
      } else {
        new window.Notification(title, {
          body,
          icon: '/dashboard-admin/logo.png',
        });
      }
    } catch (e) {
      console.warn('Web notification error:', e);
    }
  }
}
