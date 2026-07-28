const assert = require("assert");
const { fitRect } = require("./cell.js");

const A4 = { w: 595.28, h: 841.89 };

// Dikey fotograf: sayfaya sigar, oran korunur, kenar boslugu asilmaz.
let r = fitRect(1080, 1920, A4.w, A4.h, 24);
assert.ok(r.width <= A4.w - 48 + 1e-6);
assert.ok(r.height <= A4.h - 48 + 1e-6);
assert.ok(Math.abs(r.width / r.height - 1080 / 1920) < 1e-6);

// Yatay fotograf da sigar ve ortalanir.
r = fitRect(1920, 1080, A4.w, A4.h, 24);
assert.ok(r.width <= A4.w - 48 + 1e-6);
assert.ok(Math.abs((r.x * 2 + r.width) - A4.w) < 1e-6);  // yatay ortalama
assert.ok(Math.abs((r.y * 2 + r.height) - A4.h) < 1e-6); // dikey ortalama

// Kare gorsel: genislik siniri belirler (A4 dikey).
r = fitRect(1000, 1000, A4.w, A4.h, 24);
assert.ok(Math.abs(r.width - (A4.w - 48)) < 1e-6);
assert.ok(Math.abs(r.width - r.height) < 1e-6);

// Kucuk gorsel bile buyutulerek sigdirilir (scale > 1 serbest).
r = fitRect(100, 100, A4.w, A4.h, 24);
assert.ok(r.width > 100);

console.log("belge-tara: ok");
