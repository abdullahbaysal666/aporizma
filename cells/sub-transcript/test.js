const assert = require("assert");
const { detectFormat, extractTranscript } = require("./cell.js");

// 1. Basic SRT, two cues, index+timestamp stripped.
const srt = "1\n00:00:01,000 --> 00:00:03,500\nHello world\n\n2\n00:00:04,000 --> 00:00:06,000\nSecond line\n";
assert.strictEqual(detectFormat(srt), "srt");
const r1 = extractTranscript(srt, false);
assert.strictEqual(r1.format, "srt");
assert.strictEqual(r1.text, "Hello world Second line");
assert.strictEqual(r1.cueCount, 2);
assert.strictEqual(r1.wordCount, 4);

// 2. Basic VTT, two cues with a cue-settings timestamp line.
const vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000 align:start position:0%\nMerhaba dunya\n\n00:00:04.000 --> 00:00:06.000\nIkinci satir\n";
const r2 = extractTranscript(vtt, false);
assert.strictEqual(r2.format, "vtt");
assert.strictEqual(r2.text, "Merhaba dunya Ikinci satir");
assert.strictEqual(r2.cueCount, 2);

// 3. Invalid input (no --> timestamps at all).
assert.strictEqual(detectFormat("just some random text"), null);
assert.strictEqual(extractTranscript("just some random text", true), null);

// 4. Empty input.
assert.strictEqual(extractTranscript("", true), null);

// 5. Multi-line cue text joined with a single space.
const multi = "1\n00:00:01,000 --> 00:00:03,000\nLine one\nLine two\n";
const r5 = extractTranscript(multi, false);
assert.strictEqual(r5.text, "Line one Line two");

// 6. HTML/VTT tags and YouTube word-timing tags stripped.
const tagged = "WEBVTT\n\n00:00:00.960 --> 00:00:03.290 align:start position:0%\nthis is a<00:00:01.200><c> test</c><00:00:01.500><c> of</c> tags\n\n00:00:04.000 --> 00:00:05.000\n<i>italic</i> and <b>bold</b>\n";
const r6 = extractTranscript(tagged, false);
assert.strictEqual(r6.text, "this is a test of tags italic and bold");

// 7. Consecutive duplicate cues deduped (rolling auto-captions), independent cues kept.
const dup = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nAynı satır\n\n00:00:02.000 --> 00:00:03.000\nAynı satır\n\n00:00:03.000 --> 00:00:04.000\nFarklı satır\n\n00:00:04.000 --> 00:00:05.000\nAynı satır\n";
const r7 = extractTranscript(dup, true);
assert.strictEqual(r7.text, "Aynı satır Farklı satır Aynı satır");
assert.strictEqual(r7.cueCount, 3);
const r7nodedupe = extractTranscript(dup, false);
assert.strictEqual(r7nodedupe.cueCount, 4);

// 8. NOTE/STYLE blocks in VTT are skipped, Turkish characters preserved.
const noted = "WEBVTT\n\nNOTE bu bir açıklamadır\n\nSTYLE\n::cue { color: yellow; }\n\n00:00:01.000 --> 00:00:02.000\nÇöğüşıİ test\n";
const r8 = extractTranscript(noted, false);
assert.strictEqual(r8.cueCount, 1);
assert.strictEqual(r8.text, "Çöğüşıİ test");

console.log("sub-transcript: OK");
