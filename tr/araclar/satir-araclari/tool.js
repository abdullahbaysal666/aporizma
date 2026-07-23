/* Line tools: trim, remove blanks, dedupe, sort, reverse. Pure logic first. */
"use strict";

function splitLines(text) {
  return text.split(/\r\n|\r|\n/);
}

function processLines(text, opts) {
  opts = opts || {};
  let lines = splitLines(text);
  if (opts.trim) lines = lines.map((l) => l.trim());
  if (opts.removeEmpty) lines = lines.filter((l) => l.trim() !== "");
  if (opts.dedupe) {
    const seen = new Set();
    lines = lines.filter((l) => {
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    });
  }
  if (opts.sort === "asc") lines = lines.slice().sort((a, b) => a.localeCompare(b, "tr"));
  else if (opts.sort === "desc") lines = lines.slice().sort((a, b) => b.localeCompare(a, "tr"));
  if (opts.reverse) lines = lines.slice().reverse();
  return lines;
}

function processText(text, opts) {
  return processLines(text, opts).join("\n");
}

if (typeof module !== "undefined") {
  module.exports = { splitLines, processLines, processText };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const trim = document.getElementById("trim");
  const removeEmpty = document.getElementById("remove-empty");
  const dedupe = document.getElementById("dedupe");
  const reverse = document.getElementById("reverse");
  const sort = document.getElementById("sort");
  const status = document.getElementById("status");
  const cp = document.getElementById("copy");
  const dl = document.getElementById("download");

  const run = () => {
    const text = input.value;
    if (!text) {
      output.value = "";
      status.textContent = S.empty;
      status.className = "note";
      cp.disabled = dl.disabled = true;
      return;
    }
    const opts = {
      trim: trim.checked,
      removeEmpty: removeEmpty.checked,
      dedupe: dedupe.checked,
      reverse: reverse.checked,
      sort: sort.value,
    };
    const inCount = splitLines(text).length;
    const result = processLines(text, opts);
    output.value = result.join("\n");
    status.textContent = S.status_fmt
      .replace("{in}", inCount)
      .replace("{out}", result.length);
    status.className = "note ok";
    cp.disabled = dl.disabled = false;
  };

  [input].forEach((el) => el.addEventListener("input", run));
  [trim, removeEmpty, dedupe, reverse, sort].forEach((el) =>
    el.addEventListener("change", run)
  );
  cp.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    const old = cp.textContent;
    cp.textContent = S.copied;
    setTimeout(() => (cp.textContent = old), 1200);
  });
  dl.addEventListener("click", () => Aporizma.download("lines.txt", output.value));
}
