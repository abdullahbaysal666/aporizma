const assert = require("assert");
const { parseColor, hslToRgb, rgbToHsl, formatAll } = require("./cell.js");

// HEX parse: long, short, no-hash, alpha.
assert.deepStrictEqual(parseColor("#1e90ff"), { r: 30, g: 144, b: 255, a: 1 });
assert.deepStrictEqual(parseColor("#fff"), { r: 255, g: 255, b: 255, a: 1 });
assert.deepStrictEqual(parseColor("1e90ff"), { r: 30, g: 144, b: 255, a: 1 });
assert.strictEqual(parseColor("#1e90ff80").a.toFixed(2), "0.50");

// RGB / HSL parse.
assert.deepStrictEqual(parseColor("rgb(30, 144, 255)"), { r: 30, g: 144, b: 255, a: 1 });
assert.strictEqual(parseColor("rgba(0,0,0,0.5)").a, 0.5);
const fromHsl = parseColor("hsl(210, 100%, 56%)");
assert.ok(Math.abs(fromHsl.r - 31) <= 1 && Math.abs(fromHsl.g - 143) <= 2 && fromHsl.b === 255);

// Round trip: rgb -> hsl -> rgb stays close.
const hsl = rgbToHsl(30, 144, 255);
const back = hslToRgb(hsl.h, hsl.s, hsl.l);
assert.ok(Math.abs(back.r - 30) <= 3 && Math.abs(back.g - 144) <= 3 && Math.abs(back.b - 255) <= 3);

// Grays: no NaN hue.
assert.deepStrictEqual(rgbToHsl(128, 128, 128), { h: 0, s: 0, l: 50 });

// Format.
const f = formatAll({ r: 30, g: 144, b: 255, a: 1 });
assert.strictEqual(f.hex, "#1e90ff");
assert.strictEqual(f.rgb, "rgb(30, 144, 255)");
assert.ok(/^hsl\(21\d, 100%, 5\d%\)$/.test(f.hsl), f.hsl);
const fa = formatAll({ r: 0, g: 0, b: 0, a: 0.5 });
assert.strictEqual(fa.hex, "#00000080");
assert.strictEqual(fa.rgb, "rgba(0, 0, 0, 0.5)");

// Invalid inputs -> null.
for (const bad of ["", "xyz", "#12", "rgb(300,0,0)", "hsl(0,150%,50%)", "#12345"]) {
  assert.strictEqual(parseColor(bad), null, bad);
}
console.log("color-convert: OK");
