/* Password generator — crypto.getRandomValues, rejection sampling (no modulo
   bias), guaranteed one char from each chosen set. Pure logic first. */
"use strict";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!#$%&()*+-./:;<=>?@[]^_{}~",
};
const AMBIGUOUS = /[0O1lI|`'"]/g;

function buildSets(opts) {
  const chosen = [];
  for (const k of ["lower", "upper", "digits", "symbols"]) {
    if (!opts[k]) continue;
    let s = SETS[k];
    if (opts.ambiguous) s = s.replace(AMBIGUOUS, "");
    if (s) chosen.push(s);
  }
  return chosen;
}

/* randInt(n): uniform 0..n-1 from a byte source (rejection sampling). */
function makeRandInt(byteSource) {
  return (n) => {
    const limit = 256 - (256 % n);
    let b;
    do {
      b = byteSource();
    } while (b >= limit);
    return b % n;
  };
}

function genPassword(opts, byteSource) {
  const sets = buildSets(opts);
  if (!sets.length || opts.length < sets.length) return null;
  const all = sets.join("");
  const rand = makeRandInt(byteSource);
  // one guaranteed char per set, rest from the full alphabet…
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < opts.length) chars.push(all[rand(all.length)]);
  // …then an unbiased Fisher-Yates shuffle so set-chars aren't front-loaded
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function entropyBits(opts) {
  const alphabet = buildSets(opts).join("").length;
  if (!alphabet) return 0;
  return Math.round(opts.length * Math.log2(alphabet));
}

if (typeof module !== "undefined") {
  module.exports = { SETS, buildSets, makeRandInt, genPassword, entropyBits };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);
  const byteSource = () => {
    const b = new Uint8Array(1);
    crypto.getRandomValues(b);
    return b[0];
  };

  const readOpts = () => ({
    length: +$("len").value,
    lower: $("lower").checked,
    upper: $("upper").checked,
    digits: $("digits").checked,
    symbols: $("symbols").checked,
    ambiguous: $("ambiguous").checked,
  });

  const verdict = (bits) =>
    bits < 45 ? S.v_weak : bits < 60 ? S.v_fair : bits < 80 ? S.v_strong : S.v_excellent;

  const regen = () => {
    const opts = readOpts();
    const pw = genPassword(opts, byteSource);
    if (!pw) {
      $("pw").textContent = "";
      $("strength").textContent = S.no_sets;
      $("strength").className = "note err";
      return;
    }
    $("pw").textContent = pw;
    const bits = entropyBits(opts);
    $("strength").textContent = S.strength_fmt
      .replace("{bits}", bits).replace("{verdict}", verdict(bits));
    $("strength").className = "note ok";
  };

  $("len").addEventListener("input", () => { $("lenval").textContent = $("len").value; regen(); });
  for (const id of ["lower", "upper", "digits", "symbols", "ambiguous"]) {
    $(id).addEventListener("change", regen);
  }
  $("generate").addEventListener("click", regen);
  $("copy").addEventListener("click", async () => {
    const pw = $("pw").textContent;
    if (!pw) return;
    await navigator.clipboard.writeText(pw);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
  regen();
}
