/* Date difference calculator. Pure logic first, DOM-free and node-testable. */
"use strict";

function parseDateInput(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

function dayCount(fromUtc, toUtc) {
  const MS_DAY = 86400000;
  return Math.round((toUtc.getTime() - fromUtc.getTime()) / MS_DAY);
}

function addMonthsClamped(date, n) {
  const totalMonth = date.getUTCFullYear() * 12 + date.getUTCMonth() + n;
  const targetY = Math.floor(totalMonth / 12);
  const targetM = ((totalMonth % 12) + 12) % 12;
  const daysInTargetMonth = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), daysInTargetMonth);
  return new Date(Date.UTC(targetY, targetM, day));
}

function calendarBreakdown(fromUtc, toUtc) {
  let start = fromUtc;
  let end = toUtc;
  let sign = 1;
  if (start.getTime() > end.getTime()) {
    [start, end] = [end, start];
    sign = -1;
  }
  let totalMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    + (end.getUTCMonth() - start.getUTCMonth());
  let candidate = addMonthsClamped(start, totalMonths);
  if (candidate.getTime() > end.getTime()) {
    totalMonths -= 1;
    candidate = addMonthsClamped(start, totalMonths);
  }
  const days = Math.round((end.getTime() - candidate.getTime()) / 86400000);
  const years = Math.trunc(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months, days, sign };
}

function businessDayCount(fromUtc, toUtc) {
  let start = fromUtc;
  let end = toUtc;
  if (start.getTime() > end.getTime()) [start, end] = [end, start];
  const MS_DAY = 86400000;
  const totalDays = Math.round((end.getTime() - start.getTime()) / MS_DAY);
  let count = 0;
  for (let i = 0; i <= totalDays; i++) {
    const day = new Date(start.getTime() + i * MS_DAY).getUTCDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function diffDates(fromStr, toStr) {
  const from = parseDateInput(fromStr);
  const to = parseDateInput(toStr);
  if (!from || !to) return null;

  const totalDays = dayCount(from, to);
  const { years, months, days, sign } = calendarBreakdown(from, to);
  const weeks = Math.trunc(Math.abs(totalDays) / 7);
  const weeksRemDays = Math.abs(totalDays) % 7;
  const businessDays = businessDayCount(from, to);

  return {
    totalDays,
    weeks,
    weeksRemDays,
    years,
    months,
    days,
    sign,
    businessDays,
  };
}

function todayIsoDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

if (typeof module !== "undefined") {
  module.exports = {
    parseDateInput, dayCount, calendarBreakdown, businessDayCount, diffDates, todayIsoDate,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;

  const fromInput = document.getElementById("from_date");
  const toInput = document.getElementById("to_date");
  const swapBtn = document.getElementById("swap");
  const todayFromBtn = document.getElementById("today_from");
  const todayToBtn = document.getElementById("today_to");
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  const outTotalDays = document.getElementById("out_total_days");
  const outWeeks = document.getElementById("out_weeks");
  const outCalendar = document.getElementById("out_calendar");
  const outBusiness = document.getElementById("out_business");

  const run = () => {
    const fromRaw = fromInput.value;
    const toRaw = toInput.value;
    if (!fromRaw || !toRaw) {
      status.textContent = S.empty;
      status.className = "note";
      result.hidden = true;
      return;
    }
    const r = diffDates(fromRaw, toRaw);
    if (!r) {
      status.textContent = S.invalid;
      status.className = "note err";
      result.hidden = true;
      return;
    }
    status.textContent = "";
    status.className = "note";

    const absTotal = Math.abs(r.totalDays);
    outTotalDays.textContent = r.totalDays === 0
      ? S.same_day
      : S.days_fmt.replace("{n}", String(absTotal)) + (r.sign < 0 ? ` (${S.past_suffix})` : "");

    outWeeks.textContent = S.weeks_fmt
      .replace("{w}", String(r.weeks))
      .replace("{d}", String(r.weeksRemDays));

    outCalendar.textContent = S.calendar_fmt
      .replace("{y}", String(r.years))
      .replace("{m}", String(r.months))
      .replace("{d}", String(r.days));

    outBusiness.textContent = S.business_fmt.replace("{n}", String(r.businessDays));

    result.hidden = false;
  };

  fromInput.addEventListener("input", run);
  toInput.addEventListener("input", run);

  swapBtn.addEventListener("click", () => {
    const tmp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = tmp;
    run();
  });

  todayFromBtn.addEventListener("click", () => {
    fromInput.value = todayIsoDate();
    run();
  });
  todayToBtn.addEventListener("click", () => {
    toInput.value = todayIsoDate();
    run();
  });

  fromInput.value = todayIsoDate();
  run();
}
