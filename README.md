# Atelier TextEdit — PWA

A self-contained text editor that installs as an app on your phone. Edit
locally, never phones home, works offline once cached.

## Files in this folder

| File | Purpose |
| --- | --- |
| `index.html` | The entire editor (CodeMirror + fonts inlined) |
| `manifest.json` | App name, icons, file & share-target registrations |
| `service-worker.js` | Offline cache + receives shared files |
| `icon-192.png` / `icon-512.png` | Standard launcher icons |
| `icon-maskable-512.png` | Adaptive-icon variant (Android) |
| `favicon.png` | Browser tab icon |

## Deploy to GitHub Pages (one time, ~3 minutes)

1. **Create a new repo** at <https://github.com/new>. Any name works
   (`textedit` is a fine choice). Keep it public — Pages on private repos
   needs a paid plan.
2. **Upload every file** from this folder to the repo's root. Drag-and-drop
   in the GitHub web UI works; commit with a one-line message.
3. **Enable Pages**: repo → **Settings** → **Pages** → under *Source* pick
   **Deploy from a branch**, branch `main`, folder `/` (root). Save.
4. Wait ~30–60 seconds. Pages will show a green check and a URL like
   `https://YOUR-USERNAME.github.io/textedit/`. That's your app.

That's it. The page will load over HTTPS, which is what makes the next
step possible.

## Install on a Pixel 9

1. Open the Pages URL in **Chrome**.
2. Tap **⋮** (top-right) → **Add to Home screen** (or **Install app** if
   Chrome offers it directly).
3. Confirm the name — Chrome will show **TextEdit**. Tap **Install**.
4. The icon appears on your home screen. Tap it: opens as a standalone
   window, no browser chrome.

After the first launch, the service worker has cached everything. The app
works in airplane mode from then on.

## How "share to TextEdit" works

Any app that can share a text file (file manager, email, Drive, Obsidian,
chat apps with attachments, etc.) will list **TextEdit** in the share
sheet. Tap it: TextEdit opens with the file already loaded in a new tab,
ready to edit.

To save changes back, use **Save** in the toolbar. On Chromium-based
Android the editor uses the File System Access API where available;
otherwise it falls back to a normal download into `Downloads/`.

## Updating the app

Push new files to the repo. The service worker will detect the change on
the next launch and refresh its cache automatically (it bumps the cache
version on every install). If you ever need to force a refresh: long-press
the app icon → App info → Storage → Clear cache.

## Privacy notes

- Your files never leave the device. The editor has no network code.
- GitHub serves you the editor itself — that's the only network traffic,
  and only on first load (or when checking for updates).
- Verify it yourself: open Chrome DevTools → Network tab while editing.
  No requests should fire when you type, save, or export.

## Troubleshooting

**"Install app" option doesn't appear.** Make sure you're on the Pages URL
(`https://...github.io/...`), not the file directly. The service worker
has to be reachable for Chrome to consider it installable.

**Share menu doesn't show TextEdit.** Open the installed app at least
once first — Android only registers share targets after the first launch.
If it's still missing, uninstall and reinstall.

**File doesn't open after sharing.** Some Android share flows send only
file metadata, not contents. The editor handles both files and shared
text; if a share contains nothing readable, you'll get an empty new file.
