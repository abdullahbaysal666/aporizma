/* Subtitle merger: parse both files to normalized cues, sort, re-emit in
   file A's format. Pure logic first (node-testable), UI below. */
"use strict";

const TS = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,](\d{3})/;

function detectSub(text) {
  const t = text.replace(/^﻿/, "").trimStart();
  if (/^WEBVTT/.test(t)) return "vtt";
  if (/-->/.test(t) && TS.test(t)) return "srt";
  return null;
}

function toMs(h, m, s, ms) {
  return ((+(h || 0)) * 3600 + (+m) * 60 + (+s)) * 1000 + (+ms);
}

function parseCues(text) {
  const fmt = detectSub(text);
  if (!fmt) return null;
  const norm = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  const cues = [];
  for (const block of norm.split(/\n{2,}/)) {
    if (/^(WEBVTT|NOTE|STYLE|REGION)/.test(block.trim())) continue;
    const lines = block.split("\n");
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i === -1) continue;
    const [left, right] = lines[i].split("-->");
    const a = left.match(TS);
    const b = right && right.match(TS);
    if (!a || !b) continue;
    const text_ = lines.slice(i + 1).join("\n").trim();
    if (!text_) continue;
    cues.push({ start: toMs(a[1], a[2], a[3], a[4]), end: toMs(b[1], b[2], b[3], b[4]), text: text_ });
  }
  return { format: fmt, cues };
}

function stamp(ms, fmt) {
  const sep = fmt === "srt" ? "," : ".";
  const p = (x, n = 2) => String(x).padStart(n, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:` +
    `${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`;
}

function mergeSubs(textA, textB) {
  const a = parseCues(textA);
  const b = parseCues(textB);
  if (!a || !b) return null;
  const cues = [...a.cues, ...b.cues].sort((x, y) => x.start - y.start || x.end - y.end);
  const fmt = a.format;
  const blocks = cues.map((c, i) => {
    const line = `${stamp(c.start, fmt)} --> ${stamp(c.end, fmt)}`;
    return fmt === "srt" ? `${i + 1}\n${line}\n${c.text}` : `${line}\n${c.text}`;
  });
  const body = blocks.join("\n\n") + "\n";
  return { format: fmt, count: cues.length, text: fmt === "vtt" ? "WEBVTT\n\n" + body : body };
}

if (typeof module !== "undefined") {
  module.exports = { detectSub, parseCues, mergeSubs, stamp };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const inA = document.getElementById("inA");
  const inB = document.getElementById("inB");
  const output = document.getElementById("output");
  const status = document.getElementById("status");
  const dl = document.getElementById("download");
  const cp = document.getElementById("copy");
  let baseName = "merged";
  let ext = "srt";

  const run = () => {
    if (!inA.value.trim() || !inB.value.trim()) {
      status.textContent = S.empty;
      status.className = "note";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    const res = mergeSubs(inA.value, inB.value);
    if (!res) {
      status.textContent = S.invalid;
      status.className = "note err";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    ext = res.format;
    output.value = res.text;
    status.textContent = S.status_fmt.replace("{n}", res.count)
      .replace("{fmt}", res.format.toUpperCase());
    status.className = "note ok";
    dl.disabled = cp.disabled = false;
  };

  inA.addEventListener("input", run);
  inB.addEventListener("input", run);
  Aporizma.dropzone(document.getElementById("dropA"), document.getElementById("fileA"), (t, name) => {
    baseName = (name.replace(/\.[^.]+$/, "") || "merged") + "_merged";
    inA.value = t; run();
  });
  Aporizma.dropzone(document.getElementById("dropB"), document.getElementById("fileB"), (t) => {
    inB.value = t; run();
  });
  dl.addEventListener("click", () => Aporizma.download(`${baseName}.${ext}`, output.value));
  cp.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    const old = cp.textContent;
    cp.textContent = S.copied;
    setTimeout(() => (cp.textContent = old), 1200);
  });
}
