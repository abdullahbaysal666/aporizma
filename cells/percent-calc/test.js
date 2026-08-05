const assert = require("assert");
const { percentOf, percentChange, discountPrice, fmtNum } = require("./cell.js");

// percentOf: basic case, 15% of 200 = 30.
assert.strictEqual(percentOf(200, 15), 30);

// percentOf: fractional percent.
assert.strictEqual(percentOf(80, 12.5), 10);

// percentOf: negative base is valid math (e.g. debt of -50, 10% of it).
assert.strictEqual(percentOf(-50, 10), -5);

// percentOf: invalid (non-finite) inputs -> null.
assert.strictEqual(percentOf(NaN, 10), null);
assert.strictEqual(percentOf(10, Infinity), null);

// percentChange: increase 100 -> 150 = +50%.
assert.strictEqual(percentChange(100, 150), 50);

// percentChange: decrease 200 -> 150 = -25%.
assert.strictEqual(percentChange(200, 150), -25);

// percentChange: no change -> 0.
assert.strictEqual(percentChange(80, 80), 0);

// percentChange: from is zero -> undefined, null.
assert.strictEqual(percentChange(0, 50), null);

// percentChange: to zero is valid (a full -100% drop).
assert.strictEqual(percentChange(40, 0), -100);

// percentChange: non-finite inputs -> null.
assert.strictEqual(percentChange(NaN, 10), null);

// discountPrice: 100 with 20% off -> final 80, savings 20.
const d1 = discountPrice(100, 20);
assert.deepStrictEqual(d1, { finalPrice: 80, savings: 20 });

// discountPrice: 0% discount -> final price unchanged.
const d2 = discountPrice(59.99, 0);
assert.strictEqual(d2.finalPrice, 59.99);
assert.strictEqual(d2.savings, 0);

// discountPrice: 100% discount -> free.
const d3 = discountPrice(75, 100);
assert.strictEqual(d3.finalPrice, 0);
assert.strictEqual(d3.savings, 75);

// discountPrice: negative price -> null.
assert.strictEqual(discountPrice(-10, 20), null);

// discountPrice: discount out of [0, 100] range -> null.
assert.strictEqual(discountPrice(100, 150), null);
assert.strictEqual(discountPrice(100, -5), null);

// discountPrice: non-finite discount -> null.
assert.strictEqual(discountPrice(100, NaN), null);

// fmtNum: trims floating point noise and trailing zeros.
assert.strictEqual(fmtNum(30), "30");
assert.strictEqual(fmtNum(10.10000001), "10.1");
assert.strictEqual(fmtNum(0.1 + 0.2), "0.3");
assert.strictEqual(fmtNum(NaN), "");

console.log("percent-calc: OK");
