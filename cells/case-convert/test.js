const assert = require("assert");
const {
  splitWords, caseUpper, caseLower, caseTitle,
  caseCamel, casePascal, caseSnake, caseKebab, caseConstant,
} = require("./cell.js");

// splitWords: spaces, hyphens, underscores, camelCase boundaries, acronyms.
assert.deepStrictEqual(splitWords("hello world"), ["hello", "world"]);
assert.deepStrictEqual(splitWords("hello-world_example"), ["hello", "world", "example"]);
assert.deepStrictEqual(splitWords("helloWorldExample"), ["hello", "World", "Example"]);
assert.deepStrictEqual(splitWords("HTMLParser"), ["HTML", "Parser"]);
assert.deepStrictEqual(splitWords("  "), []);
assert.deepStrictEqual(splitWords(""), []);

// Basic upper/lower, English.
assert.strictEqual(caseUpper("Hello World", false), "HELLO WORLD");
assert.strictEqual(caseLower("Hello World", false), "hello world");

// Turkish-correct casing: i -> İ, I -> ı (opposite of English default).
assert.strictEqual(caseUpper("istanbul", true), "İSTANBUL");
assert.strictEqual(caseUpper("istanbul", false), "ISTANBUL");
assert.strictEqual(caseLower("İSTANBUL", true), "istanbul");
assert.strictEqual(caseLower("ISTANBUL", true), "ıstanbul");

// Title case.
assert.strictEqual(caseTitle("hello world", false), "Hello World");
assert.strictEqual(caseTitle("THE quick BROWN fox", false), "The Quick Brown Fox");
assert.strictEqual(caseTitle("istanbul kar", true), "İstanbul Kar");

// camelCase / PascalCase / snake_case / kebab-case / CONSTANT_CASE — all
// round-trip through the same word tokenizer regardless of source delimiter.
for (const input of ["hello world example", "hello-world-example", "hello_world_example", "helloWorldExample"]) {
  assert.strictEqual(caseCamel(input, false), "helloWorldExample", input);
  assert.strictEqual(casePascal(input, false), "HelloWorldExample", input);
  assert.strictEqual(caseSnake(input, false), "hello_world_example", input);
  assert.strictEqual(caseKebab(input, false), "hello-world-example", input);
  assert.strictEqual(caseConstant(input, false), "HELLO_WORLD_EXAMPLE", input);
}

// Turkish words through the identifier converters.
assert.strictEqual(caseSnake("İstanbul Kar Yağışı", true), "istanbul_kar_yağışı");
assert.strictEqual(caseConstant("istanbul kar", true), "İSTANBUL_KAR");

// Single word — no boundary to split on.
assert.strictEqual(caseCamel("hello", false), "hello");
assert.strictEqual(casePascal("hello", false), "Hello");

// Empty input.
assert.strictEqual(caseUpper("", false), "");
assert.deepStrictEqual(splitWords("   "), []);
assert.strictEqual(caseSnake("", false), "");

console.log("case-convert: OK");
