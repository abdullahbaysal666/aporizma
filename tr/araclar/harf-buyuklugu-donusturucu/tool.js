/* Case Converter — pure word-splitting + locale-aware case functions first,
   UI wiring after. Turkish casing (i/İ, ı/I) is opposite of English, so a
   locale flag threads through every function. */
"use strict";

function splitWords(text) {
  let s = text.trim();
  if (!s) return [];
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function caseUpper(text, tr) {
  return text.toLocaleUpperCase(tr ? "tr-TR" : undefined);
}

function caseLower(text, tr) {
  return text.toLocaleLowerCase(tr ? "tr-TR" : undefined);
}

function caseTitle(text, tr) {
  const locale = tr ? "tr-TR" : undefined;
  return text.replace(/\S+/gu, (word) => {
    const m = word.match(/\p{L}/u);
    if (!m) return word;
    const i = m.index;
    return word.slice(0, i)
      + word.slice(i, i + 1).toLocaleUpperCase(locale)
      + word.slice(i + 1).toLocaleLowerCase(locale);
  });
}

function caseCamel(text, tr) {
  const locale = tr ? "tr-TR" : undefined;
  return splitWords(text).map((w, i) => {
    const lw = w.toLocaleLowerCase(locale);
    return i === 0 ? lw : lw.charAt(0).toLocaleUpperCase(locale) + lw.slice(1);
  }).join("");
}

function casePascal(text, tr) {
  const locale = tr ? "tr-TR" : undefined;
  return splitWords(text).map((w) => {
    const lw = w.toLocaleLowerCase(locale);
    return lw.charAt(0).toLocaleUpperCase(locale) + lw.slice(1);
  }).join("");
}

function caseSnake(text, tr) {
  const locale = tr ? "tr-TR" : undefined;
  return splitWords(text).map((w) => w.toLocaleLowerCase(locale)).join("_");
}

function caseKebab(text, tr) {
  const locale = tr ? "tr-TR" : undefined;
  return splitWords(text).map((w) => w.toLocaleLowerCase(locale)).join("-");
}

function caseConstant(text, tr) {
  const locale = tr ? "tr-TR" : undefined;
  return splitWords(text).map((w) => w.toLocaleUpperCase(locale)).join("_");
}

if (typeof module !== "undefined") {
  module.exports = {
    splitWords, caseUpper, caseLower, caseTitle,
    caseCamel, casePascal, caseSnake, caseKebab, caseConstant,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const MODES = {
    upper: caseUpper, lower: caseLower, title: caseTitle,
    camel: caseCamel, pascal: casePascal, snake: caseSnake,
    kebab: caseKebab, constant: caseConstant,
  };

  for (const [id, fn] of Object.entries(MODES)) {
    $(id).addEventListener("click", () => {
      const t = $("input").value;
      if (!t.trim()) {
        $("output").value = "";
        $("status").textContent = S.empty;
        $("status").className = "note";
        $("copy").hidden = true;
        return;
      }
      const out = fn(t, $("trmode").checked);
      $("output").value = out;
      $("status").textContent = S.ok_fmt.replace("{chars}", out.length);
      $("status").className = "note ok";
      $("copy").hidden = false;
    });
  }

  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
}
