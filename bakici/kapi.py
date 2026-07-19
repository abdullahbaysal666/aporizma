"""Kalite kapisi: yayin oncesi tum otomatik denetimler tek komutta.

Yakaladigi hata siniflari (her biri sahada bir kez elle yakalandi, artik otomatik):
1. Islenmemis sablon kaliplari ({{s.h1}} vakasi) — uretilmis HTML'de {{ }} kalintisi
2. SEO metin sinirlari — title <= 65, meta description 50..160 karakter
3. Kirik hucre mantigi — tum cells/*/test.js kosulur
4. Montaj tutarliligi — sitemap'teki her URL diskte var mi
Kullanim: python bakici/kapi.py   (cikis kodu 0 = kapidan gecti)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAILS: list[str] = []


def fail(msg: str) -> None:
    FAILS.append(msg)
    print(f"  KAPI RED: {msg}")


def check_cells() -> None:
    """Hucre butunlugu: 4 dosya tam mi, en/tr anahtarlari esit mi, body
    kaliplari karsiliksiz mi? (Gece ajaninin olasi hatalarini montaj'dan
    ONCE, anlasilir mesajla yakalar.)"""
    for cell_dir in sorted((ROOT / "cells").iterdir()):
        if not cell_dir.is_dir():
            continue
        cid = cell_dir.name
        for f in ("cell.json", "body.html", "cell.js", "test.js"):
            if not (cell_dir / f).exists():
                fail(f"eksik dosya: cells/{cid}/{f}")
        if not (cell_dir / "cell.json").exists():
            continue
        try:
            cell = json.loads((cell_dir / "cell.json").read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            fail(f"bozuk cell.json: cells/{cid} — {e}")
            continue
        en, tr = set(cell.get("en", {})), set(cell.get("tr", {}))
        for missing in sorted(en ^ tr):
            side = "tr" if missing in en else "en"
            fail(f"anahtar esitsizligi: cells/{cid} — '{missing}' {side} blokta yok")
        if (cell_dir / "body.html").exists():
            body = (cell_dir / "body.html").read_text(encoding="utf-8")
            used = set(re.findall(r"\{\{s\.([a-z0-9_]+)\}\}", body))
            for key in sorted(used - en):
                fail(f"body'de var, cell.json'da yok: cells/{cid} — {{{{s.{key}}}}}")


def main() -> int:
    check_cells()
    if FAILS:  # hucre butunlugu bozuksa montaj zaten coker; erken cik
        return finish()

    # 0. Montaj temiz kosmali.
    r = subprocess.run([sys.executable, "montaj.py"], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        fail(f"montaj coktu: {r.stderr.strip()[:200]}")
        return finish()

    # 1. Hucre testleri.
    for test in sorted(ROOT.glob("cells/*/test.js")):
        r = subprocess.run(["node", str(test)], cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            fail(f"test kirik: {test.parent.name} — {(r.stderr or r.stdout).strip()[:200]}")

    # 2. Uretilmis HTML'de islenmemis sablon + SEO sinirlari.
    pages = [ROOT / "index.html", ROOT / "tr" / "index.html",
             *ROOT.glob("tools/*/index.html"), *ROOT.glob("tr/araclar/*/index.html"),
             ROOT / "privacy" / "index.html"]
    for page in pages:
        if not page.exists():
            continue
        html = page.read_text(encoding="utf-8")
        rel = page.relative_to(ROOT)
        if "{{" in html:
            snippet = html[html.index("{{"):html.index("{{") + 30]
            fail(f"islenmemis sablon: {rel} -> {snippet!r}")
        m = re.search(r"<title>([^<]*)</title>", html)
        if not m or not m.group(1).strip():
            fail(f"title yok: {rel}")
        elif len(m.group(1)) > 65:
            fail(f"title {len(m.group(1))} karakter (>65): {rel}")
        d = re.search(r'<meta name="description" content="([^"]*)"', html)
        if not d or not (50 <= len(d.group(1)) <= 160):
            n = len(d.group(1)) if d else 0
            fail(f"meta description {n} karakter (50-160 disi): {rel}")

    # 3. Sitemap'teki her URL diskte karsiligini bulmali.
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    for url in re.findall(r"<loc>([^<]+)</loc>", sitemap):
        path = url.replace("https://aporizma.com/", "").rstrip("/")
        target = ROOT / path / "index.html" if path else ROOT / "index.html"
        if not target.exists():
            fail(f"sitemap'te var, diskte yok: {url}")

    return finish()


def finish() -> int:
    if FAILS:
        print(f"\nKAPI KAPALI: {len(FAILS)} sorun")
        return 1
    print("KAPI ACIK: tum denetimler gecti")
    return 0


if __name__ == "__main__":
    sys.exit(main())
