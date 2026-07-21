/* Line diff — LCS (dynamic programming) with a size cap so huge inputs can't
   freeze the tab. Pure logic first, UI below. */
"use strict";

const MAX_LINES = 3000;

function diffLines(aText, bText) {
  const a = aText.split("\n").slice(0, MAX_LINES);
  const b = bText.split("\n").slice(0, MAX_LINES);
  const n = a.length, m = b.length;
  // LCS table (uint16 satir başına yeter: MAX_LINES < 65535)
  const width = m + 1;
  const dp = new Uint16Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] = a[i] === b[j]
        ? dp[(i + 1) * width + j + 1] + 1
        : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ t: "=", line: a[i] });
      i++; j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      ops.push({ t: "-", line: a[i] });
      i++;
    } else {
      ops.push({ t: "+", line: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ t: "-", line: a[i++] });
  while (j < m) ops.push({ t: "+", line: b[j++] });
  const truncated = aText.split("\n").length > MAX_LINES
    || bText.split("\n").length > MAX_LINES;
  return { ops, truncated };
}

function diffStats(ops) {
  let add = 0, del = 0;
  for (const o of ops) {
    if (o.t === "+") add++;
    else if (o.t === "-") del++;
  }
  return { add, del };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function diffHtml(ops) {
  return ops.map((o) => {
    const text = escapeHtml(o.line) || "&#8203;";
    if (o.t === "+") return `<div style="background:rgba(46,160,67,.22)">+ ${text}</div>`;
    if (o.t === "-") return `<div style="background:rgba(248,81,73,.22)">- ${text}</div>`;
    return `<div style="opacity:.75">&nbsp; ${text}</div>`;
  }).join("");
}

if (typeof module !== "undefined") {
  module.exports = { diffLines, diffStats, diffHtml, MAX_LINES };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  $("compare").addEventListener("click", () => {
    const a = $("left").value, b = $("right").value;
    if (!a.trim() && !b.trim()) {
      $("status").textContent = S.empty;
      $("status").className = "note";
      $("result").style.display = "none";
      return;
    }
    const { ops, truncated } = diffLines(a, b);
    const { add, del } = diffStats(ops);
    if (!add && !del) {
      $("status").textContent = S.same;
      $("status").className = "note ok";
      $("result").style.display = "none";
      return;
    }
    let msg = S.diff_fmt.replace("{add}", add).replace("{del}", del);
    if (truncated) msg += " — " + S.too_big.replace("{max}", MAX_LINES);
    $("status").textContent = msg;
    $("status").className = "note ok";
    $("result").innerHTML = diffHtml(ops);
    $("result").style.display = "block";
  });
}
