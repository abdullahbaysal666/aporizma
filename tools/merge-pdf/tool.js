/* PDF merger — pdf-lib (bundled). mergePdfs() takes the library as a
   parameter so node tests can inject it. Pages copied as-is, no recompress. */
"use strict";

async function mergePdfs(buffers, pdflib) {
  const out = await pdflib.PDFDocument.create();
  let pages = 0;
  for (const buf of buffers) {
    const src = await pdflib.PDFDocument.load(buf, { ignoreEncryption: false });
    const copied = await out.copyPages(src, src.getPageIndices());
    for (const p of copied) {
      out.addPage(p);
      pages += 1;
    }
  }
  return { bytes: await out.save(), pages };
}

if (typeof module !== "undefined") {
  module.exports = { mergePdfs };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const list = document.getElementById("list");
  const listLabel = document.getElementById("listLabel");
  const status = document.getElementById("status");
  const mergeBtn = document.getElementById("merge");
  const dlBtn = document.getElementById("download");
  const drop = document.getElementById("drop");
  const fileInput = document.getElementById("file");
  let files = []; // {name, size, buf}
  let resultUrl = null;

  const fmtSize = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + " MB"
    : Math.round(b / 1024) + " KB";

  const renderList = () => {
    list.innerHTML = "";
    listLabel.hidden = files.length === 0;
    files.forEach((f, i) => {
      const li = document.createElement("li");
      const mk = (label, fn) => {
        const b = document.createElement("button");
        b.className = "btn ghost";
        b.textContent = label;
        b.addEventListener("click", fn);
        return b;
      };
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = f.name;
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = fmtSize(f.size);
      li.append(name, meta,
        mk(S.up, () => { if (i > 0) { [files[i - 1], files[i]] = [files[i], files[i - 1]]; renderList(); } }),
        mk(S.down, () => { if (i < files.length - 1) { [files[i + 1], files[i]] = [files[i], files[i + 1]]; renderList(); } }),
        mk(S.remove, () => { files.splice(i, 1); renderList(); }));
      list.appendChild(li);
    });
    mergeBtn.disabled = files.length < 2;
    status.textContent = files.length < 2 ? S.empty : `${files.length} PDF`;
    status.className = "note";
    dlBtn.hidden = true;
  };

  const addFiles = (fileList) => {
    for (const f of fileList) {
      const r = new FileReader();
      r.onload = () => { files.push({ name: f.name, size: f.size, buf: r.result }); renderList(); };
      r.readAsArrayBuffer(f);
    }
  };

  drop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("drag"); addFiles(e.dataTransfer.files); });

  mergeBtn.addEventListener("click", async () => {
    mergeBtn.disabled = true;
    status.textContent = S.working;
    status.className = "note";
    try {
      const { bytes, pages } = await mergePdfs(files.map((f) => f.buf), window.PDFLib);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      status.textContent = S.done_fmt.replace("{p}", pages).replace("{f}", files.length);
      status.className = "note ok";
      dlBtn.hidden = false;
    } catch (e) {
      const bad = files.find((f) => String(e.message || e).includes(f.name));
      status.textContent = S.invalid_fmt.replace("{name}", bad ? bad.name : "PDF");
      status.className = "note err";
    } finally {
      mergeBtn.disabled = files.length < 2;
    }
  });

  dlBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "merged.pdf";
    a.click();
  });
}
