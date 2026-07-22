const assert = require("assert");
const { slugify } = require("./cell.js");

assert.strictEqual(slugify("Hello World"), "hello-world");
assert.strictEqual(slugify("Yapay Zeka Çağı"), "yapay-zeka-cagi");
assert.strictEqual(slugify("İstanbul'da Yaşam"), "istanbul-da-yasam");
assert.strictEqual(slugify("TÜRKÇE İÇERİK"), "turkce-icerik");
assert.strictEqual(slugify("Section 42: Results!"), "section-42-results");
assert.strictEqual(slugify("  hello   ---world  "), "hello-world");
assert.strictEqual(slugify(""), "");
assert.strictEqual(slugify("!!!@@@"), "");
assert.strictEqual(slugify("café münchen"), "cafe-munchen");
assert.strictEqual(slugify("-hello-"), "hello");
assert.strictEqual(slugify("one two three four five", { maxLength: 11 }), "one-two");
assert.strictEqual(slugify("hello world", { maxLength: 3 }), "hel");
assert.strictEqual(slugify("Işık Hızı", { maxLength: 100 }), "isik-hizi");
console.log("slug-gen: OK");
