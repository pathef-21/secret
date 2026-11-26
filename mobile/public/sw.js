self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Man Ak Bae ❤️', body: 'Nouveau message de ton Bae !' };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Man Ak Bae ❤️', {
      body: payload.body || 'Nouveau message',
      icon: '/dashboard-admin/logo.png',
      badge: '/dashboard-admin/logo.png',
      vibrate: [200, 100, 200],
      tag: 'man-ak-bae-msg',
      renotify: true,
      data: payload.data || { url: '/chat' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/chat');
    })
  );
});
