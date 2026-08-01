/* CSV/TSV -> Markdown table converter — pure parse/render functions first
   (RFC 4180-style quoting reused so quoted delimiters/newlines/"" survive),
   UI wiring after. */
"use strict";

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function escapeCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function alignSeparator(width, alignment) {
  const dashes = Math.max(width, 3);
  switch (alignment) {
    case "left":
      return ":" + "-".repeat(dashes - 1);
    case "center":
      return ":" + "-".repeat(dashes - 2) + ":";
    case "right":
      return "-".repeat(dashes - 1) + ":";
    default:
      return "-".repeat(dashes);
  }
}

function rowsToMarkdown(rows, alignment) {
  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  if (nonEmpty.length === 0) return "";
  const headers = nonEmpty[0];
  const dataRows = nonEmpty.slice(1);
  const colCount = headers.length;
  const norm = (r) => Array.from({ length: colCount }, (_, i) => escapeCell(r[i]));
  const headCells = norm(headers);
  const bodyCells = dataRows.map(norm);
  const widths = headCells.map((h, i) => {
    let w = h.length;
    for (const row of bodyCells) w = Math.max(w, row[i].length);
    return Math.max(w, 3);
  });
  const line = (cells) => "| " + cells.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |";
  const sepLine = "| " + widths.map((w) => alignSeparator(w, alignment)).join(" | ") + " |";
  return [line(headCells), sepLine, ...bodyCells.map(line)].join("\n");
}

function textToMarkdownTable(text, delimiter, alignment) {
  const trimmed = text.replace(/^﻿/, "");
  if (!trimmed.trim()) return { markdown: "", rows: 0, cols: 0 };
  const rows = parseDelimited(trimmed, delimiter);
  const markdown = rowsToMarkdown(rows, alignment);
  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  return {
    markdown,
    rows: Math.max(nonEmpty.length - 1, 0),
    cols: nonEmpty.length ? nonEmpty[0].length : 0,
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    parseDelimited,
    detectDelimiter,
    escapeCell,
    alignSeparator,
    rowsToMarkdown,
    textToMarkdownTable,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  function delimiterValue() {
    const v = $("delimiter").value;
    return v === "tab" ? "\t" : v;
  }

  function setStatus(msg, ok) {
    $("status").textContent = msg;
    $("status").className = "note " + (ok ? "ok" : "err");
  }

  $("convert").addEventListener("click", () => {
    const t = $("input").value;
    if (!t.trim()) {
      $("output").value = "";
      setStatus(S.empty, false);
      $("copy").hidden = true;
      return;
    }
    try {
      const delim = $("delimiter").value === "auto" ? detectDelimiter(t) : delimiterValue();
      const alignment = $("alignment").value;
      const { markdown, rows, cols } = textToMarkdownTable(t, delim, alignment);
      $("output").value = markdown;
      setStatus(S.ok_fmt.replace("{rows}", rows).replace("{cols}", cols), true);
      $("copy").hidden = false;
    } catch (e) {
      $("output").value = "";
      setStatus(S.err, false);
      $("copy").hidden = true;
    }
  });

  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => {
      $("copy").textContent = S.copy;
    }, 1200);
  });
}
