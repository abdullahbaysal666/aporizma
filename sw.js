/* Aporizma SW v2 (montaj uretir): TAM onbellek + share target. */
const VERSION = "aporizma-v2-145";
const PRECACHE = ["/", "/tr/", "/app/", "/share/", "/assets/organ.css", "/assets/organ.js", "/assets/tools.json", "/manifest.webmanifest", "/assets/icons/icon-192.png", "/assets/icons/icon-512.png", "/tools/merge-pdf/", "/tools/merge-pdf/tool.js", "/tr/araclar/pdf-birlestir/", "/tr/araclar/pdf-birlestir/tool.js", "/tools/split-pdf/", "/tools/split-pdf/tool.js", "/tr/araclar/pdf-bol/", "/tr/araclar/pdf-bol/tool.js", "/tools/image-resize-compress/", "/tools/image-resize-compress/tool.js", "/tr/araclar/resim-kucult-sikistir/", "/tr/araclar/resim-kucult-sikistir/tool.js", "/tools/word-character-counter/", "/tools/word-character-counter/tool.js", "/tr/araclar/kelime-karakter-sayaci/", "/tr/araclar/kelime-karakter-sayaci/tool.js", "/tools/qr-code-generator/", "/tools/qr-code-generator/tool.js", "/tr/araclar/qr-kod-olusturucu/", "/tr/araclar/qr-kod-olusturucu/tool.js", "/tools/password-generator/", "/tools/password-generator/tool.js", "/tr/araclar/sifre-uretici/", "/tr/araclar/sifre-uretici/tool.js", "/tools/srt-to-vtt-converter/", "/tools/srt-to-vtt-converter/tool.js", "/tr/araclar/srt-vtt-donusturucu/", "/tr/araclar/srt-vtt-donusturucu/tool.js", "/tools/subtitle-merger/", "/tools/subtitle-merger/tool.js", "/tr/araclar/altyazi-birlestirici/", "/tr/araclar/altyazi-birlestirici/tool.js", "/tools/subtitle-sync-shifter/", "/tools/subtitle-sync-shifter/tool.js", "/tr/araclar/altyazi-senkron-kaydirici/", "/tr/araclar/altyazi-senkron-kaydirici/tool.js", "/tools/llm-api-cost-calculator/", "/tools/llm-api-cost-calculator/tool.js", "/tr/araclar/llm-api-maliyet-hesaplayici/", "/tr/araclar/llm-api-maliyet-hesaplayici/tool.js", "/tools/json-formatter/", "/tools/json-formatter/tool.js", "/tr/araclar/json-duzenle/", "/tr/araclar/json-duzenle/tool.js", "/tools/base64-encode-decode/", "/tools/base64-encode-decode/tool.js", "/tr/araclar/base64-kodla-coz/", "/tr/araclar/base64-kodla-coz/tool.js", "/tools/cron-expression-builder/", "/tools/cron-expression-builder/tool.js", "/tr/araclar/cron-ifade-kurucu/", "/tr/araclar/cron-ifade-kurucu/tool.js", "/tools/youtube-title-thumbnail-preview/", "/tools/youtube-title-thumbnail-preview/tool.js", "/tr/araclar/youtube-baslik-kapak-onizleme/", "/tr/araclar/youtube-baslik-kapak-onizleme/tool.js", "/tools/public-domain-day-calendar/", "/tools/public-domain-day-calendar/tool.js", "/tr/araclar/kamu-mali-takvimi/", "/tr/araclar/kamu-mali-takvimi/tool.js", "/tools/camera-to-pdf/", "/tools/camera-to-pdf/tool.js", "/tr/araclar/belge-tara-pdf/", "/tr/araclar/belge-tara-pdf/tool.js", "/tools/case-converter/", "/tools/case-converter/tool.js", "/tr/araclar/harf-buyuklugu-donusturucu/", "/tr/araclar/harf-buyuklugu-donusturucu/tool.js", "/tools/invisible-character-remover/", "/tools/invisible-character-remover/tool.js", "/tr/araclar/gorunmez-karakter-temizleyici/", "/tr/araclar/gorunmez-karakter-temizleyici/tool.js", "/tools/color-converter/", "/tools/color-converter/tool.js", "/tr/araclar/renk-donusturucu/", "/tr/araclar/renk-donusturucu/tool.js", "/tools/color-palette-from-image/", "/tools/color-palette-from-image/tool.js", "/tr/araclar/gorselden-renk-paleti/", "/tr/araclar/gorselden-renk-paleti/tool.js", "/tools/csv-to-json-converter/", "/tools/csv-to-json-converter/tool.js", "/tr/araclar/csv-json-donusturucu/", "/tr/araclar/csv-json-donusturucu/tool.js", "/tools/epoch-timestamp-converter/", "/tools/epoch-timestamp-converter/tool.js", "/tr/araclar/unix-zaman-damgasi-donusturucu/", "/tr/araclar/unix-zaman-damgasi-donusturucu/tool.js", "/tools/hash-generator/", "/tools/hash-generator/tool.js", "/tr/araclar/hash-uretici/", "/tr/araclar/hash-uretici/tool.js", "/tools/html-entity-encoder-decoder/", "/tools/html-entity-encoder-decoder/tool.js", "/tr/araclar/html-entity-kodla-coz/", "/tr/araclar/html-entity-kodla-coz/tool.js", "/tools/jwt-decoder/", "/tools/jwt-decoder/tool.js", "/tr/araclar/jwt-coz/", "/tr/araclar/jwt-coz/tool.js", "/tools/line-tools/", "/tools/line-tools/tool.js", "/tr/araclar/satir-araclari/", "/tr/araclar/satir-araclari/tool.js", "/tools/markdown-preview/", "/tools/markdown-preview/tool.js", "/tr/araclar/markdown-onizleme/", "/tr/araclar/markdown-onizleme/tool.js", "/tools/qr-code-reader/", "/tools/qr-code-reader/tool.js", "/tr/araclar/qr-kod-okuyucu/", "/tr/araclar/qr-kod-okuyucu/tool.js", "/tools/reading-time-calculator/", "/tools/reading-time-calculator/tool.js", "/tr/araclar/okuma-suresi-hesaplama/", "/tr/araclar/okuma-suresi-hesaplama/tool.js", "/tools/regex-tester/", "/tools/regex-tester/tool.js", "/tr/araclar/regex-test/", "/tr/araclar/regex-test/tool.js", "/tools/slug-generator/", "/tools/slug-generator/tool.js", "/tr/araclar/slug-uretici/", "/tr/araclar/slug-uretici/tool.js", "/tools/text-diff/", "/tools/text-diff/tool.js", "/tr/araclar/metin-karsilastir/", "/tr/araclar/metin-karsilastir/tool.js", "/tools/uuid-generator/", "/tools/uuid-generator/tool.js", "/tr/araclar/uuid-uretici/", "/tr/araclar/uuid-uretici/tool.js", "/assets/vendor/jsqr.js", "/assets/vendor/pdf-lib.min.js", "/assets/vendor/qrcode.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await Promise.allSettled(PRECACHE.map((u) => c.add(u)));
  }).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION && k !== "share-inbox")
        .map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function handleShare(e) {
  const form = await e.request.formData();
  const files = form.getAll("files").filter((f) => f && f.size !== undefined);
  const inbox = await caches.open("share-inbox");
  const meta = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    meta.push({ name: f.name || ("dosya-" + i), type: f.type || "", size: f.size });
    await inbox.put("/share-inbox/" + i,
      new Response(f, { headers: { "Content-Type": f.type || "application/octet-stream" } }));
  }
  const extra = { title: form.get("title") || "", text: form.get("text") || "", url: form.get("url") || "" };
  await inbox.put("/share-inbox/meta",
    new Response(JSON.stringify({ files: meta, extra }), { headers: { "Content-Type": "application/json" } }));
  return Response.redirect("/share/", 303);
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  if (e.request.method === "POST" && url.pathname.replace(/\/$/, "") === "/share") {
    e.respondWith(handleShare(e));
    return;
  }
  if (e.request.method !== "GET") return;

  if (url.pathname.startsWith("/share-inbox/")) {
    e.respondWith(caches.open("share-inbox").then((c) => c.match(url.pathname))
      .then((r) => r || new Response("", { status: 404 })));
    return;
  }

  if (url.pathname === "/assets/tools.json") {
    // arac listesi TAZE olmali (uygulama yuzu bundan beslenir): once ag, kopunca cache
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith("tool.js")) {
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
