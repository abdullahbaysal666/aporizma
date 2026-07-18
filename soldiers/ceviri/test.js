const assert = require("assert");
const { detectSubtitle, subSplit, subMerge, buildPrompt, parseNumbered } = require("./lib.js");

assert.strictEqual(detectSubtitle("Hello plain text"), null);
assert.strictEqual(detectSubtitle("1\n00:00:01,000 --> 00:00:02,000\nHi\n"), "srt");
assert.strictEqual(detectSubtitle("WEBVTT\n\n00:01.000 --> 00:02.000\nHi\n"), "vtt");

const srt = "1\n00:00:01,000 --> 00:00:03,500\nHello world\n\n2\n00:00:04,000 --> 00:00:06,000\nSecond line\nwith wrap\n";
const { skeleton, texts } = subSplit(srt);
assert.deepStrictEqual(texts, ["Hello world", "Second line", "with wrap"]);
// Timestamps and cue numbers must survive untouched in the skeleton.
assert.ok(skeleton.includes("00:00:01,000 --> 00:00:03,500"));
assert.ok(skeleton.includes("1"));

const merged = subMerge(skeleton, ["Merhaba dünya", "İkinci satır", "sarmalı ile"]);
assert.ok(merged.includes("00:00:01,000 --> 00:00:03,500\nMerhaba dünya"));
assert.ok(merged.includes("İkinci satır\nsarmalı ile"));
assert.ok(!merged.includes("Hello"));

const prompt = buildPrompt(["a", "b"], "Türkçe");
assert.ok(prompt.includes("0: a") && prompt.includes("1: b") && prompt.includes("Türkçe"));

const parsed = parseNumbered("0: x\n 1) y\n2 - z\njunk", 3);
assert.deepStrictEqual(parsed, ["x", "y", "z"]);

// VTT with NOTE block: NOTE text must not be treated as translatable.
const vtt = "WEBVTT\n\nNOTE internal\n\n00:12.500 --> 00:15.000\nShort stamp\n";
const v = subSplit(vtt);
assert.deepStrictEqual(v.texts, ["Short stamp"]);
assert.ok(subMerge(v.skeleton, ["Kısa damga"]).includes("NOTE internal"));

console.log("ceviri lib: OK");
