const CACHE_NAME = 'rulebook-relay-v4';
const SHELL = [
  '/',
  '/demo',
  '/settings',
  '/privacy',
  '/terms',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/assets/rulebook-relay-scene-720.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const path of SHELL) {
      const response = await fetch(new Request(path, { cache: 'reload' }));
      if (!response.ok) throw new Error(`Could not cache ${path}.`);
      await cache.put(path, response);
    }
    const index = await cache.match('/index.html');
    const html = index === undefined ? '' : await index.clone().text();
    const buildAssets = [...html.matchAll(/\/assets\/[^"'<> ]+\.(?:js|css)/g)].map((match) => match[0]);
    for (const path of new Set(buildAssets)) {
      const response = await fetch(new Request(path, { cache: 'reload' }));
      if (!response.ok) throw new Error(`Could not cache ${path}.`);
      await cache.put(path, response);
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then(async (cached) => {
        if (cached !== undefined) return cached;
        const shell = await caches.match('/index.html');
        if (shell !== undefined) return shell;
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          if (shell !== undefined) return shell;
          throw new Error('Offline shell is unavailable.');
        }
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => cached ?? fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })),
  );
});
