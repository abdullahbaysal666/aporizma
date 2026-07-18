"""Search Console kurulumu (tek seferlik): OAuth -> site dogrulama -> sitemap.

Kullanim: python bakici/gsc_setup.py
1) Tarayici acilir, kullanici Google hesabiyla "Izin ver" der (tek adim).
2) Site Verification API'den dosya jetonu alinir, repo koküne yazilir,
   push edilir, Pages yayini beklenir, dogrulama tetiklenir.
3) Search Console'a mulk eklenir + sitemap gonderilir.
Token aporizma repo disinda tutulur (gsc-token.json, gitignore'da).
"""
import json
import subprocess
import sys
import time
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = Path(__file__).resolve().parent.parent
CLIENT_SECRETS = Path(r"C:\Users\abdul\Desktop\youtubestilspeking\youtube-oauth-client.json")
TOKEN_FILE = ROOT / "gsc-token.json"
SCOPES = [
    "https://www.googleapis.com/auth/siteverification",
    "https://www.googleapis.com/auth/webmasters",
]
SITE = "https://aporizma.com/"


def creds() -> Credentials:
    if TOKEN_FILE.exists():
        c = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if c.expired and c.refresh_token:
            c.refresh(Request())
            TOKEN_FILE.write_text(c.to_json(), encoding="utf-8")
        return c
    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS), SCOPES)
    c = flow.run_local_server(port=0, prompt="consent")
    TOKEN_FILE.write_text(c.to_json(), encoding="utf-8")
    return c


def main() -> None:
    c = creds()
    h = {"Authorization": f"Bearer {c.token}"}

    # 1) Dosya-jetonu al ve siteye koy.
    r = requests.post(
        "https://www.googleapis.com/siteVerification/v1/token",
        json={"site": {"identifier": SITE, "type": "SITE"}, "verificationMethod": "FILE"},
        headers=h, timeout=30)
    r.raise_for_status()
    token = r.json()["token"]  # "google123abc.html"
    marker = ROOT / token
    marker.write_text(f"google-site-verification: {token}", encoding="utf-8")
    print("jeton dosyasi:", token)

    subprocess.run(["git", "add", token], cwd=ROOT, check=True)
    diff = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT)
    if diff.returncode != 0:
        subprocess.run(["git", "commit", "-m", "Search Console site verification file"],
                       cwd=ROOT, check=True)
        subprocess.run(["git", "push"], cwd=ROOT, check=True)

    # 2) Pages yayinini bekle.
    url = SITE + token
    for _ in range(40):
        if requests.get(url, timeout=20).status_code == 200:
            print("jeton canli:", url)
            break
        time.sleep(15)
    else:
        sys.exit("jeton dosyasi yayina girmedi")

    # 3) Dogrula + mulku ekle + sitemap gonder.
    r = requests.post(
        "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE",
        json={"site": {"identifier": SITE, "type": "SITE"}}, headers=h, timeout=60)
    r.raise_for_status()
    print("DOGRULANDI:", r.json().get("id"))

    quoted = requests.utils.quote(SITE, safe="")
    requests.put(f"https://www.googleapis.com/webmasters/v3/sites/{quoted}",
                 headers=h, timeout=30).raise_for_status()
    print("Search Console mulku eklendi")
    requests.put(
        f"https://www.googleapis.com/webmasters/v3/sites/{quoted}/sitemaps/"
        + requests.utils.quote(SITE + "sitemap.xml", safe=""),
        headers=h, timeout=30).raise_for_status()
    print("sitemap gonderildi")


if __name__ == "__main__":
    main()
