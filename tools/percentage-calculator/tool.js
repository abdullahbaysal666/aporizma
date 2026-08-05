/* Percentage calculator: three independent modes.
   Pure math first (node-testable), UI wiring below. */
"use strict";

/**
 * What is `percent`% of `base`? Returns the number, or null if either
 * input isn't finite.
 */
function percentOf(base, percent) {
  if (!Number.isFinite(base) || !Number.isFinite(percent)) return null;
  return (base * percent) / 100;
}

/**
 * Percent change going from `from` to `to`. Returns a signed percentage
 * (positive = increase, negative = decrease), or null if either input
 * isn't finite or `from` is 0 (division by zero — undefined change).
 */
function percentChange(from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

/**
 * Discounted price for `price` with `discountPercent` off.
 * Returns { finalPrice, savings }, or null if price is negative/non-finite
 * or discountPercent is outside [0, 100] / non-finite.
 */
function discountPrice(price, discountPercent) {
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) return null;
  const finalPrice = price * (1 - discountPercent / 100);
  const savings = price - finalPrice;
  return { finalPrice, savings };
}

/** Round to at most 4 decimals and drop trailing zeros for display. */
function fmtNum(n) {
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10000) / 10000;
  return rounded.toString();
}

if (typeof module !== "undefined") {
  module.exports = { percentOf, percentChange, discountPrice, fmtNum };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  // Section 1: percentage of a number.
  const poBase = $("po-base");
  const poPercent = $("po-percent");
  const poResult = $("po-result");

  const runPercentOf = () => {
    const r = percentOf(Number(poBase.value), Number(poPercent.value));
    if (r === null) {
      poResult.textContent = S.po_invalid;
      poResult.className = "pc-result note err";
      return;
    }
    poResult.textContent = fmtNum(r);
    poResult.className = "pc-result";
  };
  poBase.addEventListener("input", runPercentOf);
  poPercent.addEventListener("input", runPercentOf);

  // Section 2: percent change between two values.
  const pcFrom = $("pc-from");
  const pcTo = $("pc-to");
  const pcResult = $("pc-result");

  const runPercentChange = () => {
    const from = Number(pcFrom.value);
    const to = Number(pcTo.value);
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      pcResult.textContent = S.pc_invalid;
      pcResult.className = "pc-result note err";
      return;
    }
    if (from === 0) {
      pcResult.textContent = S.pc_zero;
      pcResult.className = "pc-result note err";
      return;
    }
    const change = percentChange(from, to);
    if (change === 0) {
      pcResult.textContent = S.pc_no_change;
    } else {
      const suffix = change > 0 ? S.pc_increase_suffix : S.pc_decrease_suffix;
      pcResult.textContent = `${fmtNum(Math.abs(change))}% ${suffix}`;
    }
    pcResult.className = "pc-result";
  };
  pcFrom.addEventListener("input", runPercentChange);
  pcTo.addEventListener("input", runPercentChange);

  // Section 3: discount price.
  const discPrice = $("disc-price");
  const discPercent = $("disc-percent");
  const discResult = $("disc-result");
  const discFinal = $("disc-final");
  const discSavings = $("disc-savings");
  const discError = $("disc-error");

  const runDiscount = () => {
    const r = discountPrice(Number(discPrice.value), Number(discPercent.value));
    if (r === null) {
      discError.textContent = S.disc_invalid;
      discError.hidden = false;
      discResult.hidden = true;
      return;
    }
    discError.hidden = true;
    discFinal.textContent = fmtNum(r.finalPrice);
    discSavings.textContent = fmtNum(r.savings);
    discResult.hidden = false;
  };
  discPrice.addEventListener("input", runDiscount);
  discPercent.addEventListener("input", runDiscount);

  runPercentOf();
  runPercentChange();
  runDiscount();
}
