/* Base64 — UTF-8 safe via TextEncoder/TextDecoder (raw atob/btoa mangles
   anything beyond Latin-1). URL-safe variant supported. Pure logic first. */
"use strict";

function b64encode(text, urlSafe) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  let out = _btoa(bin);
  if (urlSafe) out = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return out;
}

function b64decode(b64) {
  let s = b64.replace(/[\s]/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (s.length % 4 === 1) return null;  // gecersiz uzunluk
  while (s.length % 4) s += "=";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  let bin;
  try {
    bin = _atob(s);
  } catch {
    return null;
  }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;  // gecerli Base64 ama gecerli UTF-8 degil
  }
}

// Node testlerinde atob/btoa globali yok — Buffer kopruleri.
const _btoa = typeof btoa !== "undefined" ? btoa
  : (bin) => Buffer.from(bin, "binary").toString("base64");
const _atob = typeof atob !== "undefined" ? atob
  : (b64) => Buffer.from(b64, "base64").toString("binary");

if (typeof module !== "undefined") {
  module.exports = { b64encode, b64decode };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const show = (text, okMsg) => {
    if (text === null) {
      $("output").value = "";
      $("status").textContent = S.err_decode;
      $("status").className = "note err";
      $("copy").hidden = true;
      return;
    }
    $("output").value = text;
    $("status").textContent = okMsg.replace("{chars}", text.length);
    $("status").className = "note ok";
    $("copy").hidden = false;
  };

  $("encode").addEventListener("click", () => {
    const t = $("input").value;
    if (!t) { $("status").textContent = S.empty; $("status").className = "note"; return; }
    show(b64encode(t, $("urlsafe").checked), S.ok_encode_fmt);
  });
  $("decode").addEventListener("click", () => {
    const t = $("input").value.trim();
    if (!t) { $("status").textContent = S.empty; $("status").className = "note"; return; }
    show(b64decode(t), S.ok_decode_fmt);
  });
  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
}
