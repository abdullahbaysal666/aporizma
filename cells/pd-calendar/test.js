const assert = require("assert");
const { AUTHORS, pdYear, forYear, yearRange } = require("./cell.js");

// Life+70: died 1955 -> protected through 2025 -> free Jan 1, 2026.
assert.strictEqual(pdYear(1955), 2026);

// Landmark sanity checks against well-known facts.
const y2026 = forYear(2026).map((a) => a.name);
assert.ok(y2026.includes("Thomas Mann"));
const y2021 = forYear(2021).map((a) => a.name);
assert.ok(y2021.includes("George Orwell"));
const y2034 = forYear(2034).map((a) => a.name);
assert.ok(y2034.includes("Nâzım Hikmet"));

// Dataset hygiene: unique names, plausible years, non-empty fields.
const names = AUTHORS.map((a) => a.name);
assert.strictEqual(new Set(names).size, names.length, "duplicate author");
assert.ok(AUTHORS.every((a) => a.d >= 1949 && a.d <= 1966));
assert.ok(AUTHORS.every((a) => a.name && a.work && a.c));

// Every year in the covered range has at least one entry (no empty pages).
const { min, max } = yearRange();
for (let y = min; y <= max; y++) {
  assert.ok(forYear(y).length >= 1, `empty year ${y}`);
}

// Sorted alphabetically within a year.
const sorted = forYear(2033).map((a) => a.name);
assert.deepStrictEqual(sorted, [...sorted].sort((a, b) => a.localeCompare(b)));
console.log("pd-calendar: OK");
