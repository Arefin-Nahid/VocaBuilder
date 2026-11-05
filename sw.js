/* Service worker: lets the app install on a phone and open offline.
   - Same-origin files: network first (so a new push shows up as soon as you are online), cache as fallback.
   - Google Fonts: cache first.
   Paths are relative, so it works at the repo root and under /repo-name/ on GitHub Pages. */
const CACHE = "vocabuilder-202611050341"; /* CACHE */
const PRECACHE = [
  "./", "index.html", "manifest.webmanifest", "favicon.svg", "favicon-32.png", "apple-touch-icon.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
  "css/tokens.css", "css/base.css", "css/layout.css", "css/lesson.css", "css/components.css",
  "css/vocabulary.css", "css/quiz-review.css", "css/responsive.css", "css/index.css", "css/theme-mint.css",
  /* PACKS:START */
  "js/data/pack-001-030.js",
  "js/data/pack-031-042.js",
  "js/data/pack-043-067.js",
  /* PACKS:END */
  "js/core/config.js", "js/core/firebase-config.js", "js/core/utils.js", "js/core/calendar.js", "js/core/store.js", "js/core/vocab.js", "js/core/progress.js",
  "js/core/srs.js", "js/core/speech.js", "js/core/sync.js",
  "js/ui/header.js", "js/ui/learn.js", "js/ui/quiz.js", "js/ui/review.js", "js/ui/index.js", "js/ui/about.js", "js/ui/sync.js",
  "js/app.js", "js/pwa.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;

  if (isFont) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
