const assert = require("assert");
const { detectFormat, srtToVtt, vttToSrt } = require("./cell.js");

const srt = "1\r\n00:00:01,000 --> 00:00:03,500\r\nHello world\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\nSecond line\r\nwith wrap\r\n";
assert.strictEqual(detectFormat(srt), "srt");
const vtt = srtToVtt(srt);
assert.ok(vtt.startsWith("WEBVTT\n\n"));
assert.ok(vtt.includes("00:00:01.000 --> 00:00:03.500"));
assert.strictEqual(detectFormat(vtt), "vtt");
const back = vttToSrt(vtt);
assert.ok(back.includes("00:00:01,000 --> 00:00:03,500"));
assert.ok(back.includes("with wrap"));

const short = "WEBVTT\n\nNOTE deneme\n\n00:12.500 --> 00:15.000 align:start\nKisa\n";
const conv = vttToSrt(short);
assert.ok(conv.includes("00:00:12,500 --> 00:00:15,000"));
assert.ok(!conv.includes("NOTE"));
assert.ok(!conv.includes("align"));
console.log("srt-vtt: OK");
