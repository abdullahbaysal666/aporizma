const assert = require("assert");
const { PRICES, computeCosts, fmt } = require("./cell.js");

assert.ok(PRICES.length >= 12);
assert.ok(PRICES.every((p) => p.in > 0 && p.out > 0 && p.out >= p.in));

// Known case: Claude Sonnet 5 at 1M in + 1M out = $3 + $15 = $18 per request.
const rows = computeCosts(1_000_000, 1_000_000, 1);
const sonnet = rows.find((r) => r.model === "Claude Sonnet 5");
assert.strictEqual(sonnet.perRequest, 18);
assert.strictEqual(sonnet.perMonth, 18 * 30);

// Sorted ascending by monthly cost; cheapest current model first.
for (let i = 1; i < rows.length; i++) {
  assert.ok(rows[i].perMonth >= rows[i - 1].perMonth);
}
assert.strictEqual(rows[0].model, "GPT-5.4 nano"); // $0.20+$1.25 beats Flash-Lite's $0.25+$1.50

// Zero volume = zero cost, no crash.
assert.ok(computeCosts(0, 0, 0).every((r) => r.perMonth === 0));

// Formatting tiers.
assert.strictEqual(fmt(1234.5), "$1,235");
assert.strictEqual(fmt(2.5), "$2.50");
assert.strictEqual(fmt(0.0123), "$0.0123");
console.log("llm-cost: OK");
