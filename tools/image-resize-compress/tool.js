/* Image resize/compress — canvas only, nothing leaves the device.
   Pure sizing math first (node-testable), UI below. */
"use strict";

function targetSize(w, h, maxW) {
  if (!w || !h || !maxW) return null;
  if (w <= maxW) return { w, h, scaled: false }; // never enlarge
  const ratio = maxW / w;
  return { w: maxW, h: Math.max(1, Math.round(h * ratio)), scaled: true };
}

function humanSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

if (typeof module !== "undefined") {
  module.exports = { targetSize, humanSize };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const status = document.getElementById("status");
  const goBtn = document.getElementById("go");
  const dlBtn = document.getElementById("download");
  const canvas = document.getElementById("preview");
  const quality = document.getElementById("quality");
  const qval = document.getElementById("qval");
  let img = null, origBytes = 0, baseName = "image", resultUrl = null, outExt = "webp";

  quality.addEventListener("input", () => { qval.textContent = quality.value; });

  const drop = document.getElementById("drop");
  const fileInput = document.getElementById("file");
  const load = (f) => {
    baseName = f.name.replace(/\.[^.]+$/, "") || "image";
    origBytes = f.size;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      img = im;
      status.textContent = S.loaded_fmt.replace("{name}", f.name)
        .replace("{w}", im.naturalWidth).replace("{h}", im.naturalHeight)
        .replace("{size}", humanSize(f.size));
      status.className = "note ok";
      goBtn.disabled = false;
      dlBtn.hidden = true;
      canvas.style.display = "none";
    };
    im.onerror = () => {
      status.textContent = S.invalid;
      status.className = "note err";
      img = null; goBtn.disabled = true;
    };
    im.src = url;
  };
  drop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => fileInput.files[0] && load(fileInput.files[0]));
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("drag"); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); });

  goBtn.addEventListener("click", () => {
    if (!img) return;
    const t = targetSize(img.naturalWidth, img.naturalHeight, +document.getElementById("maxw").value);
    canvas.width = t.w;
    canvas.height = t.h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, t.w, t.h);
    canvas.style.display = "block";
    const mime = document.getElementById("format").value;
    outExt = mime === "image/webp" ? "webp" : "jpg";
    canvas.toBlob((blob) => {
      if (!blob) { status.textContent = S.invalid; status.className = "note err"; return; }
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(blob);
      const pct = Math.max(1, Math.round((blob.size / origBytes) * 100));
      status.textContent = S.done_fmt.replace("{w}", t.w).replace("{h}", t.h)
        .replace("{size}", humanSize(blob.size)).replace("{pct}", pct);
      status.className = "note ok";
      dlBtn.hidden = false;
    }, mime, +quality.value / 100);
  });

  dlBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${baseName}_small.${outExt}`;
    a.click();
  });
}
