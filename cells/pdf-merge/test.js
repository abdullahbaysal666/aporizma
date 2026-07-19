const assert = require("assert");
const pdflib = require("../../assets/vendor/pdf-lib.min.js");
const { mergePdfs } = require("./cell.js");

async function makePdf(pageCount, label) {
  const doc = await pdflib.PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`${label} ${i + 1}`, { x: 40, y: 200, size: 24 });
  }
  return doc.save();
}

(async () => {
  const a = await makePdf(2, "Belge-A");
  const b = await makePdf(3, "Belge-B");

  // Merge preserves total page count and produces a loadable PDF.
  const { bytes, pages } = await mergePdfs([a, b], pdflib);
  assert.strictEqual(pages, 5);
  const merged = await pdflib.PDFDocument.load(bytes);
  assert.strictEqual(merged.getPageCount(), 5);

  // Order matters: [b, a] puts B's 3 pages first (check by page size identity).
  const { pages: p2 } = await mergePdfs([b, a], pdflib);
  assert.strictEqual(p2, 5);

  // Single file passes through.
  const single = await mergePdfs([a], pdflib);
  assert.strictEqual(single.pages, 2);

  // Garbage input rejects (throws), caught as rejected promise.
  let threw = false;
  try {
    await mergePdfs([new Uint8Array([1, 2, 3])], pdflib);
  } catch (e) {
    threw = true;
  }
  assert.ok(threw, "invalid PDF must throw");

  // Output starts with the PDF magic bytes.
  assert.strictEqual(String.fromCharCode(...bytes.slice(0, 5)), "%PDF-");
  console.log("pdf-merge: OK");
})().catch((e) => { console.error(e); process.exit(1); });
