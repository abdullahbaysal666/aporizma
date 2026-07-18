# Aporizma

Small, fast, privacy-respecting web tools that run entirely in your browser —
no uploads, no sign-ups, no tracking.

Küçük, hızlı, gizliliğe saygılı web araçları — tamamen tarayıcınızda çalışır;
yükleme yok, üyelik yok, izleme yok.

**Live:** https://aporizma.com (en route) · GitHub Pages in the meantime.

## Structure

- `organs/` — shared building blocks (layout, styles, helpers)
- `cells/` — one folder per tool: `cell.json` (bilingual strings), `body.html`, `cell.js`
- `montaj.py` — assembles cells into the static site (run `python montaj.py`)
- generated output lives at the repo root and is served by GitHub Pages
