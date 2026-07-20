const assert = require("assert");
const { parseJson, processJson } = require("./cell.js");

// Format: nested + Turkish characters survive.
let r = processJson('{"ad":"Gölge","liste":[1,2]}', "format", "2");
assert.ok(r.ok);
assert.strictEqual(r.out, '{\n  "ad": "Gölge",\n  "liste": [\n    1,\n    2\n  ]\n}');

// Tab indent.
r = processJson('{"a":1}', "format", "tab");
assert.strictEqual(r.out, '{\n\t"a": 1\n}');

// Minify.
r = processJson('{\n  "a": [1, 2],\n  "b": "x"\n}', "minify", "2");
assert.strictEqual(r.out, '{"a":[1,2],"b":"x"}');

// Error position: broken on line 3.
r = processJson('{\n  "a": 1,\n  "b": ,\n}', "format", "2");
assert.strictEqual(r.ok, false);
assert.strictEqual(r.line, 3);
assert.ok(r.col >= 8, `col was ${r.col}`);

// Error on single line: position -> col.
r = processJson('{"a": }', "format", "2");
assert.strictEqual(r.ok, false);
assert.strictEqual(r.line, 1);
assert.ok(r.col >= 6);

// Top-level scalars are valid JSON.
assert.ok(processJson("42", "format", "2").ok);
assert.ok(processJson('"str"', "minify", "2").ok);
assert.ok(processJson("-1.5e3", "minify", "2").ok);
assert.ok(processJson("true", "minify", "2").ok);

// Own parser agrees with the native engine on tricky valid inputs.
for (const good of ['{"a\\u00e7ık":"değer \\"tırnak\\""}', "[[],{},[{}]]",
                    '{"n":-0.5e-2,"b":[true,false,null]}', '  "x"  ']) {
  assert.deepStrictEqual(parseJson(good), JSON.parse(good), good);
}

// And rejects what the engine rejects.
for (const bad of ["{'a':1}", '{"a":1,}', '[1 2]', '{"a" 1}', '"unterminated',
                   '{"a":01}', "nul", '{"a":1}x']) {
  assert.strictEqual(processJson(bad, "format", "2").ok, false, bad);
  assert.throws(() => JSON.parse(bad), bad);
}

// Trailing-content error points at the right spot.
const tr = processJson('{"a":1}\nxx', "format", "2");
assert.strictEqual(tr.line, 2);
assert.strictEqual(tr.col, 1);
console.log("json-format: OK");
