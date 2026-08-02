/* Subtitle-to-transcript: strip cue numbers, timestamps and tags from SRT/VTT,
   join remaining text into one flowing transcript. Pure logic first. */
"use strict";

function detectFormat(text) {
  const t = text.replace(/^﻿/, "").trimStart();
  if (/^WEBVTT/.test(t)) return "vtt";
  if (/-->/.test(t)) return /\d{2}:\d{2}:\d{2},\d{3}/.test(t) ? "srt" : "vtt";
  return null;
}

function stripCueTags(line) {
  return line
    .replace(/<[^>]*>/g, "")     // <i>, </i>, <v Speaker>, <00:00:01.000>, <c>
    .replace(/\{\\[^}]*\}/g, "") // {\an8} ASS-style override tags
    .trim();
}

function parseCueTexts(text) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n+/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l !== "");
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;
    const textLines = lines.slice(timeIdx + 1).map(stripCueTags).filter((l) => l !== "");
    if (textLines.length === 0) continue;
    cues.push(textLines.join(" "));
  }
  return cues;
}

function extractTranscript(text, dedupe) {
  const format = detectFormat(text);
  if (!format) return null;
  let cues = parseCueTexts(text);
  if (cues.length === 0) return null;
  if (dedupe) {
    cues = cues.filter((c, i) => i === 0 || c !== cues[i - 1]);
  }
  const transcript = cues.join(" ").replace(/\s+/g, " ").trim();
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  return { format, text: transcript, cueCount: cues.length, wordCount };
}

if (typeof module !== "undefined") {
  module.exports = { detectFormat, stripCueTags, parseCueTexts, extractTranscript };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const dedupe = document.getElementById("dedupe");
  const status = document.getElementById("status");
  const dl = document.getElementById("download");
  const cp = document.getElementById("copy");
  let baseName = "transcript";

  const run = () => {
    const text = input.value;
    if (!text.trim()) {
      status.textContent = S.empty;
      status.className = "note";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    const res = extractTranscript(text, dedupe.checked);
    if (!res) {
      status.textContent = S.invalid;
      status.className = "note err";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    output.value = res.text;
    status.textContent = S.status_fmt
      .replace("{fmt}", res.format.toUpperCase())
      .replace("{n}", res.cueCount)
      .replace("{w}", res.wordCount);
    status.className = "note ok";
    dl.disabled = cp.disabled = false;
  };

  input.addEventListener("input", run);
  dedupe.addEventListener("change", run);
  Aporizma.dropzone(document.getElementById("drop"), document.getElementById("file"), (text, name) => {
    baseName = name.replace(/\.[^.]+$/, "") || "transcript";
    input.value = text;
    run();
  });
  dl.addEventListener("click", () => Aporizma.download(`${baseName}_transcript.txt`, output.value));
  cp.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    const old = cp.textContent;
    cp.textContent = S.copied;
    setTimeout(() => (cp.textContent = old), 1200);
  });
}
