self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Market Duty Reminder', {
      body: data.body || '',
      icon: '/messy-logo.png',
      badge: '/messy-logo.png',
      tag: data.tag || 'market-duty',
      data: { url: data.url || '' },
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url;
  if (url) e.waitUntil(clients.openWindow(url));
});
