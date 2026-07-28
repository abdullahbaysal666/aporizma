"""Montaj: assembles cells (cells/*/) + organs (organs/) into the static site.

Each cell = cell.json (bilingual strings) + body.html (markup with {{s.key}})
+ optional cell.js (copied as tool.js, strings injected as window.CELL_STRINGS).
Output goes to the repo root so GitHub Pages serves it directly.

Usage: python montaj.py
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CELLS = ROOT / "cells"
ORGANS = ROOT / "organs"
BASE = "https://aporizma.com/"

LANGS = {
    "en": {"other": "tr", "switch_label": "Türkçe", "home": "",
           "privacy_label": "Privacy", "about_label": "About",
           "related_label": "More tools",
           "foot": "handcrafted small tools that run entirely in your browser. No uploads, no tracking.",
           "home_title": "Aporizma — small, fast, private web tools",
           "home_desc": "A growing collection of free tools that run entirely in your browser: subtitles, calculators, converters and more. No uploads, no sign-ups.",
           "home_h1": "Small tools, done right.",
           "home_lede": "Every Aporizma tool runs entirely in your browser — your files and data never leave your device."},
    "tr": {"other": "en", "switch_label": "English", "home": "tr/",
           "privacy_label": "Gizlilik", "about_label": "Hakkında",
           "related_label": "Diğer araçlar",
           "foot": "tamamen tarayıcınızda çalışan küçük araçlar. Yükleme yok, izleme yok.",
           "home_title": "Aporizma — küçük, hızlı, gizliliğe saygılı web araçları",
           "home_desc": "Tamamen tarayıcınızda çalışan ücretsiz araçlar: altyazı, hesaplayıcı, dönüştürücü ve dahası. Yükleme yok, üyelik yok.",
           "home_h1": "Küçük araçlar, hakkıyla.",
           "home_lede": "Her Aporizma aracı tamamen tarayıcınızda çalışır — dosyalarınız ve verileriniz cihazınızdan çıkmaz."},
}


def render(template: str, mapping: dict) -> str:
    for key, value in mapping.items():
        template = template.replace("{{" + key + "}}", value)
    return template


def stamp_strings(text: str, strings: dict) -> str:
    return re.sub(r"\{\{s\.([a-z0-9_]+)\}\}", lambda m: strings[m.group(1)], text)


def rel_root(slug: str) -> str:
    depth = slug.count("/") + 1
    return "../" * depth


# Ana sayfa + ilgili-araçlar sıralaması (denetçi önerisi 2026-07-20):
# yüksek-rağbet araçlar önce; listede olmayan yeni hücreler sona.
DEMAND = ["pdf-merge", "pdf-split", "img-resize", "word-count", "qr-gen",
          "password-gen", "srt-vtt", "srt-merge", "srt-shift", "llm-cost",
          "json-format", "base64", "cron-builder", "yt-preview", "pd-calendar"]
_rank = lambda c: DEMAND.index(c["id"]) if c["id"] in DEMAND else 99


def related_cells(cell: dict, cells: list[dict], n: int = 3) -> list[dict]:
    """Sibling tools for the 'More tools' block: same category first (the user
    clearly needs this family), then overall demand order. Internal links keep
    sessions alive and spread PageRank to new cells."""
    others = [c for c in cells if c["id"] != cell["id"]]
    same = sorted([c for c in others if c.get("category") == cell.get("category")], key=_rank)
    rest = sorted([c for c in others if c.get("category") != cell.get("category")], key=_rank)
    return (same + rest)[:n]


def related_html(cell: dict, cells: list[dict], lang: str, root: str) -> str:
    items = "\n".join(
        f'<li><a href="{root}{c[lang]["slug"]}/"><div class="card">'
        f'<h2>{c[lang]["card_title"]}</h2><p>{c[lang]["card_desc"]}</p></div></a></li>'
        for c in related_cells(cell, cells))
    if not items:
        return ""
    return (f'<section class="related"><h2>{LANGS[lang]["related_label"]}</h2>'
            f'<ul class="tool-grid">{items}</ul></section>')


def faq_ld(faq_html: str, lang: str) -> dict | None:
    """Parse the cell's <h2>Q</h2><p>A</p> FAQ into schema.org FAQPage —
    Google's FAQ rich results give tool pages extra SERP real estate."""
    pairs = re.findall(r"<h2>(.*?)</h2>\s*<p>(.*?)</p>", faq_html, re.S)
    strip = lambda h: re.sub(r"<[^>]+>", "", h).strip()
    qa = [(strip(q), strip(a)) for q, a in pairs if strip(q) and strip(a)]
    if not qa:
        return None
    return {
        "@context": "https://schema.org", "@type": "FAQPage",
        "inLanguage": lang,
        "mainEntity": [{
            "@type": "Question", "name": q,
            "acceptedAnswer": {"@type": "Answer", "text": a},
        } for q, a in qa],
    }


def seo_head(en_url: str, tr_url: str, own_url: str,
             title: str = "", desc: str = "", lang: str = "en",
             app_name: str = "", faq_html: str = "") -> str:
    """Canonical + hreflang + OpenGraph/Twitter cards + JSON-LD (distribution layer)."""
    parts = [
        f'<link rel="canonical" href="{own_url}">',
        f'<link rel="alternate" hreflang="en" href="{en_url}">',
        f'<link rel="alternate" hreflang="tr" href="{tr_url}">',
        f'<link rel="alternate" hreflang="x-default" href="{en_url}">',
        '<meta property="og:site_name" content="Aporizma">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{own_url}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:image" content="{BASE}assets/og.png">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    if app_name:  # tool pages: schema.org WebApplication for rich results
        ld = json.dumps({
            "@context": "https://schema.org", "@type": "WebApplication",
            "name": app_name, "url": own_url, "description": desc,
            "applicationCategory": "UtilityApplication", "operatingSystem": "Any",
            "inLanguage": lang, "isAccessibleForFree": True,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        }, ensure_ascii=False)
        parts.append(f'<script type="application/ld+json">{ld}</script>')
    if faq_html:
        faq = faq_ld(faq_html, lang)
        if faq:
            parts.append('<script type="application/ld+json">'
                         + json.dumps(faq, ensure_ascii=False) + "</script>")
    return "\n".join(parts)


def main() -> None:
    layout = (ORGANS / "layout.html").read_text(encoding="utf-8")

    assets = ROOT / "assets"
    assets.mkdir(exist_ok=True)
    shutil.copy2(ORGANS / "organ.css", assets / "organ.css")
    shutil.copy2(ORGANS / "organ.js", assets / "organ.js")

    # Once tum hucreleri oku (ilgili-araclar bloklari tam listeyi ister),
    # sonra sayfalari bas.
    cells, bodies = [], {}
    for cell_dir in sorted(CELLS.iterdir()):
        if not (cell_dir / "cell.json").exists():
            continue
        cell = json.loads((cell_dir / "cell.json").read_text(encoding="utf-8"))
        cell["_dir"] = cell_dir
        bodies[cell["id"]] = (cell_dir / "body.html").read_text(encoding="utf-8")
        cells.append(cell)

    for cell in cells:
        cell_dir = cell["_dir"]
        body = bodies[cell["id"]]
        for lang in ("en", "tr"):
            s = cell[lang]
            other = cell[LANGS[lang]["other"]]
            out_dir = ROOT / s["slug"]
            out_dir.mkdir(parents=True, exist_ok=True)
            root = rel_root(s["slug"])

            script_extra = ""
            if (cell_dir / "cell.js").exists():
                shutil.copy2(cell_dir / "cell.js", out_dir / "tool.js")
                ui_strings = {k: v for k, v in s.items()
                              if k not in ("slug", "title", "desc", "faq_html")}
                vendor_tags = "".join(
                    f'<script src="{root}assets/{v}"></script>\n'
                    for v in cell.get("vendor", []))
                script_extra = (vendor_tags
                                + "<script>window.CELL_STRINGS = "
                                + json.dumps(ui_strings, ensure_ascii=False)
                                + ";</script>\n<script src=\"tool.js\"></script>")

            en_url = BASE + cell["en"]["slug"] + "/"
            tr_url = BASE + cell["tr"]["slug"] + "/"
            page = render(layout, {
                "lang": lang,
                "title": s["title"],
                "desc": s["desc"],
                "root": root,
                "home": root + LANGS[lang]["home"],
                "alt_url": root + other["slug"] + "/",
                "alt_lang": LANGS[lang]["other"],
                "alt_label": LANGS[lang]["switch_label"],
                "privacy_label": LANGS[lang]["privacy_label"],
                "about_label": LANGS[lang]["about_label"],
                "head_extra": seo_head(en_url, tr_url, BASE + s["slug"] + "/",
                                       title=s["title"], desc=s["desc"], lang=lang,
                                       app_name=s["card_title"],
                                       faq_html=s.get("faq_html", "")),
                "body": stamp_strings(body, s)
                        + related_html(cell, cells, lang, root),
                "foot_line": LANGS[lang]["foot"],
                "script_extra": script_extra,
            })
            (out_dir / "index.html").write_text(page, encoding="utf-8")

    # Home pages list every living cell in demand order.
    cells.sort(key=_rank)

    for lang in ("en", "tr"):
        cfg = LANGS[lang]
        root = "" if lang == "en" else "../"
        items = "\n".join(
            f'<li><a href="{root}{c[lang]["slug"]}/"><div class="card">'
            f'<h2>{c[lang]["card_title"]}</h2><p>{c[lang]["card_desc"]}</p>'
            f"</div></a></li>"
            for c in cells
        )
        body = (f'<h1>{cfg["home_h1"]}</h1><p class="lede">{cfg["home_lede"]}</p>'
                f'<ul class="tool-grid">{items}</ul>')
        out_dir = ROOT if lang == "en" else ROOT / "tr"
        out_dir.mkdir(exist_ok=True)
        page = render(layout, {
            "lang": lang,
            "title": cfg["home_title"],
            "desc": cfg["home_desc"],
            "root": root,
            "home": root + cfg["home"],
            "alt_url": ("tr/" if lang == "en" else "../"),
            "alt_lang": cfg["other"],
            "alt_label": cfg["switch_label"],
            "privacy_label": cfg["privacy_label"],
            "about_label": cfg["about_label"],
            "head_extra": seo_head(BASE, BASE + "tr/",
                                   BASE if lang == "en" else BASE + "tr/",
                                   title=cfg["home_title"], desc=cfg["home_desc"],
                                   lang=lang),
            "body": body,
            "foot_line": cfg["foot"],
            "script_extra": "",
        })
        (out_dir / "index.html").write_text(page, encoding="utf-8")

    # Sitemap + robots (queen-caste plumbing: every page, both languages).
    urls = [BASE, BASE + "tr/"]
    for c in cells:
        urls += [BASE + c["en"]["slug"] + "/", BASE + c["tr"]["slug"] + "/"]
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
               + "\n</urlset>\n")
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n", encoding="utf-8")

    emit_app_layer(cells)
    print(f"montaj tamam: {len(cells)} hücre x 2 dil + 2 ana sayfa + sitemap + app katmanı")


def emit_app_layer(cells: list[dict]) -> None:
    """Uygulama katmanı: tools.json + /app yüzü + /share yönlendirici + sw.js v2.
    Her montajda yeniden üretilir → yeni hücreler uygulamaya otomatik akar."""
    # 1) tools.json — uygulama yüzü ve yönlendirici için veri
    # Doğum defteri: her hücrenin ilk görüldüğü tarih → "YENİ" rozetleri
    import datetime
    dogum_path = ROOT / "assets" / "dogum.json"
    dogum = json.loads(dogum_path.read_text(encoding="utf-8")) if dogum_path.exists() else {}
    today = datetime.date.today().isoformat()
    # İlk tohumlama: mevcut eski hücreler geçmiş tarihli olsun ki hepsi "YENİ" görünmesin.
    seed_date = today if dogum_path.exists() else "2026-07-15"
    gercek_yeniler = {"qr-oku", "belge-tara", "char-clean", "hash-gen"}
    for c in cells:
        dogum.setdefault(c["id"], today if c["id"] in gercek_yeniler else seed_date)
    dogum_path.write_text(json.dumps(dogum, ensure_ascii=False, indent=1), encoding="utf-8")

    tools = [{
        "id": c["id"], "category": c.get("category", ""),
        "added": dogum.get(c["id"], today),
        "tr": {"slug": c["tr"]["slug"], "title": c["tr"]["card_title"], "desc": c["tr"]["card_desc"]},
        "en": {"slug": c["en"]["slug"], "title": c["en"]["card_title"], "desc": c["en"]["card_desc"]},
    } for c in cells]
    (ROOT / "assets" / "tools.json").write_text(
        json.dumps(tools, ensure_ascii=False), encoding="utf-8")

    # 2) sw.js v2 — TAM önbellek (tüm araç sayfaları + tool.js + vendor) + share POST
    pre = ["/", "/tr/", "/app/", "/share/", "/assets/organ.css", "/assets/organ.js",
           "/assets/tools.json", "/manifest.webmanifest",
           "/assets/icons/icon-192.png", "/assets/icons/icon-512.png"]
    vendors = set()
    for c in cells:
        for lang in ("en", "tr"):
            pre.append("/" + c[lang]["slug"] + "/")
            if (c["_dir"] / "cell.js").exists():
                pre.append("/" + c[lang]["slug"] + "/tool.js")
        for v in c.get("vendor", []):
            vendors.add("/assets/" + v)
    pre += sorted(vendors)
    sw = (
        "/* Aporizma SW v2 (montaj uretir): TAM onbellek + share target. */\n"
        f"const VERSION = \"aporizma-v2-{len(pre)}\";\n"
        f"const PRECACHE = {json.dumps(pre)};\n"
        + """
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

  if (e.request.method === "POST" && url.pathname.replace(/\\/$/, "") === "/share") {
    e.respondWith(handleShare(e));
    return;
  }
  if (e.request.method !== "GET") return;

  if (url.pathname.startsWith("/share-inbox/")) {
    e.respondWith(caches.open("share-inbox").then((c) => c.match(url.pathname))
      .then((r) => r || new Response("", { status: 404 })));
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
""")
    (ROOT / "sw.js").write_text(sw, encoding="utf-8")

    # 3) /share yönlendirici — dosya türüne göre doğru araca
    route_map = {}
    by_id = {c["id"]: c for c in cells}
    def slug_of(cid):
        return "/" + by_id[cid]["tr"]["slug"] + "/" if cid in by_id else "/tr/"
    route_map = {
        "pdf": slug_of("pdf-merge"), "image": slug_of("img-resize"),
        "images": slug_of("belge-tara"), "subtitle": slug_of("srt-vtt"),
        "json": slug_of("json-format"), "csv": slug_of("csv-json"),
        "text": slug_of("word-count"), "qr_url": slug_of("qr-gen"),
    }
    share_dir = ROOT / "share"
    share_dir.mkdir(exist_ok=True)
    (share_dir / "index.html").write_text("""<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Aporizma — Paylaşılanı aç</title>
<link rel="stylesheet" href="/assets/organ.css">
</head><body>
<main class="wrap" style="padding:24px 16px;text-align:center">
<h1 style="font-size:1.3rem">Paylaşılan içerik alınıyor…</h1>
<p id="durum" class="lede">Doğru araca yönlendiriliyorsun.</p>
</main>
<script>
const ROUTES = """ + json.dumps(route_map, ensure_ascii=False) + """;
function routeOf(meta) {
  if (meta.files && meta.files.length) {
    const f = meta.files[0];
    const n = (f.name || "").toLowerCase();
    const t = (f.type || "").toLowerCase();
    const allImg = meta.files.every((x) => (x.type || "").startsWith("image/"));
    if (meta.files.length > 1 && allImg) return ROUTES.images; // çoklu görsel → Belge Tara (PDF yap)
    if (t.includes("pdf") || n.endsWith(".pdf")) return ROUTES.pdf;
    if (t.startsWith("image/")) return ROUTES.image;
    if (n.endsWith(".srt") || n.endsWith(".vtt")) return ROUTES.subtitle;
    if (t.includes("json") || n.endsWith(".json")) return ROUTES.json;
    if (n.endsWith(".csv")) return ROUTES.csv;
    return ROUTES.text;
  }
  const extra = meta.extra || {};
  if (extra.url || /^https?:\\/\\//.test(extra.text || "")) return ROUTES.qr_url;
  return ROUTES.text;
}
fetch("/share-inbox/meta").then(r => r.ok ? r.json() : null).then(meta => {
  if (!meta) { document.getElementById("durum").textContent = "Paylaşılan içerik bulunamadı."; return; }
  const dest = routeOf(meta) + "?paylasilan=1";
  location.replace(dest);
}).catch(() => { document.getElementById("durum").textContent = "Bir sorun oluştu."; });
</script>
</body></html>""", encoding="utf-8")

    # 4) /app v2 — alt gezinmeli uygulama yüzü (şablon: organs/app_v2.html)
    app_dir = ROOT / "app"
    app_dir.mkdir(exist_ok=True)
    (app_dir / "index.html").write_text(
        (ORGANS / "app_v2.html").read_text(encoding="utf-8"), encoding="utf-8")


if __name__ == "__main__":
    main()
