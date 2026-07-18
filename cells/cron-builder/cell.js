/* Cron explainer: 5-field cron -> plain EN/TR sentence. Pure logic first. */
"use strict";

const L = {
  en: {
    everyMin: "Every minute",
    everyNMin: (n) => `Every ${n} minutes`,
    everyNHour: (n, m) => `Every ${n} hours at minute ${m}`,
    atMinute: (m) => `At minute ${m} of every hour`,
    atTime: (t) => `At ${t}`,
    times: (ts) => `At ${ts.join(", ")}`,
    everyDay: "every day",
    dom: (d) => `on day ${d} of the month`,
    domList: (d) => `on days ${d} of the month`,
    months: (m) => `in ${m}`,
    dows: (d) => `on ${d}`,
    dowRange: (a, b) => `${a} through ${b}`,
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    monthNames: ["", "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"],
    and: " and ",
  },
  tr: {
    everyMin: "Her dakika",
    everyNMin: (n) => `${n} dakikada bir`,
    everyNHour: (n, m) => `${n} saatte bir, ${m}. dakikada`,
    atMinute: (m) => `Her saatin ${m}. dakikasında`,
    atTime: (t) => `Saat ${t}'de`,
    times: (ts) => `Saat ${ts.join(", ")}'de`,
    everyDay: "her gün",
    dom: (d) => `ayın ${d}. günü`,
    domList: (d) => `ayın ${d}. günleri`,
    months: (m) => `${m} ayında`,
    dows: (d) => `${d} günleri`,
    dowRange: (a, b) => `${a}-${b} arası`,
    dayNames: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
    monthNames: ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
      "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    and: " ve ",
  },
};

const FIELD_RE = /^(\*|\d{1,2}(-\d{1,2})?(,\d{1,2}(-\d{1,2})?)*|\*\/\d{1,2}|\d{1,2}-\d{1,2}\/\d{1,2})$/;

function parseCron(expr) {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5 || !fields.every((f) => FIELD_RE.test(f))) return null;
  return { min: fields[0], hour: fields[1], dom: fields[2], mon: fields[3], dow: fields[4] };
}

function names(field, list, t) {
  // "1-5" | "1,3" | "3" -> named items (for dow/month)
  if (field.includes("-") && !field.includes(",")) {
    const [a, b] = field.split("-").map(Number);
    return t.dowRange(list[a % list.length] ?? a, list[b % list.length] ?? b);
  }
  return field.split(",").map((x) => list[Number(x) % list.length] ?? x).join(t.and);
}

function explain(expr, lang) {
  const c = parseCron(expr);
  if (!c) return null;
  const t = L[lang] || L.en;
  const pad = (x) => String(x).padStart(2, "0");
  let head;

  if (c.min === "*" && c.hour === "*") head = t.everyMin;
  else if (c.min.startsWith("*/") && c.hour === "*") head = t.everyNMin(c.min.slice(2));
  else if (/^\d+$/.test(c.min) && c.hour === "*") head = t.atMinute(Number(c.min));
  else if (/^\d+$/.test(c.min) && c.hour.startsWith("*/"))
    head = t.everyNHour(c.hour.slice(2), Number(c.min));
  else if (/^\d+$/.test(c.min) && /^[\d,]+$/.test(c.hour))
    head = c.hour.includes(",")
      ? t.times(c.hour.split(",").map((h) => `${pad(h)}:${pad(c.min)}`))
      : t.atTime(`${pad(c.hour)}:${pad(c.min)}`);
  else head = `${c.min} ${c.hour}`; // uncommon combos: raw but never wrong

  const tail = [];
  if (c.dom !== "*")
    tail.push(c.dom.includes(",") || c.dom.includes("-") ? t.domList(c.dom) : t.dom(c.dom));
  if (c.mon !== "*") tail.push(t.months(names(c.mon, t.monthNames, t)));
  if (c.dow !== "*") tail.push(t.dows(names(c.dow, t.dayNames, t)));
  const periodic = c.min === "*" || c.hour === "*"
    || c.min.startsWith("*/") || c.hour.startsWith("*/");
  if (!tail.length && !periodic) tail.push(t.everyDay);
  return tail.length ? `${head}, ${tail.join(", ")}` : head;
}

if (typeof module !== "undefined") {
  module.exports = { parseCron, explain };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const lang = document.documentElement.lang || "en";
  const expr = document.getElementById("expr");
  const meaning = document.getElementById("meaning");
  const cp = document.getElementById("copy");

  const run = () => {
    const desc = explain(expr.value, lang);
    meaning.textContent = desc || S.invalid;
    meaning.className = desc ? "" : "err";
  };
  expr.addEventListener("input", run);

  const box = document.getElementById("presets");
  for (const [value, label] of S.presets) {
    const b = document.createElement("button");
    b.className = "btn ghost";
    b.textContent = label;
    b.title = value;
    b.addEventListener("click", () => { expr.value = value; run(); });
    box.appendChild(b);
  }
  cp.addEventListener("click", async () => {
    await navigator.clipboard.writeText(expr.value);
    cp.textContent = S.copied;
    setTimeout(() => (cp.textContent = S.copy), 1200);
  });
  run();
}
