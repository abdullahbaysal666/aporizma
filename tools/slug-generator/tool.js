/* Slug generator: title -> SEO slug. Turkish-aware casing via toLocaleLowerCase("tr")
   so I/Ilk/i fold correctly (plain toLowerCase mangles dotted-I into a combining-dot mess).
   Pure logic first. */
"use strict";

const TR_MAP = { "ı": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c" };
const TR_CHARS_RE = /[ışğüçö]/g;
const COMBINING_RE = /[̀-ͯ]/g;

function slugify(text, opts = {}) {
  const { maxLength } = opts;
  if (!text) return "";
  let s = text.toLocaleLowerCase("tr");
  s = s.replace(TR_CHARS_RE, (ch) => TR_MAP[ch] || ch);
  s = s.normalize("NFD").replace(COMBINING_RE, "");
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/^-+|-+$/g, "");

  if (maxLength && s.length > maxLength) {
    const cut = s.slice(0, maxLength + 1);
    const lastDash = cut.lastIndexOf("-");
    s = lastDash > 0 ? cut.slice(0, lastDash) : s.slice(0, maxLength);
  }
  return s;
}

if (typeof module !== "undefined") {
  module.exports = { slugify };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);
  const input = $("input");
  const output = $("output");
  const count = $("count");
  const copy = $("copy");
  const maxlen = $("maxlen");

  const run = () => {
    const slug = slugify(input.value, { maxLength: Number(maxlen.value) || undefined });
    output.value = slug;
    count.textContent = S.count_fmt.replace("{n}", String(slug.length));
    copy.hidden = !slug;
  };

  input.addEventListener("input", run);
  maxlen.addEventListener("input", run);
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    copy.textContent = S.copied;
    setTimeout(() => { copy.textContent = S.copy; }, 1200);
  });
  run();
}
