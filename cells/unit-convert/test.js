const assert = require("assert");
const {
  convertUnit, parseLocaleNumber, formatNumber, CATEGORIES, CATEGORY_ORDER,
} = require("./cell.js");

// Length: km -> mi, known conversion factor.
const km2mi = convertUnit("length", 10, "km", "mi");
assert.ok(Math.abs(km2mi - 6.21371192) < 1e-6);

// Length: same unit is a no-op.
assert.strictEqual(convertUnit("length", 42, "m", "m"), 42);

// Weight: lb -> kg.
const lb2kg = convertUnit("weight", 1, "lb", "kg");
assert.ok(Math.abs(lb2kg - 0.45359237) < 1e-9);

// Weight: kg -> g.
assert.strictEqual(convertUnit("weight", 2, "kg", "g"), 2000);

// Temperature: boiling point C -> F.
assert.strictEqual(convertUnit("temperature", 100, "c", "f"), 212);

// Temperature: absolute zero C -> K.
assert.ok(Math.abs(convertUnit("temperature", -273.15, "c", "k") - 0) < 1e-9);

// Temperature: F -> C round trip.
const f = convertUnit("temperature", 98.6, "f", "c");
assert.ok(Math.abs(f - 37) < 1e-9);

// Volume: gallon -> liter.
const gal2l = convertUnit("volume", 1, "gal", "l");
assert.ok(Math.abs(gal2l - 3.785411784) < 1e-9);

// Unknown category or unit id -> null.
assert.strictEqual(convertUnit("bogus", 1, "m", "km"), null);
assert.strictEqual(convertUnit("length", 1, "m", "parsec"), null);

// Non-finite value -> null.
assert.strictEqual(convertUnit("length", NaN, "m", "km"), null);
assert.strictEqual(convertUnit("length", Infinity, "m", "km"), null);

// parseLocaleNumber: plain, comma decimal, negative, invalid, empty.
assert.strictEqual(parseLocaleNumber("3.5"), 3.5);
assert.strictEqual(parseLocaleNumber("3,5"), 3.5);
assert.strictEqual(parseLocaleNumber("-12"), -12);
assert.ok(Number.isNaN(parseLocaleNumber("abc")));
assert.ok(Number.isNaN(parseLocaleNumber("")));
assert.ok(Number.isNaN(parseLocaleNumber("1.2.3")));

// formatNumber: trims trailing zeros, keeps sensible precision by magnitude.
assert.strictEqual(formatNumber(0), "0");
assert.strictEqual(formatNumber(212), "212");
assert.strictEqual(formatNumber(273.15), "273.15");
assert.strictEqual(formatNumber(0.45359237), "0.453592");
assert.strictEqual(formatNumber(1234.5), "1234.5");

// Every category listed in CATEGORY_ORDER has a matching CATEGORIES entry
// with at least two units (needed for a meaningful from/to pair).
for (const cat of CATEGORY_ORDER) {
  assert.ok(CATEGORIES[cat], `missing CATEGORIES entry for ${cat}`);
  assert.ok(CATEGORIES[cat].units.length >= 2, `${cat} needs >= 2 units`);
}

console.log("unit-convert: OK");
