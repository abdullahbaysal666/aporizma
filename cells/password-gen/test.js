const assert = require("assert");
const { SETS, buildSets, makeRandInt, genPassword, entropyBits } = require("./cell.js");

// Deterministic byte source for tests.
const seq = (arr) => { let i = 0; return () => arr[i++ % arr.length]; };

// buildSets honors choices and ambiguous filtering.
assert.deepStrictEqual(buildSets({ lower: true }), [SETS.lower]);
const noAmb = buildSets({ lower: true, upper: true, digits: true, ambiguous: true });
assert.ok(!noAmb.join("").match(/[0O1lI]/));
assert.deepStrictEqual(buildSets({}), []);

// makeRandInt: uniform range, rejection works (255 rejected for n=10 -> uses next byte).
const r = makeRandInt(seq([255, 7]));
assert.strictEqual(r(10), 7);
for (let n = 2; n <= 30; n++) {
  const rr = makeRandInt(seq([0, 50, 100, 150, 200, 249]));
  for (let k = 0; k < 6; k++) {
    const v = rr(n);
    assert.ok(v >= 0 && v < n, `randInt(${n}) out of range: ${v}`);
  }
}

// genPassword: length, at least one char from each chosen set.
const bytes = seq([3, 17, 91, 4, 42, 200, 8, 133, 77, 5, 60, 210, 33, 99, 12, 180]);
const pw = genPassword({ length: 20, lower: true, upper: true, digits: true, symbols: true }, bytes);
assert.strictEqual(pw.length, 20);
assert.ok(/[a-z]/.test(pw), "missing lowercase");
assert.ok(/[A-Z]/.test(pw), "missing uppercase");
assert.ok(/[0-9]/.test(pw), "missing digit");
assert.ok(/[!#$%&()*+\-./:;<=>?@[\]^_{}~]/.test(pw), "missing symbol");

// Only chosen sets appear.
const pwL = genPassword({ length: 12, lower: true }, seq([9, 33, 77, 121, 5, 88]));
assert.ok(/^[a-z]{12}$/.test(pwL));

// Invalid configs -> null.
assert.strictEqual(genPassword({ length: 12 }, seq([1])), null);
assert.strictEqual(genPassword({ length: 2, lower: true, upper: true, digits: true }, seq([1])), null);

// Entropy: 26-letter alphabet, 12 chars -> round(12*log2(26)) = 56.
assert.strictEqual(entropyBits({ length: 12, lower: true }), 56);
assert.strictEqual(entropyBits({ length: 20 }), 0);
assert.ok(entropyBits({ length: 20, lower: true, upper: true, digits: true, symbols: true }) >= 110);
console.log("password-gen: OK");
