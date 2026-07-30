/* Color palette extractor — canvas pixel sampling + bucket quantization,
   nothing leaves the device. Pure math first (node-testable), UI below. */
"use strict";

function quantizeChannel(v, levels) {
  const step = 256 / levels;
  return Math.min(levels - 1, Math.floor(v / step));
}

const hex2 = (n) => n.toString(16).padStart(2, "0");
function toHex(r, g, b) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

/**
 * pixels: flat RGBA array (Uint8ClampedArray or plain Array), as from
 * canvas ImageData.data. Groups similar colors into buckets (levels per
 * channel), keeps the k most frequent, and returns their averaged color.
 */
function extractPalette(pixels, k, levels) {
  k = k || 6;
  levels = levels || 8;
  const buckets = new Map();
  let total = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue; // skip mostly-transparent pixels
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const key = quantizeChannel(r, levels) * levels * levels +
                quantizeChannel(g, levels) * levels +
                quantizeChannel(b, levels);
    let bucket = buckets.get(key);
    if (!bucket) { bucket = { sumR: 0, sumG: 0, sumB: 0, count: 0 }; buckets.set(key, bucket); }
    bucket.sumR += r; bucket.sumG += g; bucket.sumB += b; bucket.count += 1;
    total += 1;
  }
  if (total === 0) return [];
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, k);
  return sorted.map((b) => {
    const r = Math.round(b.sumR / b.count);
    const g = Math.round(b.sumG / b.count);
    const bl = Math.round(b.sumB / b.count);
    return { r, g, b: bl, hex: toHex(r, g, bl), pct: Math.round((b.count / total) * 1000) / 10 };
  });
}

if (typeof module !== "undefined") {
  module.exports = { quantizeChannel, toHex, extractPalette };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);
  const drop = $("drop");
  const fileInput = $("file");
  const status = $("status");
  const results = $("results");
  const kInput = $("k");
  const kVal = $("kval");
  const workCanvas = document.createElement("canvas");
  let lastImageData = null;

  kVal.textContent = kInput.value;
  kInput.addEventListener("input", () => {
    kVal.textContent = kInput.value;
    if (lastImageData) render();
  });

  const load = (f) => {
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      const maxSide = 200; // sample from a small copy — plenty for palette, fast
      const scale = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.max(1, Math.round(im.naturalWidth * scale));
      const h = Math.max(1, Math.round(im.naturalHeight * scale));
      workCanvas.width = w;
      workCanvas.height = h;
      const ctx = workCanvas.getContext("2d");
      ctx.drawImage(im, 0, 0, w, h);
      lastImageData = ctx.getImageData(0, 0, w, h).data;
      URL.revokeObjectURL(url);
      status.textContent = "";
      status.className = "note";
      render();
    };
    im.onerror = () => {
      status.textContent = S.invalid;
      status.className = "note err";
      lastImageData = null;
      results.innerHTML = "";
      results.style.display = "none";
    };
    im.src = url;
  };

  function render() {
    const palette = extractPalette(lastImageData, +kInput.value, 8);
    if (palette.length === 0) {
      status.textContent = S.no_colors;
      status.className = "note err";
      results.style.display = "none";
      return;
    }
    results.innerHTML = "";
    results.style.display = "grid";
    results.style.gridTemplateColumns = "repeat(auto-fill, minmax(96px, 1fr))";
    results.style.gap = "12px";
    for (const c of palette) {
      const cell = document.createElement("div");
      cell.style.textAlign = "center";
      const box = document.createElement("button");
      box.type = "button";
      box.style.cssText = "width:100%;aspect-ratio:1;border-radius:8px;border:1px solid rgba(127,127,127,.35);cursor:pointer";
      box.style.background = c.hex;
      box.title = S.copy;
      const label = document.createElement("div");
      label.className = "note";
      label.style.marginTop = "4px";
      label.style.wordBreak = "break-word";
      label.textContent = `${c.hex} · ${c.pct}%`;
      box.addEventListener("click", async () => {
        await navigator.clipboard.writeText(c.hex);
        label.textContent = S.copied;
        setTimeout(() => { label.textContent = `${c.hex} · ${c.pct}%`; }, 1200);
      });
      cell.appendChild(box);
      cell.appendChild(label);
      results.appendChild(cell);
    }
  }

  drop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => fileInput.files[0] && load(fileInput.files[0]));
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
    e.dataTransfer.files[0] && load(e.dataTransfer.files[0]);
  });
}
