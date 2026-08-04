const assert = require("assert");
const {
  parseDateInput, ageBreakdown, daysLived, nextBirthday, ageResult, todayIsoDate, isoDate,
} = require("./cell.js");

// Basic valid parse.
const d1 = parseDateInput("2000-06-01");
assert.ok(d1 instanceof Date);
assert.strictEqual(d1.getUTCFullYear(), 2000);

// Invalid: bad format, empty, garbage, rollover date.
assert.strictEqual(parseDateInput(""), null);
assert.strictEqual(parseDateInput("01-06-2000"), null);
assert.strictEqual(parseDateInput("not-a-date"), null);
assert.strictEqual(parseDateInput("2023-02-30"), null);

// Exact multi-year span, no remainder: 2000-06-01 -> 2024-06-01 = 24y 0m 0d.
const r1 = ageResult("2000-06-01", "2024-06-01");
assert.strictEqual(r1.error, null);
assert.strictEqual(r1.years, 24);
assert.strictEqual(r1.months, 0);
assert.strictEqual(r1.days, 0);
assert.strictEqual(r1.totalDays, daysLived(parseDateInput("2000-06-01"), parseDateInput("2024-06-01")));

// Birthday is today -> next birthday countdown is 0, turning age equals current age.
assert.strictEqual(r1.nextBirthdayDaysUntil, 0);
assert.strictEqual(r1.nextBirthdayTurningAge, 24);

// One day after birthday: age rolls to 24y 0m 1d, next birthday is a year away, turning 25.
const r2 = ageResult("2000-06-01", "2024-06-02");
assert.strictEqual(r2.years, 24);
assert.strictEqual(r2.months, 0);
assert.strictEqual(r2.days, 1);
assert.strictEqual(r2.nextBirthdayDaysUntil, 364); // no Feb 29 falls within this span (2025 isn't leap)
assert.strictEqual(r2.nextBirthdayTurningAge, 25);

// One day before birthday: age is 23y 11m ~29-30d, next birthday is tomorrow.
const r3 = ageResult("2000-06-01", "2024-05-31");
assert.strictEqual(r3.years, 23);
assert.strictEqual(r3.months, 11);
assert.strictEqual(r3.nextBirthdayDaysUntil, 1);
assert.strictEqual(r3.nextBirthdayTurningAge, 24);

// Leap-day birth: Feb 29 2000 as-of a non-leap year (2025) falls back to Feb 28.
const nb = nextBirthday(parseDateInput("2000-02-29"), parseDateInput("2025-03-01"));
assert.strictEqual(isoDate(nb.date), "2026-02-28"); // Mar 1 2025 is already past Feb 28 2025
assert.strictEqual(nb.turningAge, 26);

// Leap-day birth, as-of before Feb 28 in a non-leap year -> lands on Feb 28 that same year.
const nb2 = nextBirthday(parseDateInput("2000-02-29"), parseDateInput("2025-01-01"));
assert.strictEqual(isoDate(nb2.date), "2025-02-28");
assert.strictEqual(nb2.turningAge, 25);

// Future birth date relative to as-of -> explicit error, not a negative age.
const r4 = ageResult("2030-01-01", "2024-01-01");
assert.strictEqual(r4.error, "future");

// Invalid input dates -> explicit error.
const r5 = ageResult("garbage", "2024-01-01");
assert.strictEqual(r5.error, "invalid");

// Same-day birth (as-of equals birth date) -> age is 0/0/0, birthday is today.
const r6 = ageResult("2024-03-15", "2024-03-15");
assert.strictEqual(r6.years, 0);
assert.strictEqual(r6.months, 0);
assert.strictEqual(r6.days, 0);
assert.strictEqual(r6.totalDays, 0);
assert.strictEqual(r6.nextBirthdayDaysUntil, 0);

// Weekday born: Jan 1 2000 was a Saturday (UTC day index 6).
assert.strictEqual(ageResult("2000-01-01", "2024-01-01").birthWeekday, 6);

// ageBreakdown across a month/day borrow (Jan 31 -> Mar 1 = 0y 1m 1d).
const bd = ageBreakdown(parseDateInput("2024-01-31"), parseDateInput("2024-03-01"));
assert.strictEqual(bd.years, 0);
assert.strictEqual(bd.months, 1);
assert.strictEqual(bd.days, 1);

// todayIsoDate returns a well-formed YYYY-MM-DD parseable by parseDateInput.
const t = todayIsoDate();
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(t));
assert.ok(parseDateInput(t) instanceof Date);

console.log("age-calc: OK");
