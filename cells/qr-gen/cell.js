/* QR generator — matrix logic via the bundled MIT qrcode-generator library.
   qrMatrix() takes the library as a parameter so node tests can inject it. */
"use strict";

function qrMatrix(text, ecc, qrlib) {
  try {
    const qr = qrlib(0, ecc); // type 0 = auto-size
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    return { count: n, isDark: (r, c) => qr.isDark(r, c) };
  } catch (e) {
    return null; // too long for this ECC level
  }
}

function drawQr(canvas, matrix, size) {
  const quiet = 4; // standard quiet zone in modules
  const total = matrix.count + quiet * 2;
  const scale = Math.max(1, Math.floor(size / total));
  const px = total * scale;
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = "#000000";
  for (let r = 0; r < matrix.count; r++) {
    for (let c = 0; c < matrix.count; c++) {
      if (matrix.isDark(r, c)) {
        ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
  }
  return px;
}

if (typeof module !== "undefined") {
  module.exports = { qrMatrix };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const text = document.getElementById("qtext");
  const size = document.getElementById("qsize");
  const ecc = document.getElementById("qecc");
  const status = document.getElementById("status");
  const canvas = document.getElementById("qcanvas");
  const dl = document.getElementById("download");

  const run = () => {
    const value = text.value.trim();
    if (!value) {
      status.textContent = S.empty;
      status.className = "note";
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      dl.disabled = true;
      return;
    }
    const m = qrMatrix(value, ecc.value, window.qrcode);
    if (!m) {
      status.textContent = S.too_long;
      status.className = "note err";
      dl.disabled = true;
      return;
    }
    const px = drawQr(canvas, m, +size.value);
    status.textContent = `${m.count}×${m.count} · ${px}px`;
    status.className = "note ok";
    dl.disabled = false;
  };

  text.addEventListener("input", run);
  size.addEventListener("change", run);
  ecc.addEventListener("change", run);
  dl.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-code.png";
    a.click();
  });
}
