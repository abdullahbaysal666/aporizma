const assert = require("assert");
const { detectSub, parseCues, mergeSubs, stamp } = require("./cell.js");

const A = "1\n00:00:01,000 --> 00:00:03,000\nBir\n\n2\n00:00:10,000 --> 00:00:12,000\nÜç\n";
const B = "1\n00:00:05,000 --> 00:00:07,000\nİki\n";
const V = "WEBVTT\n\nNOTE meta\n\n00:02.500 --> 00:04.000\nVTT satırı\n";

// Detection + parsing.
assert.strictEqual(detectSub(A), "srt");
assert.strictEqual(detectSub(V), "vtt");
assert.strictEqual(parseCues("düz metin"), null);
assert.strictEqual(parseCues(A).cues.length, 2);
assert.strictEqual(parseCues(V).cues[0].start, 2500);

// Chronological merge with renumbering; Turkish text preserved.
const m = mergeSubs(A, B);
assert.strictEqual(m.count, 3);
const lines = m.text.trim().split("\n\n");
assert.ok(lines[0].includes("Bir") && lines[1].includes("İki") && lines[2].includes("Üç"));
assert.ok(lines[1].startsWith("2\n"), "renumbered");

// Output format follows file A: SRT + VTT input -> SRT output with commas.
const mixed = mergeSubs(A, V);
assert.strictEqual(mixed.format, "srt");
assert.ok(mixed.text.includes("00:00:02,500 --> 00:00:04,000"));
assert.ok(!mixed.text.includes("WEBVTT"));

// VTT first -> VTT output with header and dots.
const v2 = mergeSubs(V, A);
assert.strictEqual(v2.format, "vtt");
assert.ok(v2.text.startsWith("WEBVTT\n\n"));
assert.ok(v2.text.includes("00:00:01.000 --> 00:00:03.000"));

// Invalid side -> null. Timestamp emitter pads correctly.
assert.strictEqual(mergeSubs(A, "bozuk"), null);
assert.strictEqual(stamp(3661005, "srt"), "01:01:01,005");
assert.strictEqual(stamp(500, "vtt"), "00:00:00.500");
console.log("srt-merge: OK");
