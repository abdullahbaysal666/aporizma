/* SRT <-> VTT conversion. Pure functions first (node-testable), UI wiring below. */
"use strict";

function stripBom(text) {
  return text.replace(/^﻿/, "");
}

function detectFormat(text) {
  const t = stripBom(text).trimStart();
  if (/^WEBVTT/.test(t)) return "vtt";
  if (/-->/.test(t)) return /\d{2}:\d{2}:\d{2},\d{3}/.test(t) ? "srt" : "vtt";
  return null;
}

function srtToVtt(text) {
  const body = stripBom(text)
    .replace(/\r\n?/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    .trim();
  return "WEBVTT\n\n" + body + "\n";
}

function vttToSrt(text) {
  const norm = stripBom(text).replace(/\r\n?/g, "\n").trim();
  const blocks = norm.split(/\n{2,}/);
  const out = [];
  let n = 0;
  for (const block of blocks) {
    if (/^(WEBVTT|NOTE|STYLE|REGION)/.test(block.trim())) continue;
    const lines = block.split("\n");
    const tsIndex = lines.findIndex((l) => l.includes("-->"));
    if (tsIndex === -1) continue;
    const ts = lines[tsIndex];
    const m = ts.match(/((?:\d{1,2}:)?\d{1,2}:\d{2})\.(\d{3})[ \t]*-->[ \t]*((?:\d{1,2}:)?\d{1,2}:\d{2})\.(\d{3})/);
    if (!m) continue;
    const pad = (stamp) => {
      const parts = stamp.split(":");
      while (parts.length < 3) parts.unshift("00");
      return parts.map((p) => p.padStart(2, "0")).join(":");
    };
    const textLines = lines.slice(tsIndex + 1).join("\n").trim();
    if (!textLines) continue;
    n += 1;
    out.push(`${n}\n${pad(m[1])},${m[2]} --> ${pad(m[3])},${m[4]}\n${textLines}`);
  }
  return out.join("\n\n") + "\n";
}

if (typeof module !== "undefined") {
  module.exports = { detectFormat, srtToVtt, vttToSrt };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const status = document.getElementById("status");
  const dl = document.getElementById("download");
  const cp = document.getElementById("copy");
  let baseName = "subtitles";
  let outExt = "vtt";

  const run = () => {
    const text = input.value;
    if (!text.trim()) {
      status.textContent = S.empty;
      status.className = "note";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    const fmt = detectFormat(text);
    if (!fmt) {
      status.textContent = S.invalid;
      status.className = "note err";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    if (fmt === "srt") {
      status.textContent = S.detected_srt;
      output.value = srtToVtt(text);
      outExt = "vtt";
    } else {
      status.textContent = S.detected_vtt;
      output.value = vttToSrt(text);
      outExt = "srt";
    }
    status.className = "note ok";
    dl.disabled = cp.disabled = false;
  };

  input.addEventListener("input", run);
  Aporizma.dropzone(document.getElementById("drop"), document.getElementById("file"), (text, name) => {
    baseName = name.replace(/\.[^.]+$/, "") || "subtitles";
    input.value = text;
    run();
  });
  dl.addEventListener("click", () => Aporizma.download(`${baseName}.${outExt}`, output.value));
  cp.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    const old = cp.textContent;
    cp.textContent = S.copied;
    setTimeout(() => (cp.textContent = old), 1200);
  });
}
