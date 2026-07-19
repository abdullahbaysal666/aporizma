const assert = require("assert");
const qrlib = require("../../assets/vendor/qrcode.js");
const { qrMatrix } = require("./cell.js");

// Basic URL encodes into a valid, odd-sized matrix (QR spec: 21+4k modules).
const m = qrMatrix("https://aporizma.com", "M", qrlib);
assert.ok(m && m.count >= 21);
assert.strictEqual((m.count - 21) % 4, 0);

// Finder pattern corner: top-left module is always dark.
assert.strictEqual(m.isDark(0, 0), true);

// Deterministic: same input, same matrix.
const m2 = qrMatrix("https://aporizma.com", "M", qrlib);
assert.strictEqual(m.count, m2.count);
assert.strictEqual(m.isDark(10, 10), m2.isDark(10, 10));

// Higher ECC (same short input) never shrinks the matrix.
const l = qrMatrix("test", "L", qrlib);
const h = qrMatrix("test", "H", qrlib);
assert.ok(h.count >= l.count);

// Turkish characters survive (UTF-8 mode handled by the library).
assert.ok(qrMatrix("Türkçe ğüşıöç metin", "M", qrlib));

// Longer content grows the matrix.
const big = qrMatrix("x".repeat(500), "M", qrlib);
assert.ok(big && big.count > m.count);

// Absurd length at high ECC fails gracefully (null, no throw).
assert.strictEqual(qrMatrix("y".repeat(5000), "H", qrlib), null);
console.log("qr-gen: OK");
