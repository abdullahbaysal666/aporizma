const assert = require("assert");
const { cleanText } = require("./cell.js");

// Removes zero-width space between words.
{
  const r = cleanText("hello​world", {});
  assert.strictEqual(r.text, "helloworld");
  assert.strictEqual(r.invisibleCount, 1);
  assert.strictEqual(r.changed, true);
}

// Removes a leading BOM.
{
  const r = cleanText("﻿Title", {});
  assert.strictEqual(r.text, "Title");
  assert.strictEqual(r.invisibleCount, 1);
}

// Collapses multiple spaces into one, counting the extras removed.
{
  const r = cleanText("a    b  c", {});
  assert.strictEqual(r.text, "a b c");
  assert.strictEqual(r.spacesCount, 4);
}

// Straightens curly single and double quotes.
{
  const r = cleanText("“Hello” and ‘hi’", {});
  assert.strictEqual(r.text, "\"Hello\" and 'hi'");
  assert.strictEqual(r.quotesCount, 4);
}

// Turkish characters are preserved untouched — only targeted chars change.
{
  const r = cleanText("“İstanbul’da  çok   güzel”", {});
  assert.strictEqual(r.text, "\"İstanbul'da çok güzel\"");
  assert.strictEqual(r.invisibleCount, 0);
  assert.strictEqual(r.quotesCount, 3);
  assert.strictEqual(r.spacesCount, 3);
}

// Empty input returns empty output with all counts zero and changed=false.
{
  const r = cleanText("", {});
  assert.strictEqual(r.text, "");
  assert.strictEqual(r.invisibleCount, 0);
  assert.strictEqual(r.quotesCount, 0);
  assert.strictEqual(r.spacesCount, 0);
  assert.strictEqual(r.changed, false);
}

// Already-clean text is returned unchanged with changed=false.
{
  const r = cleanText("Plain simple text.", {});
  assert.strictEqual(r.text, "Plain simple text.");
  assert.strictEqual(r.changed, false);
}

// Options can be disabled individually — invisible chars survive when removeInvisible is off.
{
  const r = cleanText("a​b  “c”", { removeInvisible: false, fixQuotes: false, collapseSpaces: true });
  assert.strictEqual(r.text, "a​b “c”");
  assert.strictEqual(r.invisibleCount, 0);
  assert.strictEqual(r.quotesCount, 0);
  assert.strictEqual(r.spacesCount, 1);
}

// Soft hyphen and word joiner are also removed.
{
  const r = cleanText("soft­hyphen⁠joined", {});
  assert.strictEqual(r.text, "softhyphenjoined");
  assert.strictEqual(r.invisibleCount, 2);
}

// Combined pass: multiple issue types counted correctly at once, in one string.
{
  const r = cleanText("​“Quote”   with⁠  space﻿", {});
  assert.strictEqual(r.invisibleCount, 3); // ZWSP, word joiner, BOM
  assert.strictEqual(r.quotesCount, 2);
  assert.strictEqual(r.spacesCount, 3); // "   " -> collapses 3->1 (2 removed), "  " -> collapses 2->1 (1 removed) = 3
}

console.log("char-clean: OK");
