/* Mini Markdown -> HTML: everyday subset, XSS-safe by escaping FIRST and
   only generating our own tags. No libraries. Pure logic first. */
"use strict";

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
}

function inline(s) {
  // sira onemli: once code (icinde *_[] islenmesin), sonra kalin, italik, link
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) =>
    /^https?:\/\//i.test(url)
      ? `<a href="${url}" rel="noopener noreferrer" target="_blank">${text}</a>`
      : `[${text}](${url})`);
  return s;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let list = null;   // "ul" | "ol" | null
  let code = false;
  let para = [];

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    if (code) {
      if (/^```/.test(raw)) { out.push("</code></pre>"); code = false; }
      else out.push(esc(raw));
      continue;
    }
    const line = esc(raw);
    let m;
    if (/^```/.test(raw)) {
      flushPara(); closeList();
      out.push("<pre><code>");
      code = true;
    } else if ((m = line.match(/^(#{1,6})\s+(.+)$/))) {
      flushPara(); closeList();
      const h = m[1].length;
      out.push(`<h${h}>${inline(m[2])}</h${h}>`);
    } else if ((m = line.match(/^[-*]\s+(.+)$/))) {
      flushPara();
      if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\d+[.)]\s+(.+)$/))) {
      flushPara();
      if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
      flushPara(); closeList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if (!line.trim()) {
      flushPara(); closeList();
    } else {
      closeList();
      para.push(line);
    }
  }
  if (code) out.push("</code></pre>");
  flushPara(); closeList();
  return out.join("\n");
}

if (typeof module !== "undefined") {
  module.exports = { mdToHtml, inline, esc };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);
  let t = null;
  const run = () => {
    const v = $("input").value;
    if (!v.trim()) {
      $("preview").innerHTML = "";
      $("status").textContent = S.empty;
      return;
    }
    $("preview").innerHTML = mdToHtml(v);
    $("status").textContent = S.chars_fmt.replace("{n}", v.length);
  };
  $("input").addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 120); });
}
