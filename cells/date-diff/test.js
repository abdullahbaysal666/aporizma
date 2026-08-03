const assert = require("assert");
const {
  parseDateInput, dayCount, calendarBreakdown, businessDayCount, diffDates, todayIsoDate,
} = require("./cell.js");

// Basic valid parse.
const d1 = parseDateInput("2024-01-15");
assert.ok(d1 instanceof Date);
assert.strictEqual(d1.getUTCFullYear(), 2024);
assert.strictEqual(d1.getUTCMonth(), 0);
assert.strictEqual(d1.getUTCDate(), 15);

// Invalid: bad format, empty, garbage.
assert.strictEqual(parseDateInput(""), null);
assert.strictEqual(parseDateInput("15-01-2024"), null);
assert.strictEqual(parseDateInput("not-a-date"), null);

// Invalid: rollover date (Feb 30 doesn't exist).
assert.strictEqual(parseDateInput("2023-02-30"), null);

// Same day.
const same = diffDates("2024-06-01", "2024-06-01");
assert.strictEqual(same.totalDays, 0);
assert.strictEqual(same.years, 0);
assert.strictEqual(same.months, 0);
assert.strictEqual(same.days, 0);

// Simple forward span: exactly 10 days.
const r1 = diffDates("2024-01-01", "2024-01-11");
assert.strictEqual(r1.totalDays, 10);
assert.strictEqual(r1.weeks, 1);
assert.strictEqual(r1.weeksRemDays, 3);
assert.strictEqual(r1.sign, 1);

// Reversed order: end before start -> negative total, sign -1.
const r2 = diffDates("2024-01-11", "2024-01-01");
assert.strictEqual(r2.totalDays, -10);
assert.strictEqual(r2.sign, -1);

// Calendar breakdown across month/day borrow (Jan 31 -> Mar 1 = 1 month 1 day).
const r3 = diffDates("2024-01-31", "2024-03-01");
assert.strictEqual(r3.years, 0);
assert.strictEqual(r3.months, 1);
assert.strictEqual(r3.days, 1);

// Leap year: Feb 29 2024 exists and is one year later than Feb 28 2023 + 1 day logic.
const leap = parseDateInput("2024-02-29");
assert.ok(leap instanceof Date);
assert.strictEqual(parseDateInput("2023-02-29"), null); // not a leap year

// Full year span.
const r4 = diffDates("2020-03-15", "2023-03-15");
assert.strictEqual(r4.years, 3);
assert.strictEqual(r4.months, 0);
assert.strictEqual(r4.days, 0);

// Business days: a full Mon-Fri work week (Mon 2024-01-01 .. Fri 2024-01-05) = 5.
const bd1 = businessDayCount(parseDateInput("2024-01-01"), parseDateInput("2024-01-05"));
assert.strictEqual(bd1, 5);

// Business days: full week incl weekend (Mon..Sun) = 5.
const bd2 = businessDayCount(parseDateInput("2024-01-01"), parseDateInput("2024-01-07"));
assert.strictEqual(bd2, 5);

// Business days: single Saturday = 0.
const bd3 = businessDayCount(parseDateInput("2024-01-06"), parseDateInput("2024-01-06"));
assert.strictEqual(bd3, 0);

// dayCount raw helper agrees with diffDates for a known span.
assert.strictEqual(dayCount(parseDateInput("2024-01-01"), parseDateInput("2024-02-01")), 31);

// todayIsoDate returns a well-formed YYYY-MM-DD matching parseDateInput.
const t = todayIsoDate();
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(t));
assert.ok(parseDateInput(t) instanceof Date);

console.log("date-diff: OK");
