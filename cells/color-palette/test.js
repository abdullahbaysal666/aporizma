const assert = require("assert");
const { quantizeChannel, toHex, extractPalette } = require("./cell.js");

// Channel quantization buckets 0..255 into `levels` groups.
assert.strictEqual(quantizeChannel(0, 8), 0);
assert.strictEqual(quantizeChannel(255, 8), 7);
assert.strictEqual(quantizeChannel(128, 8), 4);

// Hex formatting matches color-convert's style.
assert.strictEqual(toHex(255, 0, 0), "#ff0000");
assert.strictEqual(toHex(0, 0, 0), "#000000");
assert.strictEqual(toHex(1, 2, 3), "#010203");

// Empty pixel buffer -> no palette.
assert.deepStrictEqual(extractPalette([], 6, 8), []);

// Fully transparent image -> nothing counted, empty palette.
const transparent = [10, 20, 30, 0, 40, 50, 60, 0];
assert.deepStrictEqual(extractPalette(transparent, 6, 8), []);

// Single solid opaque color -> one swatch at 100%.
const solid = [];
for (let i = 0; i < 20; i++) solid.push(200, 100, 50, 255);
const soloPalette = extractPalette(solid, 6, 8);
assert.strictEqual(soloPalette.length, 1);
assert.strictEqual(soloPalette[0].hex, toHex(200, 100, 50));
assert.strictEqual(soloPalette[0].pct, 100);

// Two evenly split distinct colors -> two swatches, ~50/50, both present.
const half = [];
for (let i = 0; i < 10; i++) half.push(255, 0, 0, 255);
for (let i = 0; i < 10; i++) half.push(0, 0, 255, 255);
const halfPalette = extractPalette(half, 6, 8);
assert.strictEqual(halfPalette.length, 2);
assert.strictEqual(halfPalette[0].pct, 50);
assert.strictEqual(halfPalette[1].pct, 50);
const hexes = halfPalette.map((c) => c.hex).sort();
assert.deepStrictEqual(hexes, ["#0000ff", "#ff0000"]);

// k caps the number of returned swatches even with more distinct colors.
const many = [];
const colors = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255], [255, 0, 255], [128, 128, 128]];
for (const [r, g, b] of colors) for (let i = 0; i < 5; i++) many.push(r, g, b, 255);
assert.strictEqual(extractPalette(many, 3, 8).length, 3);
assert.strictEqual(extractPalette(many, 6, 8).length, 6);

// Fewer distinct colors than k -> only actual distinct count returned.
const twoColors = [];
for (let i = 0; i < 3; i++) twoColors.push(10, 10, 10, 255);
for (let i = 0; i < 3; i++) twoColors.push(200, 200, 200, 255);
assert.strictEqual(extractPalette(twoColors, 8, 8).length, 2);

// Mixed transparency: transparent pixels excluded from totals/percentages.
const mixed = [];
for (let i = 0; i < 5; i++) mixed.push(1, 2, 3, 255); // opaque
for (let i = 0; i < 5; i++) mixed.push(250, 250, 250, 0); // transparent, ignored
const mixedPalette = extractPalette(mixed, 6, 8);
assert.strictEqual(mixedPalette.length, 1);
assert.strictEqual(mixedPalette[0].pct, 100);
assert.strictEqual(mixedPalette[0].hex, toHex(1, 2, 3));

console.log("color-palette: OK");
