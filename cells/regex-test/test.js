const assert = require("assert");
const { findMatches, highlightHtml, escapeHtml, MAX_MATCHES } = require("./cell.js");

// Basic matching with groups.
let r = findMatches("(\\w+)@(\\w+\\.\\w+)", "g", "ali@x.com veya ayse@y.org");
assert.strictEqual(r.matches.length, 2);
assert.deepStrictEqual(r.matches[0].groups, ["ali", "x.com"]);
assert.strictEqual(r.matches[1].text, "ayse@y.org");

// Flags: case-insensitive; g otomatik eklenir.
r = findMatches("gölge", "i", "Gölge ve GÖLGE");
assert.ok(r.matches.length >= 1);

// Invalid pattern -> error, not throw.
r = findMatches("(unclosed", "g", "x");
assert.ok(r.error && r.error.length > 0);

// Zero-width matches don't loop forever.
r = findMatches("\\b", "g", "a b");
assert.ok(r.matches.length <= MAX_MATCHES);

// Match cap respected.
r = findMatches("a", "g", "a".repeat(2000));
assert.strictEqual(r.matches.length, MAX_MATCHES);

// Optional unmatched group -> undefined survives.
r = findMatches("a(b)?", "g", "a ab");
assert.strictEqual(r.matches[0].groups[0], undefined);
assert.strictEqual(r.matches[1].groups[0], "b");

// Highlight: marks in right places, HTML escaped.
const text = "x <b> x";
const m = findMatches("x", "g", text).matches;
assert.strictEqual(highlightHtml(text, m), "<mark>x</mark> &lt;b&gt; <mark>x</mark>");
assert.strictEqual(escapeHtml("<&>"), "&lt;&amp;&gt;");

// Unicode text positions stay consistent.
const tr = findMatches("ş\\S+", "gu", "şarkı ve şiir");  // \w ASCII'dir, ı'yı almaz
assert.strictEqual(tr.matches.length, 2);
assert.strictEqual(highlightHtml("şarkı ve şiir", tr.matches),
                   "<mark>şarkı</mark> ve <mark>şiir</mark>");
console.log("regex-test: OK");
