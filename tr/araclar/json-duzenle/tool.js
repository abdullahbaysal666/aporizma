/* JSON format/validate/minify — kendi konum-takipli ayristiricimiz: motor
   mesajlari tutarsiz (Node 22 hic konum vermiyor, Firefox/Chrome ayri format).
   Pure logic first (node-testable), UI below. */
"use strict";

function parseJson(text) {
  let i = 0;
  const fail = (msg) => {
    const upto = text.slice(0, i);
    const lines = upto.split("\n");
    const err = new Error(msg);
    err.line = lines.length;
    err.col = lines[lines.length - 1].length + 1;
    throw err;
  };
  const ws = () => { while (i < text.length && " \t\n\r".includes(text[i])) i++; };
  const lit = (word, val) => {
    if (text.startsWith(word, i)) { i += word.length; return val; }
    return fail(`unexpected token '${text[i] ?? "end"}'`);
  };
  const str = () => {
    i++; // opening quote
    let out = "";
    while (true) {
      if (i >= text.length) return fail("unterminated string");
      const c = text[i];
      if (c === '"') { i++; return out; }
      if (c === "\n") return fail("unescaped newline in string");
      if (c === "\\") {
        const e = text[i + 1];
        const map = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
        if (e in map) { out += map[e]; i += 2; continue; }
        if (e === "u") {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) { i += 2; return fail("bad \\u escape"); }
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        i++;
        return fail(`bad escape '\\${e ?? "end"}'`);
      }
      out += c;
      i++;
    }
  };
  const num = () => {
    const m = text.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    if (!m || !m[0]) return fail("bad number");
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const value = () => {
    ws();
    if (i >= text.length) return fail("unexpected end of input");
    const c = text[i];
    if (c === "{") {
      i++;
      const obj = {};
      ws();
      if (text[i] === "}") { i++; return obj; }
      while (true) {
        ws();
        if (text[i] !== '"') return fail("expected string key");
        const k = str();
        ws();
        if (text[i] !== ":") return fail("expected ':'");
        i++;
        obj[k] = value();
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "}") { i++; return obj; }
        return fail("expected ',' or '}'");
      }
    }
    if (c === "[") {
      i++;
      const arr = [];
      ws();
      if (text[i] === "]") { i++; return arr; }
      while (true) {
        arr.push(value());
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "]") { i++; return arr; }
        return fail("expected ',' or ']'");
      }
    }
    if (c === '"') return str();
    if (c === "t") return lit("true", true);
    if (c === "f") return lit("false", false);
    if (c === "n") return lit("null", null);
    if (c === "-" || (c >= "0" && c <= "9")) return num();
    return fail(`unexpected token '${c}'`);
  };
  const v = value();
  ws();
  if (i < text.length) fail("unexpected trailing content");
  return v;
}

function processJson(text, mode, indent) {
  try {
    const value = parseJson(text);
    const space = mode === "minify" ? undefined
      : indent === "tab" ? "\t" : " ".repeat(+indent || 2);
    return { ok: true, out: JSON.stringify(value, null, space) };
  } catch (e) {
    return { ok: false, line: e.line || 1, col: e.col || 1, msg: e.message };
  }
}

if (typeof module !== "undefined") {
  module.exports = { parseJson, processJson };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const $ = (id) => document.getElementById(id);

  const run = (mode) => {
    const text = $("input").value;
    if (!text.trim()) {
      $("status").textContent = S.empty;
      $("status").className = "note";
      $("output").value = "";
      $("copy").hidden = true;
      return;
    }
    const r = processJson(text, mode, $("indent").value);
    if (r.ok) {
      $("output").value = r.out;
      $("status").textContent = S.ok_fmt.replace("{chars}", r.out.length);
      $("status").className = "note ok";
      $("copy").hidden = false;
    } else {
      $("output").value = "";
      $("status").textContent = S.err_fmt.replace("{line}", r.line)
        .replace("{col}", r.col).replace("{msg}", r.msg);
      $("status").className = "note err";
      $("copy").hidden = true;
    }
  };

  $("format").addEventListener("click", () => run("format"));
  $("minify").addEventListener("click", () => run("minify"));
  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = S.copied;
    setTimeout(() => { $("copy").textContent = S.copy; }, 1200);
  });
}
