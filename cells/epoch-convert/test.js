const assert = require("assert");
const {
  classifyUnit, parseEpoch, epochToIso, epochToUtcString,
  nowEpoch, dateTimeLocalToMs, msToDateTimeLocalValue,
} = require("./cell.js");

// 10-digit value -> seconds.
const s1 = parseEpoch("1700000000");
assert.strictEqual(s1.unit, "s");
assert.strictEqual(s1.ms, 1700000000000);
assert.strictEqual(epochToIso(s1.ms), "2023-11-14T22:13:20.000Z");

// 13-digit value -> milliseconds.
const s2 = parseEpoch("1700000000000");
assert.strictEqual(s2.unit, "ms");
assert.strictEqual(s2.ms, 1700000000000);

// Epoch zero.
const s3 = parseEpoch("0");
assert.strictEqual(s3.unit, "s");
assert.strictEqual(epochToUtcString(s3.ms), "Thu, 01 Jan 1970 00:00:00 GMT");

// Negative (pre-1970) timestamp still classified as seconds.
const s4 = parseEpoch("-86400");
assert.strictEqual(s4.unit, "s");
assert.strictEqual(epochToUtcString(s4.ms), "Wed, 31 Dec 1969 00:00:00 GMT");

// Decimal seconds (fractional).
const s5 = parseEpoch("1700000000.5");
assert.strictEqual(s5.unit, "s");
assert.strictEqual(s5.ms, 1700000000500);

// Invalid input: not numeric.
assert.strictEqual(parseEpoch("abc"), null);
assert.strictEqual(parseEpoch(""), null);
assert.strictEqual(parseEpoch("   "), null);

// Too many digits: rejected (ambiguous unit, beyond ms range).
assert.strictEqual(parseEpoch("170000000000000000"), null);

// classifyUnit boundaries.
assert.strictEqual(classifyUnit(10), "s");
assert.strictEqual(classifyUnit(11), "ms");
assert.strictEqual(classifyUnit(13), "ms");
assert.strictEqual(classifyUnit(14), null);

// nowEpoch: seconds is floor(ms/1000), both close to Date.now().
const n = nowEpoch();
assert.strictEqual(n.s, Math.floor(n.ms / 1000));
assert.ok(Math.abs(n.ms - Date.now()) < 1000);

// dateTimeLocalToMs: invalid string.
assert.strictEqual(dateTimeLocalToMs(""), null);
assert.strictEqual(dateTimeLocalToMs("not-a-date"), null);

// Round trip: ms -> datetime-local string -> ms (second precision, timezone-agnostic).
const roundtripMs = Date.UTC(2024, 0, 15, 12, 30, 45);
const str = msToDateTimeLocalValue(roundtripMs);
assert.strictEqual(dateTimeLocalToMs(str), roundtripMs);

console.log("epoch-convert: OK");
