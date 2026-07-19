/* PDF splitter — pdf-lib (bundled). Pure, node-testable range parser +
   extractor; UI below. Order-as-typed is a feature (7,1 puts page 7 first). */
"use strict";

function parseRanges(spec, max) {
  const out = [];
  if (!spec || !spec.trim() || !max) return null;
  for (const raw of spec.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/) || part.match(/^(\d+)$/);
    if (!m) return null;
    let a, b;
    if (m.length === 2) { a = b = +m[1]; }               // tek sayfa "7"
    else {
      a = m[1] ? +m[1] : 1;                              // "-4" -> 1-4
      b = m[2] ? +m[2] : max;                            // "5-" -> 5-son
    }
    if (a < 1 || b > max || a > b) return null;
    for (let p = a; p <= b; p++) out.push(p - 1);        // 0-index
  }
  return out.length ? out : null;
}

async function splitPdf(buffer, indices, pdflib) {
  const src = await pdflib.PDFDocument.load(buffer);
  const out = await pdflib.PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  for (const p of copied) out.addPage(p);
  return out.save();
}

if (typeof module !== "undefined") {
  module.exports = { parseRanges, splitPdf };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const status = document.getElementById("status");
  const range = document.getElementById("range");
  const btn = document.getElementById("extract");
  const dl = document.getElementById("download");
  let buf = null, pageCount = 0, baseName = "pages", resultUrl = null;

  Aporizma.dropzone(document.getElementById("drop"), document.getElementById("file"),
    () => {});
  // dropzone helper okur ama ArrayBuffer gerek — file input'u kendimiz dinleyelim.
  const fileInput = document.getElementById("file");
  const drop = document.getElementById("drop");
  const load = async (f) => {
    baseName = f.name.replace(/\.pdf$/i, "") || "pages";
    buf = await f.arrayBuffer();
    try {
      const doc = await window.PDFLib.PDFDocument.load(buf);
      pageCount = doc.getPageCount();
      status.textContent = S.loaded_fmt.replace("{name}", f.name).replace("{p}", pageCount);
      status.className = "note ok";
      range.disabled = false;
      btn.disabled = false;
      dl.hidden = true;
    } catch (e) {
      status.textContent = S.invalid;
      status.className = "note err";
      buf = null; range.disabled = true; btn.disabled = true;
    }
  };
  fileInput.addEventListener("change", () => fileInput.files[0] && load(fileInput.files[0]));
  drop.addEventListener("drop", (e) => e.dataTransfer.files[0] && load(e.dataTransfer.files[0]));

  btn.addEventListener("click", async () => {
    const idx = parseRanges(range.value, pageCount);
    if (!idx) {
      status.textContent = S.bad_range;
      status.className = "note err";
      return;
    }
    btn.disabled = true;
    status.textContent = S.working;
    status.className = "note";
    try {
      const bytes = await splitPdf(buf, idx, window.PDFLib);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      status.textContent = S.done_fmt.replace("{p}", idx.length);
      status.className = "note ok";
      dl.hidden = false;
    } catch (e) {
      status.textContent = S.invalid;
      status.className = "note err";
    } finally {
      btn.disabled = false;
    }
  });

  dl.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${baseName}_pages.pdf`;
    a.click();
  });
}
