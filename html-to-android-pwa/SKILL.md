---
name: HTML Web App → Android PWA
description: Converts a self-contained HTML web app into an installable Android PWA by generating manifest.json, service-worker.js, icon guidance, and the HTML head snippet needed to make it installable via Chrome on Android.
---

# Skill: HTML Web App → Android PWA

Convert any self-contained HTML web app into an installable Android app using the PWA standard. No build tools, no framework, no app store required.

---

## What you need to provide

- The HTML file(s) for the app (or a description of what it does)
- An app name and short name (≤12 chars for the home screen label)
- A theme colour (hex) — usually the app's background or toolbar colour
- Icons, OR permission to generate placeholder ones

---

## What Claude will produce

1. `manifest.json` — tells Android the app's name, colours, and icons
2. `service-worker.js` — caches the app for offline use
3. Icon files at 192×192 and 512×512 px (maskable variant optional)
4. A `<head>` snippet to paste into the HTML, wiring everything together
5. Step-by-step install instructions for the user's Android device

---

## Step-by-step process

### 1 — Audit the HTML

Read the provided HTML. Note:
- All external resources (fonts, scripts, images). Each one that isn't cached will break offline.
- The existing `<head>` content (avoid duplicating tags).
- The primary background and accent colours (for `theme_color` / `background_color`).

### 2 — Write `manifest.json`

```json
{
  "name": "<Full App Name>",
  "short_name": "<≤12 chars>",
  "description": "<one sentence>",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#xxxxxx",
  "theme_color": "#xxxxxx",
  "lang": "en",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- `display: standalone` hides the browser chrome (looks like a native app).
- `start_url: "./"` makes it work in subdirectory deployments (e.g. GitHub Pages).

### 3 — Write `service-worker.js`

Cache the entire app shell on install so it works offline. List every file the app needs:

```js
const VERSION = 'v1';
const CACHE = `app-${VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // add every CSS, JS, font, image the app uses
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp && resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
```

Bump `VERSION` whenever the app's files change so the old cache is evicted.

### 4 — Patch the HTML `<head>`

Add these lines inside `<head>` (after `<meta charset>`):

```html
<link rel="manifest" href="manifest.json">
<link rel="icon" href="favicon.png" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="theme-color" content="#xxxxxx">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="<short_name>">
```

Add before `</body>`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
</script>
```

### 5 — Icons

**If the user provides icons:** resize to 192×192 and 512×512 PNG. For the maskable variant keep the main graphic within the central 80% (safe zone).

**If no icons are provided:** generate simple SVG-based placeholders using the app's initials and theme colour, then convert to PNG. Note clearly that these are placeholders.

**Minimum required:** `icon-192.png` and `icon-512.png`. Android will refuse to show the install prompt without at least one icon ≥ 192×192.

### 6 — Verify before handing off

Check:
- `manifest.json` is valid JSON (no trailing commas).
- The service worker lists every file the app actually loads.
- The `<link rel="manifest">` path matches where `manifest.json` will be served.
- No external CDN URLs are fetched that aren't in the cache list (they'll fail offline).

---

## Deploying (GitHub Pages — free, no server needed)

1. Put all files (`index.html`, `manifest.json`, `service-worker.js`, icons) in a GitHub repo root.
2. Go to **Settings → Pages → Branch → main → / (root) → Save**.
3. Wait ~60 s for the first deploy. The URL is `https://<username>.github.io/<repo>/`.
4. Confirm the site loads and the manifest is reachable at `<url>/manifest.json`.

---

## Installing on Android (Chrome)

1. Open Chrome and navigate to the app URL.
2. Wait a few seconds — Chrome checks for a valid manifest + service worker.
3. An **"Add to Home screen"** banner appears at the bottom. Tap **Install**.
   - If the banner doesn't appear: tap **⋮ → Add to Home screen → Install**.
4. The app icon appears on the home screen and in the app drawer.
5. Launch it — it opens full-screen with no browser chrome.

**Troubleshooting:** If Chrome doesn't offer install:
- Open `chrome://flags` and search "installability" to check criteria.
- The service worker must have fired at least one `fetch` event.
- Open DevTools (via USB debugging) → Application → Manifest to see any errors.

---

## Checklist

- [ ] `manifest.json` present and valid
- [ ] `short_name` ≤ 12 characters
- [ ] At least one icon ≥ 192×192 px
- [ ] `service-worker.js` registered in HTML
- [ ] All app assets listed in service worker cache
- [ ] Site served over HTTPS (required for service workers)
- [ ] Tested offline (DevTools → Network → Offline)
- [ ] Install prompt appears in Chrome on Android
