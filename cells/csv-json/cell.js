/* CSV <-> JSON converter — pure parse/stringify functions first (RFC 4180
   quoting: embedded delimiters, newlines, and "" escaped quotes inside a
   quoted field), UI wiring after. */
"use strict";

function parseCSV(text, delimiter) {
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

function csvToJson(text, delimiter) {
  const trimmed = text.replace(/^﻿/, "");
  if (!trimmed.trim()) return [];
  const rows = parseCSV(trimmed, delimiter);
  if (rows.length === 0) return [];
  const headers = rows[0];
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length === 1 && cells[0] === "") continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = cells[c] !== undefined ? cells[c] : "";
    }
    out.push(obj);
  }
  return out;
}

function csvField(value, delimiter) {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(delimiter) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function jsonToCsv(text, delimiter) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const data = JSON.parse(trimmed);
  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return "";
  const headers = [];
  const seen = new Set();
  for (const item of list) {
    if (item && typeof item === "object") {
      for (const key of Object.keys(item)) {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      }
    }
  }
  const lines = [headers.map((h) => csvField(h, delimiter)).join(delimiter)];
  for (const item of list) {
    const row = headers.map((h) => {
      const v = item ? item[h] : undefined;
      const flat = v !== null && typeof v === "object" ? JSON.stringify(v) : v;
      return csvField(flat, delimiter);
    });
    lines.push(row.join(delimiter));
  }
  return lines.join("\r\n");
}

if (typeof module !== "undefined") {
  module.exports = { parseCSV, detectDelimiter, csvToJson, jsonToCsv, csvField };
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

  $("toJson").addEventListener("click", () => {
    const t = $("input").value;
    if (!t.trim()) {
      $("output").value = "";
      setStatus(S.empty, false);
      $("copy").hidden = true;
      return;
    }
    try {
      const delim = $("delimiter").value === "auto" ? detectDelimiter(t) : delimiterValue();
      const data = csvToJson(t, delim);
      const out = JSON.stringify(data, null, 2);
      $("output").value = out;
      setStatus(S.ok_json.replace("{rows}", data.length), true);
      $("copy").hidden = false;
    } catch (e) {
      $("output").value = "";
      setStatus(S.err_csv, false);
      $("copy").hidden = true;
    }
  });

  $("toCsv").addEventListener("click", () => {
    const t = $("input").value;
    if (!t.trim()) {
      $("output").value = "";
      setStatus(S.empty, false);
      $("copy").hidden = true;
      return;
    }
    try {
      const delim = $("delimiter").value === "auto" ? "," : delimiterValue();
      const csv = jsonToCsv(t, delim);
      const rowCount = csv ? csv.split(/\r\n/).length - 1 : 0;
      $("output").value = csv;
      setStatus(S.ok_csv.replace("{rows}", rowCount), true);
      $("copy").hidden = false;
    } catch (e) {
      $("output").value = "";
      setStatus(S.err_json, false);
      $("copy").hidden = true;
    }
  });

  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
}
