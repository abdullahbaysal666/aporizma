"""IndexNow ping: sitemap'teki tum URL'leri Bing/Yandex'e aninda bildirir.

Anahtar dosyasi repo kokunde (<key>.txt) — IndexNow protokolu geregi herkese acik.
Kullanim: python bakici/indexnow.py   (push sonrasi; bakici workflow da kosar)
"""
import json
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
KEY = "a7f3c9e1b5d24086ba9e17c4d3f8a250"
HOST = "aporizma.com"


def main() -> int:
    key_file = ROOT / f"{KEY}.txt"
    if not key_file.exists():
        key_file.write_text(KEY, encoding="ascii")
        print(f"anahtar dosyasi olusturuldu: {key_file.name}")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    if not urls:
        print("sitemap bos — ping atlanci")
        return 0

    body = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": f"https://{HOST}/{KEY}.txt",
        "urlList": urls,
    }).encode()
    req = Request("https://api.indexnow.org/indexnow", data=body,
                  headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urlopen(req, timeout=30) as r:
            print(f"IndexNow: {len(urls)} URL bildirildi (HTTP {r.status})")
    except Exception as e:  # noqa: BLE001 — dagitim sinyali asla derlemeyi kirmasin
        print(f"IndexNow ping basarisiz (kritik degil): {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
