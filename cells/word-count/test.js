const assert = require("assert");
const {
  countWords,
  countChars,
  countCharsNoSpaces,
  countSentences,
  countParagraphs,
  readingTime,
  analyzeText,
} = require("./cell.js");

// Empty input.
assert.strictEqual(countWords(""), 0);
assert.strictEqual(countChars(""), 0);
assert.strictEqual(countSentences(""), 0);
assert.strictEqual(countParagraphs(""), 0);
assert.strictEqual(countWords("   \n  "), 0);

// Basic word/char counts.
assert.strictEqual(countWords("Merhaba dünya"), 2);
assert.strictEqual(countChars("Merhaba dünya"), 13);
assert.strictEqual(countCharsNoSpaces("Merhaba dünya"), 12);

// Turkish characters counted correctly (ı, ş, ğ, ü, ö, ç, İ).
const tr = "İstanbul'da güneşli bir gün, çiçekler açtı.";
assert.strictEqual(countWords(tr), 6);
assert.strictEqual(countChars(tr), Array.from(tr).length);

// Sentence counting: three sentences, combined punctuation counts as one.
const sentences = "Merhaba! Nasılsın? İyiyim.";
assert.strictEqual(countSentences(sentences), 3);
assert.strictEqual(countSentences("Ne oluyor?!"), 1);

// No terminal punctuation still counts as one sentence.
assert.strictEqual(countSentences("Bitmemiş bir cümle"), 1);

// Paragraph counting via blank lines.
const paragraphs = "Birinci paragraf.\n\nİkinci paragraf.\n\n\nÜçüncü paragraf.";
assert.strictEqual(countParagraphs(paragraphs), 3);
assert.strictEqual(countParagraphs("Tek paragraf, tek satır."), 1);

// Reading time: 200 wpm baseline.
const rt1 = readingTime(200);
assert.strictEqual(rt1.minutes, 1);
assert.strictEqual(rt1.seconds, 0);
const rt2 = readingTime(50);
assert.strictEqual(rt2.minutes, 0);
assert.strictEqual(rt2.seconds, 15);
const rt0 = readingTime(0);
assert.strictEqual(rt0.totalSeconds, 0);

// Full analyze combines all stats consistently.
const full = analyzeText("Merhaba! Nasılsın?\n\nİyiyim, teşekkürler.");
assert.strictEqual(full.words, 4);
assert.strictEqual(full.sentences, 3);
assert.strictEqual(full.paragraphs, 2);
assert.strictEqual(full.reading.totalSeconds, Math.round((full.words / 200) * 60));

console.log("word-count: OK");
