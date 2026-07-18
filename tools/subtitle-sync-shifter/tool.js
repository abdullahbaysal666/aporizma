/* Subtitle sync shifter: SRT + VTT, format preserved. Pure logic first. */
"use strict";

function shiftDetect(text) {
  const t = text.replace(/^﻿/, "").trimStart();
  if (/^WEBVTT/.test(t)) return "vtt";
  if (/-->/.test(t)) return /\d{2}:\d{2}:\d{2},\d{3}/.test(t) ? "srt" : "vtt";
  return null;
}

function shiftSubtitles(text, offsetSeconds) {
  const fmt = shiftDetect(text);
  if (!fmt) return null;
  const sep = fmt === "srt" ? "," : ".";
  const re = fmt === "srt"
    ? /(\d{2}):(\d{2}):(\d{2}),(\d{3})/g
    : /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\.(\d{3})/g;
  let count = 0;
  const out = text.replace(re, (_, h, m, s, ms) => {
    const hours = fmt === "srt" ? h : (h || "0");
    let total = ((+hours) * 3600 + (+m) * 60 + (+s)) * 1000 + (+ms)
      + Math.round(offsetSeconds * 1000);
    if (total < 0) total = 0;
    count += 1;
    const hh = String(Math.floor(total / 3600000)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600000) / 60000)).padStart(2, "0");
    const ss = String(Math.floor((total % 60000) / 1000)).padStart(2, "0");
    const mmm = String(total % 1000).padStart(3, "0");
    return `${hh}:${mm}:${ss}${sep}${mmm}`;
  });
  return { format: fmt, text: out, cues: Math.floor(count / 2) };
}

if (typeof module !== "undefined") {
  module.exports = { shiftDetect, shiftSubtitles };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const offset = document.getElementById("offset");
  const status = document.getElementById("status");
  const dl = document.getElementById("download");
  const cp = document.getElementById("copy");
  let baseName = "subtitles";
  let ext = "srt";

  const run = () => {
    const text = input.value;
    const secs = parseFloat(offset.value.replace(",", "."));
    if (!text.trim()) {
      status.textContent = S.empty;
      status.className = "note";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    const res = Number.isFinite(secs) ? shiftSubtitles(text, secs) : null;
    if (!res) {
      status.textContent = S.invalid;
      status.className = "note err";
      output.value = "";
      dl.disabled = cp.disabled = true;
      return;
    }
    ext = res.format;
    output.value = res.text;
    status.textContent = S.status_fmt
      .replace("{fmt}", res.format.toUpperCase())
      .replace("{n}", res.cues)
      .replace("{s}", Number.isFinite(secs) ? secs : 0);
    status.className = "note ok";
    dl.disabled = cp.disabled = false;
  };

  input.addEventListener("input", run);
  offset.addEventListener("input", run);
  Aporizma.dropzone(document.getElementById("drop"), document.getElementById("file"), (text, name) => {
    baseName = name.replace(/\.[^.]+$/, "") || "subtitles";
    input.value = text;
    run();
  });
  dl.addEventListener("click", () => Aporizma.download(`${baseName}_shifted.${ext}`, output.value));
  cp.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    const old = cp.textContent;
    cp.textContent = S.copied;
    setTimeout(() => (cp.textContent = old), 1200);
  });
}
