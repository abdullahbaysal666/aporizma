/* JWT decode only — no signature verification (needs a secret/public key,
   which never belongs in a client-side tool). Pure logic first, UI below. */
"use strict";

function base64UrlDecodeText(seg) {
  let s = String(seg).replace(/-/g, "+").replace(/_/g, "/");
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
    return null;
  }
}

function decodeJwt(token) {
  const parts = String(token).trim().split(".");
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
    return { ok: false, reason: "format" };
  }
  const [h, p, s] = parts;
  const headerText = base64UrlDecodeText(h);
  if (headerText === null) return { ok: false, reason: "decode", part: "header" };
  const payloadText = base64UrlDecodeText(p);
  if (payloadText === null) return { ok: false, reason: "decode", part: "payload" };

  let header, payload;
  try {
    header = JSON.parse(headerText);
  } catch {
    return { ok: false, reason: "json", part: "header" };
  }
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return { ok: false, reason: "json", part: "payload" };
  }
  return { ok: true, header, payload, signature: s };
}

// exp/iat/nbf are Unix seconds (RFC 7519) — render as a readable UTC date.
function formatUnixDate(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds)) return null;
  const d = new Date(seconds * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

const _atob = typeof atob !== "undefined" ? atob
  : (b64) => Buffer.from(b64, "base64").toString("binary");

if (typeof module !== "undefined") {
  module.exports = { base64UrlDecodeText, decodeJwt, formatUnixDate };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  function setStatus(text, cls) {
    $("status").textContent = text;
    $("status").className = "note " + (cls || "");
  }

  function renderClaims(payload) {
    const now = Date.now() / 1000;
    const lines = [];
    if (typeof payload.exp === "number") {
      const date = formatUnixDate(payload.exp);
      if (date) {
        const status = payload.exp < now ? S.status_expired : S.status_valid;
        lines.push(S.exp_fmt.replace("{date}", date).replace("{status}", status));
      }
    }
    if (typeof payload.iat === "number") {
      const date = formatUnixDate(payload.iat);
      if (date) lines.push(S.iat_fmt.replace("{date}", date));
    }
    if (typeof payload.nbf === "number") {
      const date = formatUnixDate(payload.nbf);
      if (date) lines.push(S.nbf_fmt.replace("{date}", date));
    }
    if (!lines.length) {
      $("claims-out").hidden = true;
      $("claims-out").textContent = "";
      return;
    }
    $("claims-out").hidden = false;
    $("claims-out").textContent = S.claims_label + ": " + lines.join(" · ");
  }

  function run() {
    const token = $("input").value;
    if (!token.trim()) {
      setStatus(S.empty, "");
      $("result").hidden = true;
      return;
    }
    const r = decodeJwt(token);
    if (!r.ok) {
      $("result").hidden = true;
      if (r.reason === "format") {
        setStatus(S.err_format, "err");
      } else if (r.reason === "decode") {
        setStatus(S.err_decode_fmt.replace("{part}", r.part === "header" ? S.header_label : S.payload_label), "err");
      } else {
        setStatus(S.err_json_fmt.replace("{part}", r.part === "header" ? S.header_label : S.payload_label), "err");
      }
      return;
    }
    $("header-out").textContent = JSON.stringify(r.header, null, 2);
    $("payload-out").textContent = JSON.stringify(r.payload, null, 2);
    $("signature-out").textContent = r.signature;
    renderClaims(r.payload);
    $("result").hidden = false;
    setStatus(S.ok_fmt.replace("{alg}", r.header && r.header.alg ? r.header.alg : "?"), "ok");
  }

  async function copyPre(id, btnId) {
    await navigator.clipboard.writeText($(id).textContent);
    const btn = $(btnId);
    const original = btn.textContent;
    btn.textContent = S.copied;
    setTimeout(() => { btn.textContent = original; }, 1200);
  }

  $("decode").addEventListener("click", run);
  $("copy-header").addEventListener("click", () => copyPre("header-out", "copy-header"));
  $("copy-payload").addEventListener("click", () => copyPre("payload-out", "copy-payload"));
}
