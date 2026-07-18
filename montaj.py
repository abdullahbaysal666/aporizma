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

LANGS = {
    "en": {"other": "tr", "switch_label": "Türkçe", "home": "",
           "foot": "handcrafted small tools that run entirely in your browser. No uploads, no tracking.",
           "home_title": "Aporizma — small, fast, private web tools",
           "home_desc": "A growing collection of free tools that run entirely in your browser: subtitles, calculators, converters and more. No uploads, no sign-ups.",
           "home_h1": "Small tools, done right.",
           "home_lede": "Every Aporizma tool runs entirely in your browser — your files and data never leave your device."},
    "tr": {"other": "en", "switch_label": "English", "home": "tr/",
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


def main() -> None:
    layout = (ORGANS / "layout.html").read_text(encoding="utf-8")

    assets = ROOT / "assets"
    assets.mkdir(exist_ok=True)
    shutil.copy2(ORGANS / "organ.css", assets / "organ.css")
    shutil.copy2(ORGANS / "organ.js", assets / "organ.js")

    cells = []
    for cell_dir in sorted(CELLS.iterdir()):
        if not (cell_dir / "cell.json").exists():
            continue
        cell = json.loads((cell_dir / "cell.json").read_text(encoding="utf-8"))
        body = (cell_dir / "body.html").read_text(encoding="utf-8")
        cells.append(cell)

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
                script_extra = ("<script>window.CELL_STRINGS = "
                                + json.dumps(ui_strings, ensure_ascii=False)
                                + ";</script>\n<script src=\"tool.js\"></script>")

            page = render(layout, {
                "lang": lang,
                "title": s["title"],
                "desc": s["desc"],
                "root": root,
                "home": root + LANGS[lang]["home"],
                "alt_url": root + other["slug"] + "/",
                "alt_lang": LANGS[lang]["other"],
                "alt_label": LANGS[lang]["switch_label"],
                "head_extra": "",
                "body": stamp_strings(body, s),
                "foot_line": LANGS[lang]["foot"],
                "script_extra": script_extra,
            })
            (out_dir / "index.html").write_text(page, encoding="utf-8")

    # Home pages list every living cell.
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
            "head_extra": "",
            "body": body,
            "foot_line": cfg["foot"],
            "script_extra": "",
        })
        (out_dir / "index.html").write_text(page, encoding="utf-8")

    print(f"montaj tamam: {len(cells)} hücre x 2 dil + 2 ana sayfa")


if __name__ == "__main__":
    main()
