const assert = require("assert");
const { htmlEncode, htmlDecode } = require("./cell.js");

// Basic five unsafe chars.
assert.strictEqual(htmlEncode('<a href="x">A & B\'s</a>', false),
  "&lt;a href=&quot;x&quot;&gt;A &amp; B&#39;s&lt;/a&gt;");

// Plain text with no special chars is untouched.
assert.strictEqual(htmlEncode("hello world", false), "hello world");

// Without allChars, non-ASCII passes through raw.
assert.strictEqual(htmlEncode("Gölge şarkı İĞÜÇÖ", false), "Gölge şarkı İĞÜÇÖ");

// With allChars, non-ASCII becomes numeric entities but ASCII stays plain.
assert.strictEqual(htmlEncode("ş1", true), "&#351;1");

// Decode named entities.
assert.strictEqual(htmlDecode("A &amp; B &lt;tag&gt; &quot;q&quot; &#39;x&#39;"), 'A & B <tag> "q" \'x\'');
assert.strictEqual(htmlDecode("Price: 10&euro; &hellip;"), "Price: 10€ …");

// Decode numeric decimal and hex.
assert.strictEqual(htmlDecode("&#39;&#x27;&#xC5;"), "''Å");

// Unknown / malformed entities are left as-is (no crash).
assert.strictEqual(htmlDecode("&foobar; and &amp no semicolon"), "&foobar; and &amp no semicolon");

// Round trip: encode then decode restores the original text.
for (const s of ["Türkçe metin & <tags> \"quoted\" 'apos'", "🎉 emoji <b>bold</b>", "汉字 & test"]) {
  assert.strictEqual(htmlDecode(htmlEncode(s, false)), s, s);
  assert.strictEqual(htmlDecode(htmlEncode(s, true)), s, "allChars: " + s);
}

// Empty input stays empty.
assert.strictEqual(htmlEncode("", false), "");
assert.strictEqual(htmlDecode(""), "");

console.log("html-entities: OK");
