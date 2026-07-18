# Chrome Web Store listing — Aporizma Translate v0.1.0

## Store fields (copy-paste)

**Category:** Productivity → Tools
**Language:** English (Türkçe listing auto-served via _locales)

**Summary (short, EN):**
Translate selected text or whole SRT/VTT subtitles with your own free Gemini key. Private by design — no servers.

**Description (EN):**
Aporizma Translate turns your own free Gemini API key into a private translator.

- Select text on any page → right-click → "Translate selection with Aporizma"
- Or paste a whole SRT/VTT subtitle file into the popup: timing stays untouched,
  only the text lines are translated (40-line batches, subtitle-aware prompting)
- 12 target languages
- BYOK (bring your own key): get a free key at aistudio.google.com/app/apikey

Privacy: your key and your text travel directly from YOUR browser to Google's
API. Aporizma has no server, no analytics, no tracking. The key is stored in
chrome.storage.local on your device only.

By the makers of aporizma.com — small, fast, privacy-respecting web tools.

**Description (TR):**
Aporizma Çeviri, kendi ücretsiz Gemini API anahtarını özel bir çevirmene dönüştürür.

- Herhangi bir sayfada metni seç → sağ tık → "Seçimi Aporizma ile çevir"
- Ya da popup'a komple SRT/VTT altyazı dosyası yapıştır: zamanlama hiç bozulmaz,
  yalnız metin satırları çevrilir (40'lık partiler, altyazıya özel komutlama)
- 12 hedef dil
- BYOK (kendi anahtarını getir): ücretsiz anahtar aistudio.google.com/app/apikey

Gizlilik: anahtarın ve metnin SENİN tarayıcından doğrudan Google API'sine gider.
Aporizma'nın sunucusu, analitiği, izleyicisi yok. Anahtar yalnız cihazında
chrome.storage.local içinde durur.

## Privacy tab answers

- Single purpose: "Translate user-selected text and subtitle files using the
  user's own Gemini API key."
- Permission justifications:
  - contextMenus: adds the right-click "Translate selection" item.
  - storage: stores the user's API key and language preference locally.
  - host generativelanguage.googleapis.com: the only network call — the
    translation request to Google's API with the user's own key.
- Data usage: does NOT collect or transmit any user data to the developer.
  Remote code: none.

## Publish steps (user, ~5 min)

1. chrome.google.com/webstore/devconsole → New item → upload
   `aporizma-translate-v0.1.0.zip` (Desktop'ta).
2. Listing alanlarını yukarıdan yapıştır; store-assets/screenshot-1.png yükle.
3. Privacy tab: yukarıdaki cevaplar; "no data collected" işaretle.
4. Submit for review (incelenme tipik 1-7 gün).

## Pre-submit local test (user, 2 min)

chrome://extensions → Developer mode ON → "Load unpacked" →
`C:\Users\abdul\Desktop\aporizma\soldiers\ceviri` klasörünü seç →
Options'ta ücretsiz anahtarını gir → bir sayfada metin seçip sağ-tık çevir +
popup'a bir SRT yapıştır. İkisi de çalışıyorsa mağazaya yükle.
