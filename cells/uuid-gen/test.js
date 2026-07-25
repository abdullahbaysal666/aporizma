const assert = require("assert");
const { genUuidV4, formatUuid, genBulk } = require("./cell.js");

// Deterministic byte source for tests.
const seq = (arr) => { let i = 0; return () => arr[i++ % arr.length]; };
const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Well-formed UUID v4: version nibble '4', variant nibble in 8-b.
const u1 = genUuidV4(seq([0, 17, 255, 64, 200, 3, 91, 128, 44, 9, 250, 12, 60, 199, 5, 88]));
assert.ok(V4_RE.test(u1), `not a valid v4 shape: ${u1}`);

// Version/variant bits are forced regardless of raw random input.
const u2 = genUuidV4(seq([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]));
assert.ok(u2.split("-")[2].startsWith("4"), "version nibble not forced to 4");
assert.ok(["8", "9", "a", "b"].includes(u2.split("-")[3][0]), "variant nibble not forced to 8-b");
const u3 = genUuidV4(seq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
assert.ok(u3.split("-")[2].startsWith("4"), "version nibble not forced to 4 (zero input)");
assert.ok(["8", "9", "a", "b"].includes(u3.split("-")[3][0]), "variant nibble not forced (zero input)");

// formatUuid: default lowercase with hyphens.
assert.strictEqual(formatUuid("ABCD1234-0000-4000-8000-000000000000"), "abcd1234-0000-4000-8000-000000000000");

// formatUuid: uppercase.
assert.strictEqual(
  formatUuid("abcd1234-0000-4000-8000-000000000000", { uppercase: true }),
  "ABCD1234-0000-4000-8000-000000000000"
);

// formatUuid: no hyphens.
assert.strictEqual(
  formatUuid("abcd1234-0000-4000-8000-000000000000", { noHyphens: true }),
  "abcd1234000040008000000000000000"
);

// formatUuid: uppercase + no hyphens combined.
assert.strictEqual(
  formatUuid("abcd1234-0000-4000-8000-000000000000", { uppercase: true, noHyphens: true }),
  "ABCD1234000040008000000000000000"
);

// genBulk: exact count, all valid v4.
const bytes = seq([3, 17, 91, 4, 42, 200, 8, 133, 77, 5, 60, 210, 33, 99, 12, 180]);
const list = genBulk(10, {}, bytes);
assert.strictEqual(list.length, 10);
assert.ok(list.every((u) => V4_RE.test(u)));

// genBulk: clamps below 1 and above 1000, tolerates NaN/garbage input.
assert.strictEqual(genBulk(0, {}, bytes).length, 1);
assert.strictEqual(genBulk(-5, {}, bytes).length, 1);
assert.strictEqual(genBulk(5000, {}, bytes).length, 1000);
assert.strictEqual(genBulk(NaN, {}, bytes).length, 1);

// genBulk: varying byte source produces distinct values (sanity, not a crypto proof).
let counter = 0;
const varying = () => (counter++ * 37 + 11) % 256;
const distinct = new Set(genBulk(50, {}, varying));
assert.ok(distinct.size > 1, "bulk generation produced only duplicates");

console.log("uuid-gen: OK");
