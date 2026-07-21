/* Color converter — HEX/RGB/HSL (+alpha) parse & format, pure math.
   Node-testable core, UI below. */
"use strict";

function parseColor(input) {
  const s = input.trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{3,4})$/);
  if (m) {
    const h = m[1];
    const [r, g, b, a] = [...h].map((c) => parseInt(c + c, 16));
    return { r, g, b, a: h.length === 4 ? a / 255 : 1 };
  }
  m = s.match(/^#?([0-9a-f]{6}([0-9a-f]{2})?)$/);
  if (m) {
    const h = m[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16),
             b: parseInt(h.slice(4, 6), 16),
             a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = s.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    if (r > 255 || g > 255 || b > 255) return null;
    return { r, g, b, a: m[4] ? parseAlpha(m[4]) : 1 };
  }
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    const [h, sat, l] = [+m[1] % 360, +m[2], +m[3]];
    if (sat > 100 || l > 100) return null;
    return { ...hslToRgb(h, sat, l), a: m[4] ? parseAlpha(m[4]) : 1 };
  }
  return null;
}

function parseAlpha(t) {
  const v = t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
  return Math.min(1, Math.max(0, v));
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hex2 = (n) => n.toString(16).padStart(2, "0");

function formatAll(c) {
  const hasA = c.a < 1;
  const aHex = hasA ? hex2(Math.round(c.a * 255)) : "";
  const hsl = rgbToHsl(c.r, c.g, c.b);
  const a2 = Math.round(c.a * 100) / 100;
  return {
    hex: `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${aHex}`,
    rgb: hasA ? `rgba(${c.r}, ${c.g}, ${c.b}, ${a2})` : `rgb(${c.r}, ${c.g}, ${c.b})`,
    hsl: hasA ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a2})`
              : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  };
}

if (typeof module !== "undefined") {
  module.exports = { parseColor, hslToRgb, rgbToHsl, formatAll };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const run = () => {
    const v = $("input").value;
    if (!v.trim()) {
      $("status").textContent = S.empty;
      $("status").className = "note";
      $("results").style.display = "none";
      $("swatch").style.background = "transparent";
      return;
    }
    const c = parseColor(v);
    if (!c) {
      $("status").textContent = S.err;
      $("status").className = "note err";
      $("results").style.display = "none";
      $("swatch").style.background = "transparent";
      return;
    }
    const f = formatAll(c);
    $("hex").textContent = f.hex;
    $("rgb").textContent = f.rgb;
    $("hsl").textContent = f.hsl;
    $("swatch").style.background = f.rgb;
    $("status").textContent = "";
    $("status").className = "note";
    $("results").style.display = "";
  };

  $("input").addEventListener("input", run);
  for (const btn of document.querySelectorAll(".copy-btn")) {
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText($(btn.dataset.for).textContent);
      btn.textContent = S.copied;
      setTimeout(() => { btn.textContent = S.copy; }, 1200);
    });
  }
}
