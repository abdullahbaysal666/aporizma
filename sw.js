/* Aporizma service worker: assets cache-first, sayfalar network-first
   (guncel icerik) + cevrimdisi yedek. Surum artinca eski cache silinir. */
const VERSION = "aporizma-v1";
const CORE = ["/", "/tr/", "/assets/organ.css", "/assets/organ.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith("tool.js")) {
    // Statik varliklar: cache-first (hiz), arka planda tazelenir.
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const fresh = fetch(e.request).then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }

  // Sayfalar: network-first, kopunca cache (cevrimdisi calisma).
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match("/")))
  );
});
