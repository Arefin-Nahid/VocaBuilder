/* Service worker: lets the app install on a phone and open offline.
   - Same-origin files: network first (so a new push shows up as soon as you are online), cache as fallback.
   - Google Fonts: cache first.
   Paths are relative, so it works at the repo root and under /repo-name/ on GitHub Pages. */
const CACHE = "vocabuilder-v2";
const PRECACHE = [
  "./", "index.html", "manifest.webmanifest", "favicon.svg", "favicon-32.png", "apple-touch-icon.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
  "css/tokens.css", "css/base.css", "css/layout.css", "css/lesson.css", "css/components.css",
  "css/vocabulary.css", "css/quiz-review.css", "css/responsive.css", "css/theme-mint.css",
  "js/data/days-01-05.js", "js/data/days-06-10.js", "js/data/days-11-15.js", "js/data/days-16-20.js",
  "js/data/days-21-25.js", "js/data/days-26-30.js",
  "js/data/bangla-words-1.js", "js/data/bangla-words-2.js", "js/data/bangla-words-3.js", "js/data/bangla-words-4.js",
  "js/data/bangla-stories-1.js", "js/data/bangla-stories-2.js",
  "js/data/examples-01-05.js", "js/data/examples-06-10.js", "js/data/examples-11-15.js", "js/data/examples-16-20.js",
  "js/data/examples-21-25.js", "js/data/examples-26-30.js",
  "js/core/config.js", "js/core/utils.js", "js/core/calendar.js", "js/core/store.js", "js/core/vocab.js",
  "js/core/srs.js", "js/core/speech.js",
  "js/ui/header.js", "js/ui/learn.js", "js/ui/quiz.js", "js/ui/review.js",
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
