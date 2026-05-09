/* Atelier TextEdit — service worker
 * - Caches the entire app on install for offline use
 * - Intercepts POSTs to ./share-target and stashes the shared file(s)
 *   into a Cache so the page can pick them up after the redirect.
 */

const VERSION = 'v4';
const APP_CACHE = `atelier-app-${VERSION}`;
const SHARED_CACHE = 'atelier-shared';   // separate, not versioned

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop old app caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k.startsWith('atelier-app-') && k !== APP_CACHE)
          .map(k => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ---- Web Share Target intake ------------------------------------
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // ---- Offline-first cache strategy for same-origin GETs ----------
  if (event.request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          // Opportunistically cache successful same-origin responses
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(APP_CACHE).then(c => c.put(event.request, clone));
          }
          return resp;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();

    // 1) Files (multiple permitted)
    const files = formData.getAll('file').filter(v => v instanceof File);

    // Wipe any leftover shared files from a previous share
    const cache = await caches.open(SHARED_CACHE);
    const oldKeys = await cache.keys();
    await Promise.all(oldKeys.map(k => cache.delete(k)));

    let count = 0;
    for (const file of files) {
      if (!file || !file.name) continue;
      // Store under /shared/<encoded-name>; the page reads the basename back.
      const stashUrl = new URL('./shared/' + encodeURIComponent(file.name),
                                self.location.origin + self.registration.scope);
      await cache.put(
        new Request(stashUrl.toString()),
        new Response(file, {
          headers: { 'Content-Type': file.type || 'text/plain' }
        })
      );
      count++;
    }

    // 2) Pass through any text/title/url params so the page can use them too.
    const qs = new URLSearchParams();
    qs.set('shared', '1');
    for (const k of ['title', 'text', 'url']) {
      const v = formData.get(k);
      if (v) qs.set(k, String(v));
    }

    const dest = './?' + qs.toString();
    return Response.redirect(dest, 303);
  } catch (err) {
    return new Response('Share target failed: ' + err.message, { status: 500 });
  }
}
