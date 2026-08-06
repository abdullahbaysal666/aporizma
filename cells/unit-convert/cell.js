/* Unit converter: length, weight, temperature, volume. Static conversion
   factors only (no currency/tax data, no external tables) — pure math first,
   node-testable, DOM binding below. */
"use strict";

// Every non-temperature category is a plain linear scale against a base
// unit (factor 1). Temperature needs its own affine formulas.
const CATEGORIES = {
  length: {
    units: [
      { id: "m", factor: 1 },
      { id: "km", factor: 1000 },
      { id: "cm", factor: 0.01 },
      { id: "mm", factor: 0.001 },
      { id: "mi", factor: 1609.344 },
      { id: "yd", factor: 0.9144 },
      { id: "ft", factor: 0.3048 },
      { id: "in", factor: 0.0254 },
    ],
  },
  weight: {
    units: [
      { id: "kg", factor: 1 },
      { id: "g", factor: 0.001 },
      { id: "mg", factor: 0.000001 },
      { id: "t", factor: 1000 },
      { id: "lb", factor: 0.45359237 },
      { id: "oz", factor: 0.028349523125 },
      { id: "st", factor: 6.35029318 },
    ],
  },
  temperature: {
    units: [{ id: "c" }, { id: "f" }, { id: "k" }],
  },
  volume: {
    units: [
      { id: "l", factor: 1 },
      { id: "ml", factor: 0.001 },
      { id: "m3", factor: 1000 },
      { id: "gal", factor: 3.785411784 },
      { id: "qt", factor: 0.946352946 },
      { id: "pt", factor: 0.473176473 },
      { id: "cup", factor: 0.2365882365 },
      { id: "floz", factor: 0.0295735295625 },
    ],
  },
};

const CATEGORY_ORDER = ["length", "weight", "temperature", "volume"];

// Localized <option> label strings live in cell.json under these keys.
const UNIT_LABEL_KEYS = {
  m: "unit_m", km: "unit_km", cm: "unit_cm", mm: "unit_mm",
  mi: "unit_mi", yd: "unit_yd", ft: "unit_ft", in: "unit_in",
  kg: "unit_kg", g: "unit_g", mg: "unit_mg", t: "unit_t",
  lb: "unit_lb", oz: "unit_oz", st: "unit_st",
  c: "unit_c", f: "unit_f", k: "unit_k",
  l: "unit_l", ml: "unit_ml", m3: "unit_m3", gal: "unit_gal",
  qt: "unit_qt", pt: "unit_pt", cup: "unit_cup", floz: "unit_floz",
};

const CATEGORY_LABEL_KEYS = {
  length: "cat_length", weight: "cat_weight",
  temperature: "cat_temperature", volume: "cat_volume",
};

function toCelsius(value, fromId) {
  if (fromId === "c") return value;
  if (fromId === "f") return ((value - 32) * 5) / 9;
  if (fromId === "k") return value - 273.15;
  return null;
}

function fromCelsius(celsius, toId) {
  if (toId === "c") return celsius;
  if (toId === "f") return (celsius * 9) / 5 + 32;
  if (toId === "k") return celsius + 273.15;
  return null;
}

function convertTemperature(value, fromId, toId) {
  const c = toCelsius(value, fromId);
  if (c === null) return null;
  return fromCelsius(c, toId);
}

/** Convert `value` from `fromId` to `toId` within `category`. Returns a
 * finite number, or null if the category/unit ids are unknown or value
 * isn't a finite number. */
function convertUnit(category, value, fromId, toId) {
  if (!Number.isFinite(value)) return null;
  const cat = CATEGORIES[category];
  if (!cat) return null;
  if (category === "temperature") {
    return convertTemperature(value, fromId, toId);
  }
  const fromU = cat.units.find((u) => u.id === fromId);
  const toU = cat.units.find((u) => u.id === toId);
  if (!fromU || !toU) return null;
  return (value * fromU.factor) / toU.factor;
}

/** Parse a user-typed number, tolerant of a comma decimal separator
 * (common on Turkish keyboards). Returns NaN if not a plain decimal. */
function parseLocaleNumber(str) {
  if (typeof str !== "string") return NaN;
  const t = str.trim().replace(",", ".");
  if (t === "" || !/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** Format a converted value for display: fewer decimals for large
 * magnitudes, more for small ones, trailing zeros trimmed. */
function formatNumber(n) {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  let s = n.toFixed(decimals);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

if (typeof module !== "undefined") {
  module.exports = {
    CATEGORIES, CATEGORY_ORDER, UNIT_LABEL_KEYS, CATEGORY_LABEL_KEYS,
    convertUnit, parseLocaleNumber, formatNumber,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const categorySel = $("category");
  const valueInput = $("value");
  const fromSel = $("from_unit");
  const toSel = $("to_unit");
  const swapBtn = $("swap");
  const result = $("result");
  const ref = $("ref");

  for (const cat of CATEGORY_ORDER) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = S[CATEGORY_LABEL_KEYS[cat]];
    categorySel.appendChild(opt);
  }

  const populateUnits = (category, fromId, toId) => {
    const units = CATEGORIES[category].units;
    fromSel.innerHTML = "";
    toSel.innerHTML = "";
    for (const u of units) {
      const oFrom = document.createElement("option");
      oFrom.value = u.id;
      oFrom.textContent = S[UNIT_LABEL_KEYS[u.id]];
      fromSel.appendChild(oFrom);
      const oTo = oFrom.cloneNode(true);
      toSel.appendChild(oTo);
    }
    fromSel.value = fromId || units[0].id;
    toSel.value = toId || (units[1] || units[0]).id;
  };

  const run = () => {
    const value = parseLocaleNumber(valueInput.value);
    if (Number.isNaN(value)) {
      result.textContent = valueInput.value.trim() === "" ? S.empty : S.invalid;
      result.className = valueInput.value.trim() === "" ? "note" : "note err";
      ref.textContent = "";
      return;
    }
    const out = convertUnit(categorySel.value, value, fromSel.value, toSel.value);
    if (out === null) {
      result.textContent = S.invalid;
      result.className = "note err";
      ref.textContent = "";
      return;
    }
    const fromLabel = S[UNIT_LABEL_KEYS[fromSel.value]];
    const toLabel = S[UNIT_LABEL_KEYS[toSel.value]];
    result.textContent = S.result_fmt
      .replace("{value}", formatNumber(value))
      .replace("{from}", fromLabel)
      .replace("{out}", formatNumber(out))
      .replace("{to}", toLabel);
    result.className = "note ok";

    const unitOut = convertUnit(categorySel.value, 1, fromSel.value, toSel.value);
    ref.textContent = unitOut === null ? "" : S.ref_fmt
      .replace("{from}", fromLabel)
      .replace("{out}", formatNumber(unitOut))
      .replace("{to}", toLabel);
  };

  categorySel.addEventListener("change", () => {
    populateUnits(categorySel.value);
    run();
  });
  fromSel.addEventListener("change", run);
  toSel.addEventListener("change", run);
  valueInput.addEventListener("input", run);
  swapBtn.addEventListener("click", () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    run();
  });

  categorySel.value = "length";
  populateUnits("length", "km", "mi");
  valueInput.value = "1";
  run();
}
