const assert = require("assert");
const { shiftDetect, shiftSubtitles } = require("./cell.js");

const srt = "1\n00:00:01,000 --> 00:00:03,500\nHello\n";
assert.strictEqual(shiftDetect(srt), "srt");
const plus = shiftSubtitles(srt, 2.5);
assert.strictEqual(plus.format, "srt");
assert.ok(plus.text.includes("00:00:03,500 --> 00:00:06,000"));
assert.strictEqual(plus.cues, 1);

// Clamp below zero.
const minus = shiftSubtitles(srt, -10);
assert.ok(minus.text.includes("00:00:00,000 --> 00:00:00,000"));

// VTT with short timestamps keeps dot separator and gains full HH:MM:SS.
const vtt = "WEBVTT\n\n00:12.500 --> 00:15.000\nKisa\n";
const v = shiftSubtitles(vtt, 1);
assert.strictEqual(v.format, "vtt");
assert.ok(v.text.includes("00:00:13.500 --> 00:00:16.000"));

// Hour rollover.
const late = "1\n00:59:59,900 --> 01:00:01,000\nGece\n";
assert.ok(shiftSubtitles(late, 0.2).text.includes("01:00:00,100 --> 01:00:01,200"));
console.log("srt-shift: OK");
