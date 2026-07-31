/* Aspect ratio calculator: simplify W:H, and solve for a missing dimension
   given a target ratio. Pure math first (node-testable), UI below. */
"use strict";

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function isPositiveInt(n) {
  return Number.isFinite(n) && n > 0 && Number.isInteger(n);
}

/**
 * Simplify width:height to its lowest integer terms.
 * Returns { w, h, decimal } or null if either input isn't a positive integer.
 */
function simplifyRatio(width, height) {
  if (!isPositiveInt(width) || !isPositiveInt(height)) return null;
  const d = gcd(width, height);
  return { w: width / d, h: height / d, decimal: width / height };
}

/**
 * Given a known width or height and a target ratio (ratioW:ratioH), compute
 * the other dimension. side is "width" or "height".
 * Returns the exact (unrounded) other-dimension value, or null if invalid.
 */
function otherDimension(knownValue, side, ratioW, ratioH) {
  if (!Number.isFinite(knownValue) || knownValue <= 0) return null;
  if (!Number.isFinite(ratioW) || !Number.isFinite(ratioH) || ratioW <= 0 || ratioH <= 0) return null;
  if (side === "width") return (knownValue * ratioH) / ratioW;
  if (side === "height") return (knownValue * ratioW) / ratioH;
  return null;
}

const PRESETS = [
  [16, 9], [9, 16], [4, 3], [3, 4], [1, 1], [21, 9], [3, 2], [2, 3],
];

if (typeof module !== "undefined") {
  module.exports = { gcd, isPositiveInt, simplifyRatio, otherDimension, PRESETS };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const width = $("width");
  const height = $("height");
  const ratioResult = $("ratio-result");

  const runRatio = () => {
    const r = simplifyRatio(Number(width.value), Number(height.value));
    if (!r) {
      ratioResult.textContent = S.invalid_dims;
      ratioResult.className = "note err";
      return;
    }
    ratioResult.textContent = `${r.w}:${r.h}  (${r.decimal.toFixed(3)})`;
    ratioResult.className = "";
  };
  width.addEventListener("input", runRatio);
  height.addEventListener("input", runRatio);

  const ratioW = $("ratio-w");
  const ratioH = $("ratio-h");
  const knownSide = $("known-side");
  const knownValue = $("known-value");
  const dimResult = $("dim-result");

  const runDim = () => {
    const other = otherDimension(
      Number(knownValue.value), knownSide.value, Number(ratioW.value), Number(ratioH.value)
    );
    if (other === null) {
      dimResult.textContent = S.invalid_ratio;
      dimResult.className = "note err";
      return;
    }
    dimResult.textContent = Math.round(other).toString();
    dimResult.className = "";
  };
  ratioW.addEventListener("input", runDim);
  ratioH.addEventListener("input", runDim);
  knownSide.addEventListener("change", runDim);
  knownValue.addEventListener("input", runDim);

  const presetBox = $("presets");
  for (const [pw, ph] of PRESETS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn ghost";
    b.textContent = `${pw}:${ph}`;
    b.addEventListener("click", () => {
      ratioW.value = pw;
      ratioH.value = ph;
      runDim();
    });
    presetBox.appendChild(b);
  }

  runRatio();
  runDim();
}
