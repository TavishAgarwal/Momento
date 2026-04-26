// MOMENTO Service Worker v2 — Push Notification Support
const CACHE_NAME = 'momento-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first for API, cache first for assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});

// Listen for messages from the main app to show notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, image, tag, data } = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(title || 'MOMENTO', {
        body: body || 'A new moment awaits you.',
        icon: icon || '/icon-192.png',
        badge: '/icon-192.png',
        image: image || undefined,
        tag: tag || 'momento-offer-' + Date.now(),
        vibrate: [200, 100, 200],
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'claim', title: '🎯 Claim Offer' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: data || {}
      })
    );
  }
});

// Handle notification click — bring user back to the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const urlToOpen = action === 'claim' ? '/?claim=true' : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});
