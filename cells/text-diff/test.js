const assert = require("assert");
const { diffLines, diffStats, diffHtml, MAX_LINES } = require("./cell.js");

// Basic: one line changed = one del + one add.
let r = diffLines("a\nb\nc", "a\nx\nc");
assert.deepStrictEqual(r.ops.map((o) => o.t).join(""), "=-+=");
assert.deepStrictEqual(diffStats(r.ops), { add: 1, del: 1 });

// Insertion doesn't cascade: LCS keeps everything below aligned.
r = diffLines("one\ntwo\nthree", "one\nNEW\ntwo\nthree");
assert.deepStrictEqual(diffStats(r.ops), { add: 1, del: 0 });
assert.strictEqual(r.ops.filter((o) => o.t === "=").length, 3);

// Identical -> no changes.
r = diffLines("x\ny", "x\ny");
assert.deepStrictEqual(diffStats(r.ops), { add: 0, del: 0 });

// Empty vs content.
r = diffLines("", "a\nb");
assert.deepStrictEqual(diffStats(r.ops), { add: 2, del: 1 }); // "" tek bos satirdir

// Whitespace-exact: trailing space counts as change.
r = diffLines("a", "a ");
assert.deepStrictEqual(diffStats(r.ops), { add: 1, del: 1 });

// Turkish content survives.
r = diffLines("gölge\nşarkı", "gölge\nşiir");
assert.strictEqual(r.ops[0].t, "=");

// HTML escaping in output.
const html = diffHtml(diffLines("<b>", "<i>").ops);
assert.ok(html.includes("&lt;b&gt;") && html.includes("&lt;i&gt;"));
assert.ok(!html.includes("<b>"));

// Cap: huge input truncates but returns.
const big = Array.from({ length: MAX_LINES + 100 }, (_, i) => "l" + i).join("\n");
r = diffLines(big, big + "\nx");
assert.strictEqual(r.truncated, true);
console.log("text-diff: OK");
