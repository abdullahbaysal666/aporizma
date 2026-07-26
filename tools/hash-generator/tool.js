/* Hash generator — SHA-1/256/384/512 via Web Crypto API (crypto.subtle.digest).
   Pure logic first, injectable digest function for testability. */
"use strict";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function bufToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

function applyCase(hex, uppercase) {
  return uppercase ? hex.toUpperCase() : hex;
}

/* digestFn: (algo, Uint8Array) => Promise<ArrayBuffer>, e.g. crypto.subtle.digest. */
async function hashText(text, algo, digestFn) {
  const bytes = new TextEncoder().encode(text);
  const buf = await digestFn(algo, bytes);
  return bufToHex(buf);
}

async function hashAll(text, algos, digestFn) {
  const out = {};
  for (const algo of algos) {
    out[algo] = await hashText(text, algo, digestFn);
  }
  return out;
}

function algoElementId(algo) {
  return "out-" + algo.toLowerCase().replace("-", "");
}

if (typeof module !== "undefined") {
  module.exports = { ALGOS, bufToHex, applyCase, hashText, hashAll, algoElementId };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);
  const input = $("input");
  const uppercase = $("uppercase");
  const status = $("status");
  const digestFn = (algo, bytes) => crypto.subtle.digest(algo, bytes);

  const rows = {};
  ALGOS.forEach((algo) => (rows[algo] = $(algoElementId(algo))));

  let seq = 0;
  const run = async () => {
    const mySeq = ++seq;
    const text = input.value;
    if (!text) {
      ALGOS.forEach((algo) => (rows[algo].value = ""));
      status.textContent = "";
      return;
    }
    const results = await hashAll(text, ALGOS, digestFn);
    if (mySeq !== seq) return; // stale response, newer input already in flight
    ALGOS.forEach((algo) => (rows[algo].value = applyCase(results[algo], uppercase.checked)));
    status.textContent = S.hashed_fmt.replace("{n}", String(text.length));
  };

  input.addEventListener("input", run);
  uppercase.addEventListener("change", run);

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const el = $(btn.getAttribute("data-copy"));
      if (!el.value) return;
      await navigator.clipboard.writeText(el.value);
      const old = btn.textContent;
      btn.textContent = S.copied;
      setTimeout(() => (btn.textContent = old), 1200);
    });
  });

  run();
}
