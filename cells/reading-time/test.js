const assert = require("assert");
const {
  countWords,
  ratesFor,
  estimateTime,
  analyzeText,
  RATES,
} = require("./cell.js");

// Empty input.
assert.strictEqual(countWords(""), 0);
assert.strictEqual(countWords("   \n  "), 0);

// Basic word count, Turkish characters counted correctly.
const tr = "İstanbul'da güneşli bir gün, çiçekler açtı bugün.";
assert.strictEqual(countWords(tr), 7);

// Unknown language falls back to English rates.
assert.deepStrictEqual(ratesFor("fr"), RATES.en);
assert.deepStrictEqual(ratesFor("tr"), RATES.tr);

// estimateTime: exact minute boundary.
const t1 = estimateTime(200, 200);
assert.strictEqual(t1.minutes, 1);
assert.strictEqual(t1.seconds, 0);
assert.strictEqual(t1.totalSeconds, 60);

// estimateTime: sub-minute rounding.
const t2 = estimateTime(50, 200);
assert.strictEqual(t2.minutes, 0);
assert.strictEqual(t2.seconds, 15);

// estimateTime: zero words.
const t3 = estimateTime(0, 200);
assert.strictEqual(t3.totalSeconds, 0);
assert.strictEqual(t3.minutes, 0);
assert.strictEqual(t3.seconds, 0);

// analyzeText: English defaults, reading faster than speaking.
const en = analyzeText("one two three four five six seven eight nine ten", "en");
assert.strictEqual(en.words, 10);
assert.strictEqual(en.lang, "en");
assert.ok(en.reading.totalSeconds <= en.speaking.totalSeconds);
assert.strictEqual(en.rates.reading, 200);
assert.strictEqual(en.rates.speaking, 130);

// analyzeText: Turkish uses its own (slower) rates.
const trStats = analyzeText(tr, "tr");
assert.strictEqual(trStats.lang, "tr");
assert.strictEqual(trStats.rates.reading, 180);
assert.strictEqual(trStats.rates.speaking, 120);

// analyzeText: invalid/missing language falls back to English.
const fallback = analyzeText("hello world", "xx");
assert.strictEqual(fallback.lang, "en");

// analyzeText: empty text yields zero everywhere.
const empty = analyzeText("", "en");
assert.strictEqual(empty.words, 0);
assert.strictEqual(empty.reading.totalSeconds, 0);
assert.strictEqual(empty.speaking.totalSeconds, 0);

// Longer text yields proportionally longer reading time than speaking-rate-only comparison.
const longText = Array(400).fill("kelime").join(" ");
const longStats = analyzeText(longText, "tr");
assert.strictEqual(longStats.words, 400);
assert.strictEqual(longStats.reading.totalSeconds, Math.round((400 / 180) * 60));
assert.strictEqual(longStats.speaking.totalSeconds, Math.round((400 / 120) * 60));

console.log("reading-time: OK");
