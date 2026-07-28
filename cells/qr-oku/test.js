const assert = require("assert");
const { detectType } = require("./cell.js");

// URL algilama — http ve https.
assert.strictEqual(detectType("https://aporizma.com"), "url");
assert.strictEqual(detectType("http://example.com/x?y=1"), "url");

// Ozel QR turleri.
assert.strictEqual(detectType("WIFI:T:WPA;S:EvAgi;P:sifre123;;"), "wifi");
assert.strictEqual(detectType("mailto:test@example.com"), "email");
assert.strictEqual(detectType("tel:+905551112233"), "tel");

// Duz metin ve kenar durumlari.
assert.strictEqual(detectType("merhaba dunya"), "text");
assert.strictEqual(detectType(""), "text");
assert.strictEqual(detectType("  https://bosluklu.com  "), "url");
// buyuk/kucuk harf duyarsiz sema
assert.strictEqual(detectType("HTTPS://BUYUK.COM"), "url");
assert.strictEqual(detectType("wifi:t:wpa;s:x;p:y;;"), "wifi");

console.log("qr-oku: ok");
