/* Invisible character cleaner. Three independent passes: strip zero-width /
   invisible code points, straighten curly quotes, collapse repeated spaces.
   Pure logic first, counted so the UI can report what changed. */
"use strict";

// ZWSP, ZWNJ, ZWJ, LRM, RLM, word joiner, BOM/ZWNBSP, soft hyphen, Mongolian vowel separator.
const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u2060\uFEFF\u00AD\u180E]/g;

const QUOTE_MAP = {
  "\u2018": "'", "\u2019": "'", "\u201A": "'", "\u201B": "'",
  "\u2039": "'", "\u203A": "'",
  "\u201C": '"', "\u201D": '"', "\u201E": '"', "\u201F": '"',
  "\u00AB": '"', "\u00BB": '"',
};
const QUOTE_RE = new RegExp("[" + Object.keys(QUOTE_MAP).join("") + "]", "g");

function cleanText(text, opts) {
  opts = opts || {};
  const removeInvisible = opts.removeInvisible !== false;
  const fixQuotes = opts.fixQuotes !== false;
  const collapseSpaces = opts.collapseSpaces !== false;

  let out = text;
  let invisibleCount = 0;
  let quotesCount = 0;
  let spacesCount = 0;

  if (removeInvisible) {
    const matches = out.match(INVISIBLE_RE);
    invisibleCount = matches ? matches.length : 0;
    out = out.replace(INVISIBLE_RE, "");
  }

  if (fixQuotes) {
    const matches = out.match(QUOTE_RE);
    quotesCount = matches ? matches.length : 0;
    out = out.replace(QUOTE_RE, (ch) => QUOTE_MAP[ch]);
  }

  if (collapseSpaces) {
    out = out.replace(/ {2,}/g, (run) => {
      spacesCount += run.length - 1;
      return " ";
    });
  }

  return { text: out, invisibleCount, quotesCount, spacesCount, changed: invisibleCount + quotesCount + spacesCount > 0 };
}

if (typeof module !== "undefined") {
  module.exports = { cleanText, INVISIBLE_RE, QUOTE_MAP };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  $("clean").addEventListener("click", () => {
    const t = $("input").value;
    if (!t) {
      $("output").value = "";
      $("status").textContent = S.empty;
      $("status").className = "note";
      $("copy").hidden = true;
      return;
    }
    const opts = {
      removeInvisible: $("opt-invisible").checked,
      fixQuotes: $("opt-quotes").checked,
      collapseSpaces: $("opt-spaces").checked,
    };
    const result = cleanText(t, opts);
    $("output").value = result.text;
    $("status").textContent = result.changed
      ? S.ok_changed_fmt
          .replace("{invisible}", result.invisibleCount)
          .replace("{spaces}", result.spacesCount)
          .replace("{quotes}", result.quotesCount)
      : S.ok_clean_fmt;
    $("status").className = "note ok";
    $("copy").hidden = false;
  });

  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
}
