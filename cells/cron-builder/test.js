const assert = require("assert");
const { parseCron, explain } = require("./cell.js");

assert.strictEqual(parseCron("*/5 * * *"), null); // 4 fields
assert.strictEqual(parseCron("61x * * * *"), null);
assert.ok(parseCron("0 9 * * 1-5"));

assert.strictEqual(explain("* * * * *", "en"), "Every minute");
assert.strictEqual(explain("*/5 * * * *", "en"), "Every 5 minutes");
assert.strictEqual(explain("*/5 * * * *", "tr"), "5 dakikada bir");
assert.strictEqual(explain("0 * * * *", "tr"), "Her saatin 0. dakikasında");
assert.strictEqual(explain("0 0 * * *", "en"), "At 00:00, every day");
assert.strictEqual(explain("0 9 * * 1-5", "tr"), "Saat 09:00'de, Pazartesi-Cuma arası günleri");
assert.strictEqual(explain("0 9 * * 1-5", "en"), "At 09:00, on Monday through Friday");
assert.strictEqual(explain("0 3 1 * *", "tr"), "Saat 03:00'de, ayın 1. günü");
assert.strictEqual(explain("30 8,18 * * *", "en"), "At 08:30, 18:30, every day");
assert.strictEqual(explain("0 0 * * 0", "en"), "At 00:00, on Sunday");
assert.strictEqual(explain("15 */6 * * *", "tr"), "6 saatte bir, 15. dakikada");
assert.strictEqual(explain("0 12 * 6 *", "en"), "At 12:00, in June");
console.log("cron-builder: OK");
