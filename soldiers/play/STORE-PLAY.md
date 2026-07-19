# Google Play listing — Aporizma v1.0.0 (TWA)

## Yükleme adımları (kullanıcı, ~10 dk)

1. play.google.com/console → **Uygulama oluştur**: ad "Aporizma", varsayılan dil
   English (US), Uygulama, Ücretsiz.
2. **Üretim → Yeni sürüm** → Masaüstündeki `aporizma-v1.aab` dosyasını sürükle.
3. İlk yüklemede Play "Google tarafından imzalama"yı önerir → **kabul et**
   (App signing by Google Play). Sonra: **Kurulum → Uygulama imzalama**
   sayfasındaki **SHA-256 sertifika parmak izini** kopyala ve Claude'a gönder —
   assetlinks.json'a ekleyeceğim (adres çubuğu görünmemesi için şart).
4. Mağaza kaydını doldur (aşağıdaki metinler) + grafikler (aşağıda yolları).
5. İçerik derecelendirme anketi: şiddet yok, her yaş; Veri güvenliği: hiçbir
   veri toplanmıyor/paylaşılmıyor (hepsine Hayır). Gizlilik politikası URL:
   https://aporizma.com/privacy/
6. **İncelemeye gönder.**

## Mağaza metinleri

**Kısa açıklama (80):**
Free, private tools that run on your device: subtitles, QR, calculators.

**Tam açıklama:**
Aporizma is a collection of small, fast, privacy-first tools — everything runs
on your device, nothing is ever uploaded.

• Subtitle tools: convert SRT ↔ VTT, fix sync, merge files, extract transcripts
• QR code generator with sharp PNG export
• LLM API cost calculator, cron expression builder
• Public Domain Day calendar — which authors become free each year
• YouTube title & thumbnail preview for creators
…and new tools added continuously.

Why Aporizma?
✓ No sign-up, no account, no tracking, no ads (for now!)
✓ Works offline — your files never leave your device
✓ Both English and Turkish, fully localized
✓ Free forever

**TR açıklama (Play çeviri alanına):**
Aporizma; tamamı cihazınızda çalışan, hiçbir şeyi sunucuya yüklemeyen küçük ve
hızlı araçlar koleksiyonudur. Altyazı dönüştürme/senkron/birleştirme, QR kod
üretici, LLM maliyet hesaplayıcı, Kamu Malı Takvimi ve daha fazlası. Üyelik yok,
izleme yok, çevrimdışı çalışır.

## Grafikler

- Uygulama simgesi 512×512: `C:\Users\abdul\Desktop\aporizma\assets\icons\icon-512.png`
- Öne çıkan grafik 1024×500: `C:\Users\abdul\Desktop\aporizma\soldiers\play\feature.png` (üretilecek)
- Ekran görüntüleri (min 2, telefon): `soldiers\play\shot-*.png` (üretilecek)

## Teknik notlar

- Paket: com.aporizma.app · TWA (Trusted Web Activity) → aporizma.com
- Upload anahtarı: `C:\Users\abdul\Desktop\aporizma-twa\android.keystore`
  (alias: aporizma — YEDEĞİNİ AL; kaybı sürüm güncellemeyi imkânsızlaştırır)
- assetlinks.json: sitede /.well-known/ altında; upload-key parmak izi baştan
  ekli, Play imza parmak izi kullanıcıdan gelince eklenecek.
