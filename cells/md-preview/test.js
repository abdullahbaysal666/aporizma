const assert = require("assert");
const { mdToHtml, inline } = require("./cell.js");

// Headers, bold, italic, code.
assert.strictEqual(mdToHtml("# Başlık"), "<h1>Başlık</h1>");
assert.strictEqual(mdToHtml("### Üç"), "<h3>Üç</h3>");
assert.ok(mdToHtml("**kalın** ve *italik*").includes("<strong>kalın</strong>"));
assert.ok(mdToHtml("*italik*").includes("<em>italik</em>"));
assert.ok(mdToHtml("`kod`").includes("<code>kod</code>"));

// Bold is not eaten by italic.
assert.ok(!mdToHtml("**x**").includes("<em>"));

// Links: only http(s) becomes a link; javascript: stays literal.
assert.ok(mdToHtml("[a](https://x.com)").includes('href="https://x.com"'));
assert.ok(!mdToHtml("[a](javascript:alert(1))").includes("<a "));

// Lists: ul + ol, and consecutive items share one list element.
const ul = mdToHtml("- bir\n- iki");
assert.strictEqual((ul.match(/<ul>/g) || []).length, 1);
assert.ok(ul.includes("<li>bir</li>") && ul.includes("<li>iki</li>"));
const ol = mdToHtml("1. bir\n2. iki");
assert.strictEqual((ol.match(/<ol>/g) || []).length, 1);

// Code block: content escaped, markdown inside NOT rendered.
const cb = mdToHtml("```\n# not a header\n<b>raw</b>\n```");
assert.ok(cb.includes("<pre><code>"));
assert.ok(cb.includes("# not a header"));
assert.ok(cb.includes("&lt;b&gt;raw&lt;/b&gt;"));
assert.ok(!cb.includes("<h1>"));

// XSS: raw HTML is escaped everywhere.
assert.ok(!mdToHtml("<script>alert(1)</script>").includes("<script>"));
assert.ok(!mdToHtml("# <img src=x onerror=alert(1)>").includes("<img"));

// Blockquote + paragraphs join lines.
assert.ok(mdToHtml("> alıntı").includes("<blockquote>alıntı</blockquote>"));
assert.strictEqual(mdToHtml("a\nb\n\nc"), "<p>a b</p>\n<p>c</p>");

// Unclosed code fence doesn't break output.
assert.ok(mdToHtml("```\nx").includes("</code></pre>"));
console.log("md-preview: OK");
