const assert = require("assert");
const { truncateTitle, MOBILE_VISIBLE } = require("./cell.js");

assert.strictEqual(MOBILE_VISIBLE, 65);

// Short titles pass through untouched.
assert.strictEqual(truncateTitle("Kısa başlık"), "Kısa başlık");

// Exactly at the limit: untouched.
const exact = "a".repeat(65);
assert.strictEqual(truncateTitle(exact), exact);

// Over the limit: cut + ellipsis, no trailing space before the dots.
const long = "Word ".repeat(20); // 100 chars
const cut = truncateTitle(long);
assert.ok(cut.endsWith("..."));
assert.ok(cut.length <= 68);
assert.ok(!cut.includes(" ..."));

// Turkish characters count as single chars.
const tr = "Ö".repeat(70);
assert.strictEqual(truncateTitle(tr), "Ö".repeat(65) + "...");

// Custom limit works.
assert.strictEqual(truncateTitle("abcdef", 3), "abc...");
console.log("yt-preview: OK");
