/* Epoch <-> date converter. Unit auto-detected from digit count. Pure logic first. */
"use strict";

function classifyUnit(intLen) {
  if (intLen <= 10) return "s";
  if (intLen <= 13) return "ms";
  return null;
}

function parseEpoch(raw) {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  const intLen = String(Math.trunc(Math.abs(value))).length;
  const unit = classifyUnit(intLen);
  if (!unit) return null;
  const ms = unit === "s" ? value * 1000 : value;
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return { unit, ms };
}

function epochToIso(ms) {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function epochToUtcString(ms) {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toUTCString();
}

function nowEpoch() {
  const ms = Date.now();
  return { s: Math.floor(ms / 1000), ms };
}

function dateTimeLocalToMs(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function msToDateTimeLocalValue(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

if (typeof module !== "undefined") {
  module.exports = {
    classifyUnit, parseEpoch, epochToIso, epochToUtcString,
    nowEpoch, dateTimeLocalToMs, msToDateTimeLocalValue,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const epochInput = document.getElementById("epoch");
  const now1 = document.getElementById("now1");
  const status1 = document.getElementById("status1");
  const result1 = document.getElementById("result1");
  const outIso = document.getElementById("out_iso");
  const outUtc = document.getElementById("out_utc");
  const outLocal = document.getElementById("out_local");

  const runEpoch = () => {
    const raw = epochInput.value;
    if (!raw.trim()) {
      status1.textContent = S.empty;
      status1.className = "note";
      result1.hidden = true;
      return;
    }
    const parsed = parseEpoch(raw);
    if (!parsed) {
      status1.textContent = S.invalid;
      status1.className = "note err";
      result1.hidden = true;
      return;
    }
    status1.textContent = S.unit_fmt.replace("{unit}", parsed.unit === "s" ? S.unit_s : S.unit_ms);
    status1.className = "note ok";
    outIso.textContent = epochToIso(parsed.ms);
    outUtc.textContent = epochToUtcString(parsed.ms);
    outLocal.textContent = `${new Date(parsed.ms).toLocaleString()} (${tz})`;
    result1.hidden = false;
  };

  epochInput.addEventListener("input", runEpoch);
  now1.addEventListener("click", () => {
    epochInput.value = String(nowEpoch().ms);
    runEpoch();
  });

  const dtInput = document.getElementById("datetime");
  const now2 = document.getElementById("now2");
  const outS = document.getElementById("out_s");
  const outMs = document.getElementById("out_ms");

  const runDate = () => {
    const ms = dateTimeLocalToMs(dtInput.value);
    if (ms === null) {
      outS.textContent = "";
      outMs.textContent = "";
      return;
    }
    outS.textContent = String(Math.floor(ms / 1000));
    outMs.textContent = String(ms);
  };

  dtInput.addEventListener("input", runDate);
  now2.addEventListener("click", () => {
    dtInput.value = msToDateTimeLocalValue(Date.now());
    runDate();
  });

  document.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target || !target.textContent) return;
      await navigator.clipboard.writeText(target.textContent);
      const old = btn.textContent;
      btn.textContent = S.copied;
      setTimeout(() => (btn.textContent = old), 1200);
    });
  });

  epochInput.value = String(nowEpoch().ms);
  runEpoch();
  dtInput.value = msToDateTimeLocalValue(Date.now());
  runDate();
}
