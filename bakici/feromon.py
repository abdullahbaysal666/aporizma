"""Feromon toplayici v1: Search Console'dan koloni sinyallerini ceker.

Son 7 gunun sayfa-bazli tiklama/gorunum/pozisyonunu ve en iyi sorgulari alir,
feromon-log.jsonl'e yazar, Telegram'a kisa nabiz mesaji atar.
Kullanim: python bakici/feromon.py
"""
import json
import os
from datetime import date, timedelta
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

ROOT = Path(__file__).resolve().parent.parent
# RTD: telegram token dosyalarinin bulundugu strateji reposu. Yerelde Windows
# yolu; droplet/bulut icin APORIZMA_RTD ortam degiskeni ile ezilir.
RTD = Path(os.environ.get("APORIZMA_RTD", r"C:\Users\abdul\Desktop\youtubestilspeking"))
if not RTD.exists():
    RTD = ROOT
TOKEN_FILE = ROOT / "gsc-token.json"
LOG = ROOT / "feromon-log.jsonl"
SITE = "https://aporizma.com/"
SCOPES = ["https://www.googleapis.com/auth/webmasters",
          "https://www.googleapis.com/auth/siteverification"]


def creds() -> Credentials:
    c = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if c.expired and c.refresh_token:
        c.refresh(Request())
        TOKEN_FILE.write_text(c.to_json(), encoding="utf-8")
    return c


def query(h: dict, dimensions: list[str], limit: int) -> list[dict]:
    quoted = requests.utils.quote(SITE, safe="")
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=7)
    r = requests.post(
        f"https://www.googleapis.com/webmasters/v3/sites/{quoted}/searchAnalytics/query",
        json={"startDate": start.isoformat(), "endDate": end.isoformat(),
              "dimensions": dimensions, "rowLimit": limit},
        headers=h, timeout=60)
    r.raise_for_status()
    return r.json().get("rows", [])


def telegram(text: str) -> None:
    try:
        token = (RTD / "telegram-token.txt").read_text(encoding="utf-8").strip()
        chat = (RTD / "telegram-chat-id.txt").read_text(encoding="utf-8").strip()
        requests.post(f"https://api.telegram.org/bot{token}/sendMessage",
                      json={"chat_id": chat, "text": text}, timeout=30)
    except Exception as e:  # noqa: BLE001 — telemetri asla nabzi oldurmez
        print(f"telegram gonderilemedi: {e}")


def main() -> None:
    h = {"Authorization": f"Bearer {creds().token}"}
    pages = query(h, ["page"], 100)
    queries = query(h, ["query"], 20)

    entry = {"date": date.today().isoformat(),
             "totals": {"clicks": sum(r["clicks"] for r in pages),
                        "impressions": sum(r["impressions"] for r in pages)},
             "pages": [{"page": r["keys"][0], "clicks": r["clicks"],
                        "impressions": r["impressions"],
                        "position": round(r["position"], 1)} for r in pages],
             "queries": [{"q": r["keys"][0], "clicks": r["clicks"],
                          "impressions": r["impressions"]} for r in queries]}
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    t = entry["totals"]
    lines = [f"FEROMON (7g): {t['clicks']} tik, {t['impressions']} gorunum"]
    if pages:
        lines.append("En iyi sayfalar:")
        for p in sorted(pages, key=lambda x: -x["impressions"])[:5]:
            path = p["keys"][0].replace(SITE, "/")
            lines.append(f"  {path}: {p['clicks']}t/{p['impressions']}g poz{p['position']:.0f}")
    else:
        lines.append("Henuz arama verisi yok (kum havuzu — beklenen).")
    if queries:
        lines.append("Sorgular: " + ", ".join(q["keys"][0] for q in queries[:5]))
    msg = "\n".join(lines)
    print(msg)
    telegram("[APORIZMA] " + msg)


if __name__ == "__main__":
    main()
