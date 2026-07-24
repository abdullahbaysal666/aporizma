/* HTML entity encode/decode. Encode: escape the five markup-unsafe chars,
   optionally every non-ASCII code point too (numeric entities). Decode:
   named entities (common subset) + numeric decimal/hex. Pure logic first. */
"use strict";

const BASIC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  nbsp: " ", copy: "©", reg: "®", trade: "™",
  hellip: "…", mdash: "—", ndash: "–",
  euro: "€", pound: "£", cent: "¢", yen: "¥",
  deg: "°", plusmn: "±", times: "×", divide: "÷",
  sup2: "²", sup3: "³", frac12: "½", frac14: "¼", frac34: "¾",
  laquo: "«", raquo: "»", para: "¶", sect: "§", middot: "·",
  bull: "•", dagger: "†", Dagger: "‡", permil: "‰",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  shy: "­", ordf: "ª", ordm: "º", micro: "µ",
};

function htmlEncode(text, allChars) {
  let out = "";
  for (const ch of text) {
    if (BASIC_MAP[ch]) {
      out += BASIC_MAP[ch];
      continue;
    }
    const code = ch.codePointAt(0);
    if (allChars && code > 127) {
      out += "&#" + code + ";";
    } else {
      out += ch;
    }
  }
  return out;
}

function htmlDecode(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, ent) => {
    if (ent[0] === "#") {
      const isHex = ent[1] === "x" || ent[1] === "X";
      const code = isHex ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, ent) ? NAMED_ENTITIES[ent] : match;
  });
}

if (typeof module !== "undefined") {
  module.exports = { htmlEncode, htmlDecode };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const show = (text, okMsg) => {
    $("output").value = text;
    $("status").textContent = okMsg.replace("{chars}", text.length);
    $("status").className = "note ok";
    $("copy").hidden = false;
  };

  $("encode").addEventListener("click", () => {
    const t = $("input").value;
    if (!t) { $("status").textContent = S.empty; $("status").className = "note"; $("copy").hidden = true; return; }
    show(htmlEncode(t, $("allchars").checked), S.ok_encode_fmt);
  });
  $("decode").addEventListener("click", () => {
    const t = $("input").value;
    if (!t) { $("status").textContent = S.empty; $("status").className = "note"; $("copy").hidden = true; return; }
    show(htmlDecode(t), S.ok_decode_fmt);
  });
  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
}
