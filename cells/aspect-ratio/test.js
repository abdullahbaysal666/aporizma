const assert = require("assert");
const { gcd, isPositiveInt, simplifyRatio, otherDimension, PRESETS } = require("./cell.js");

// gcd
assert.strictEqual(gcd(1920, 1080), 120);
assert.strictEqual(gcd(0, 5), 5);
assert.strictEqual(gcd(7, 13), 1);

// isPositiveInt
assert.strictEqual(isPositiveInt(5), true);
assert.strictEqual(isPositiveInt(0), false);
assert.strictEqual(isPositiveInt(-3), false);
assert.strictEqual(isPositiveInt(2.5), false);
assert.strictEqual(isPositiveInt(NaN), false);

// simplifyRatio — common resolutions
let r = simplifyRatio(1920, 1080);
assert.strictEqual(r.w, 16);
assert.strictEqual(r.h, 9);
assert.ok(Math.abs(r.decimal - 1920 / 1080) < 1e-9);

r = simplifyRatio(1080, 1920); // portrait
assert.strictEqual(r.w, 9);
assert.strictEqual(r.h, 16);

r = simplifyRatio(1000, 1000); // square
assert.strictEqual(r.w, 1);
assert.strictEqual(r.h, 1);

r = simplifyRatio(4096, 2160); // odd ratio, not a clean preset
assert.strictEqual(r.w, 256);
assert.strictEqual(r.h, 135);

// simplifyRatio — invalid input
assert.strictEqual(simplifyRatio(0, 1080), null);
assert.strictEqual(simplifyRatio(1920, -1080), null);
assert.strictEqual(simplifyRatio(1920.5, 1080), null);
assert.strictEqual(simplifyRatio(NaN, 1080), null);

// otherDimension
assert.strictEqual(otherDimension(1920, "width", 16, 9), 1080);
assert.strictEqual(otherDimension(1080, "height", 16, 9), 1920);
assert.strictEqual(otherDimension(1000, "width", 1, 1), 1000);
assert.ok(Math.abs(otherDimension(1080, "width", 9, 16) - 1920) < 1e-9);

// otherDimension — invalid input
assert.strictEqual(otherDimension(0, "width", 16, 9), null);
assert.strictEqual(otherDimension(-5, "width", 16, 9), null);
assert.strictEqual(otherDimension(1920, "width", 0, 9), null);
assert.strictEqual(otherDimension(1920, "width", 16, -9), null);
assert.strictEqual(otherDimension(1920, "depth", 16, 9), null);
assert.strictEqual(otherDimension(NaN, "width", 16, 9), null);

// presets: sane, positive pairs
assert.ok(PRESETS.length >= 6);
for (const [w, h] of PRESETS) {
  assert.ok(isPositiveInt(w) && isPositiveInt(h));
}

console.log("aspect-ratio: OK");
