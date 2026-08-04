/* Age calculator. Pure logic first, DOM-free and node-testable. */
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

function addMonthsClamped(date, n) {
  const totalMonth = date.getUTCFullYear() * 12 + date.getUTCMonth() + n;
  const targetY = Math.floor(totalMonth / 12);
  const targetM = ((totalMonth % 12) + 12) % 12;
  const daysInTargetMonth = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), daysInTargetMonth);
  return new Date(Date.UTC(targetY, targetM, day));
}

function ageBreakdown(birthUtc, asOfUtc) {
  let totalMonths = (asOfUtc.getUTCFullYear() - birthUtc.getUTCFullYear()) * 12
    + (asOfUtc.getUTCMonth() - birthUtc.getUTCMonth());
  let candidate = addMonthsClamped(birthUtc, totalMonths);
  if (candidate.getTime() > asOfUtc.getTime()) {
    totalMonths -= 1;
    candidate = addMonthsClamped(birthUtc, totalMonths);
  }
  const days = Math.round((asOfUtc.getTime() - candidate.getTime()) / 86400000);
  const years = Math.trunc(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months, days };
}

function daysLived(birthUtc, asOfUtc) {
  return Math.round((asOfUtc.getTime() - birthUtc.getTime()) / 86400000);
}

function birthdayInYear(birthUtc, year) {
  const month = birthUtc.getUTCMonth();
  const day = birthUtc.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, daysInMonth)));
}

function nextBirthday(birthUtc, asOfUtc) {
  const year = asOfUtc.getUTCFullYear();
  let candidate = birthdayInYear(birthUtc, year);
  if (candidate.getTime() < asOfUtc.getTime()) {
    candidate = birthdayInYear(birthUtc, year + 1);
  }
  const daysUntil = Math.round((candidate.getTime() - asOfUtc.getTime()) / 86400000);
  const turningAge = candidate.getUTCFullYear() - birthUtc.getUTCFullYear();
  return { date: candidate, daysUntil, turningAge };
}

function ageResult(birthStr, asOfStr) {
  const birth = parseDateInput(birthStr);
  const asOf = parseDateInput(asOfStr);
  if (!birth || !asOf) return { error: "invalid" };
  if (birth.getTime() > asOf.getTime()) return { error: "future" };

  const { years, months, days } = ageBreakdown(birth, asOf);
  const totalDays = daysLived(birth, asOf);
  const totalWeeks = Math.trunc(totalDays / 7);
  const nb = nextBirthday(birth, asOf);

  return {
    error: null,
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    nextBirthdayDate: nb.date,
    nextBirthdayDaysUntil: nb.daysUntil,
    nextBirthdayTurningAge: nb.turningAge,
    birthWeekday: birth.getUTCDay(),
  };
}

function todayIsoDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

if (typeof module !== "undefined") {
  module.exports = {
    parseDateInput, ageBreakdown, daysLived, nextBirthday, ageResult, todayIsoDate, isoDate,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;

  const birthInput = document.getElementById("birth_date");
  const asOfInput = document.getElementById("asof_date");
  const todayBtn = document.getElementById("today_asof");
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  const outAge = document.getElementById("out_age");
  const outTotalDays = document.getElementById("out_total_days");
  const outTotalWeeks = document.getElementById("out_total_weeks");
  const outNextBirthday = document.getElementById("out_next_birthday");
  const outWeekday = document.getElementById("out_weekday");

  const run = () => {
    const birthRaw = birthInput.value;
    const asOfRaw = asOfInput.value || todayIsoDate();
    if (!birthRaw) {
      status.textContent = S.empty;
      status.className = "note";
      result.hidden = true;
      return;
    }
    const r = ageResult(birthRaw, asOfRaw);
    if (r.error === "invalid") {
      status.textContent = S.invalid;
      status.className = "note err";
      result.hidden = true;
      return;
    }
    if (r.error === "future") {
      status.textContent = S.future_error;
      status.className = "note err";
      result.hidden = true;
      return;
    }
    status.textContent = "";
    status.className = "note";

    outAge.textContent = S.age_fmt
      .replace("{y}", String(r.years))
      .replace("{m}", String(r.months))
      .replace("{d}", String(r.days));

    outTotalDays.textContent = S.days_fmt.replace("{n}", String(r.totalDays));
    outTotalWeeks.textContent = S.weeks_fmt.replace("{n}", String(r.totalWeeks));

    outNextBirthday.textContent = r.nextBirthdayDaysUntil === 0
      ? S.next_birthday_today.replace("{age}", String(r.nextBirthdayTurningAge))
      : S.next_birthday_fmt
        .replace("{date}", isoDate(r.nextBirthdayDate))
        .replace("{n}", String(r.nextBirthdayDaysUntil))
        .replace("{age}", String(r.nextBirthdayTurningAge));

    outWeekday.textContent = S.born_weekday_fmt.replace("{weekday}", S.weekday_names[r.birthWeekday]);

    result.hidden = false;
  };

  birthInput.addEventListener("input", run);
  asOfInput.addEventListener("input", run);

  todayBtn.addEventListener("click", () => {
    asOfInput.value = todayIsoDate();
    run();
  });

  asOfInput.value = todayIsoDate();
  run();
}
