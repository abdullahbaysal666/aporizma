const assert = require("assert");
const { targetSize, humanSize } = require("./cell.js");

// Downscale keeps aspect ratio.
assert.deepStrictEqual(targetSize(4000, 3000, 1600), { w: 1600, h: 1200, scaled: true });
assert.deepStrictEqual(targetSize(1920, 1080, 640), { w: 640, h: 360, scaled: true });

// Never enlarge: smaller images pass through.
assert.deepStrictEqual(targetSize(800, 600, 1600), { w: 800, h: 600, scaled: false });
assert.deepStrictEqual(targetSize(1600, 900, 1600), { w: 1600, h: 900, scaled: false });

// Extreme portrait keeps at least 1px and rounds sanely.
const tall = targetSize(100, 10000, 50);
assert.strictEqual(tall.w, 50);
assert.strictEqual(tall.h, 5000);
assert.ok(targetSize(10000, 1, 50).h >= 1);

// Invalid inputs -> null.
assert.strictEqual(targetSize(0, 100, 640), null);
assert.strictEqual(targetSize(100, 100, 0), null);

// Human sizes.
assert.strictEqual(humanSize(2097152), "2.0 MB");
assert.strictEqual(humanSize(51200), "50 KB");
assert.strictEqual(humanSize(100), "1 KB"); // asla "0 KB" gosterme
console.log("img-resize: OK");
