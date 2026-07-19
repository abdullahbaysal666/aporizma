const assert = require("assert");
const pdflib = require("../../assets/vendor/pdf-lib.min.js");
const { parseRanges, splitPdf } = require("./cell.js");

// Range parser (1-indexed spec -> 0-indexed pages).
assert.deepStrictEqual(parseRanges("1-3,7", 10), [0, 1, 2, 6]);
assert.deepStrictEqual(parseRanges("5-", 7), [4, 5, 6]);
assert.deepStrictEqual(parseRanges("-3", 10), [0, 1, 2]);
assert.deepStrictEqual(parseRanges("7,1", 10), [6, 0]); // order as typed
assert.deepStrictEqual(parseRanges(" 2 - 4 ", 5), [1, 2, 3]); // whitespace ok
assert.strictEqual(parseRanges("0-2", 10), null);   // pages are 1-based
assert.strictEqual(parseRanges("8-12", 10), null);  // out of bounds
assert.strictEqual(parseRanges("3-1", 10), null);   // inverted
assert.strictEqual(parseRanges("abc", 10), null);
assert.strictEqual(parseRanges("", 10), null);

(async () => {
  const doc = await pdflib.PDFDocument.create();
  for (let i = 0; i < 5; i++) doc.addPage([200 + i * 10, 300]); // farkli genislikler
  const buf = await doc.save();

  // Extract pages 2-3 -> widths 210, 220 (identity check via page size).
  const bytes = await splitPdf(buf, parseRanges("2-3", 5), pdflib);
  const out = await pdflib.PDFDocument.load(bytes);
  assert.strictEqual(out.getPageCount(), 2);
  assert.strictEqual(Math.round(out.getPage(0).getWidth()), 210);
  assert.strictEqual(Math.round(out.getPage(1).getWidth()), 220);

  // Order-as-typed: "5,1" -> widths 240, 200.
  const b2 = await splitPdf(buf, parseRanges("5,1", 5), pdflib);
  const o2 = await pdflib.PDFDocument.load(b2);
  assert.strictEqual(Math.round(o2.getPage(0).getWidth()), 240);
  assert.strictEqual(Math.round(o2.getPage(1).getWidth()), 200);
  console.log("pdf-split: OK");
})().catch((e) => { console.error(e); process.exit(1); });
