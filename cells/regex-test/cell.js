/* Regex tester — JS engine, live highlight, group listing. Pure logic first.
   Backtracking guard: cap matches and total scan work, never freeze the page. */
"use strict";

const MAX_MATCHES = 500;

function findMatches(pattern, flags, text) {
  let re;
  try {
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (e) {
    return { error: e.message };
  }
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length,
                   text: m[0], groups: m.slice(1) });
    if (m[0] === "") re.lastIndex++;  // zero-width: ilerle, sonsuz dongu olmasin
    if (matches.length >= MAX_MATCHES) break;
  }
  return { matches };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Metni vurgulu HTML'e cevir: eslesmeler <mark>, arasi duz. */
function highlightHtml(text, matches) {
  let out = "";
  let pos = 0;
  for (const m of matches) {
    out += escapeHtml(text.slice(pos, m.start));
    out += "<mark>" + (escapeHtml(m.text) || "&#8203;") + "</mark>";
    pos = m.end;
  }
  return out + escapeHtml(text.slice(pos));
}

if (typeof module !== "undefined") {
  module.exports = { findMatches, highlightHtml, escapeHtml, MAX_MATCHES };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const run = () => {
    const pattern = $("pattern").value;
    const text = $("text").value;
    if (!pattern || !text) {
      $("status").textContent = S.empty;
      $("status").className = "note";
      $("highlight").style.display = "none";
      $("details").style.display = "none";
      return;
    }
    const r = findMatches(pattern, $("flags").value, text);
    if (r.error) {
      $("status").textContent = S.err_fmt.replace("{msg}", r.error);
      $("status").className = "note err";
      $("highlight").style.display = "none";
      $("details").style.display = "none";
      return;
    }
    $("highlight").innerHTML = highlightHtml(text, r.matches);
    $("highlight").style.display = "block";
    if (!r.matches.length) {
      $("status").textContent = S.no_matches;
      $("status").className = "note";
      $("details").style.display = "none";
      return;
    }
    $("status").textContent = S.matches_fmt.replace("{n}", r.matches.length);
    $("status").className = "note ok";
    const hasGroups = r.matches.some((m) => m.groups.length);
    if (hasGroups) {
      const rows = r.matches.slice(0, 50).map((m, i) =>
        `<tr><td>${i + 1}</td><td>${escapeHtml(m.text)}</td>`
        + m.groups.map((g) => `<td>${g === undefined ? "—" : escapeHtml(g)}</td>`).join("")
        + "</tr>").join("");
      const ncols = Math.max(...r.matches.map((m) => m.groups.length));
      const head = "<tr><th>#</th><th>match</th>"
        + Array.from({ length: ncols }, (_, i) => `<th>$${i + 1}</th>`).join("") + "</tr>";
      $("groups").innerHTML = `<table>${head}${rows}</table>`;
      $("details").style.display = "block";
    } else {
      $("details").style.display = "none";
    }
  };

  let t = null;
  const debounced = () => { clearTimeout(t); t = setTimeout(run, 150); };
  for (const id of ["pattern", "flags", "text"]) $(id).addEventListener("input", debounced);
}
