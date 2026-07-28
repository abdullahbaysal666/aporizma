/* UUID v4 generator (RFC 4122) — crypto.getRandomValues, bulk output.
   Pure logic first. */
"use strict";

const HEX = (n) => n.toString(16).padStart(2, "0");

/* byteSource: () => single random byte 0..255, called 16 times per UUID. */
function genUuidV4(byteSource) {
  const b = [];
  for (let i = 0; i < 16; i++) b.push(byteSource());
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  const h = b.map(HEX);
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}

function formatUuid(uuid, opts = {}) {
  let s = opts.uppercase ? uuid.toUpperCase() : uuid.toLowerCase();
  if (opts.noHyphens) s = s.replace(/-/g, "");
  return s;
}

function genBulk(count, opts, byteSource) {
  const n = Math.max(1, Math.min(1000, Math.floor(count) || 1));
  const out = [];
  for (let i = 0; i < n; i++) out.push(formatUuid(genUuidV4(byteSource), opts));
  return out;
}

if (typeof module !== "undefined") {
  module.exports = { genUuidV4, formatUuid, genBulk };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);
  const output = $("output");
  const count = $("count");
  const hyphens = $("hyphens");
  const uppercase = $("uppercase");
  const status = $("status");
  const copy = $("copy");
  const dl = $("download");

  const byteSource = () => {
    const b = new Uint8Array(1);
    crypto.getRandomValues(b);
    return b[0];
  };

  const run = () => {
    const opts = { noHyphens: !hyphens.checked, uppercase: uppercase.checked };
    const list = genBulk(Number(count.value), opts, byteSource);
    output.value = list.join("\n");
    status.textContent = S.count_fmt.replace("{n}", String(list.length));
  };

  $("generate").addEventListener("click", run);
  count.addEventListener("change", run);
  hyphens.addEventListener("change", run);
  uppercase.addEventListener("change", run);

  copy.addEventListener("click", async () => {
    if (!output.value) return;
    await navigator.clipboard.writeText(output.value);
    const old = copy.textContent;
    copy.textContent = S.copied;
    setTimeout(() => (copy.textContent = old), 1200);
  });
  dl.addEventListener("click", () => Aporizma.download("uuids.txt", output.value));

  run();
}
