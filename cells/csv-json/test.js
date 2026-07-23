const assert = require("assert");
const { parseCSV, detectDelimiter, csvToJson, jsonToCsv, csvField } = require("./cell.js");

// Basic parseCSV: simple comma rows.
assert.deepStrictEqual(parseCSV("a,b,c\n1,2,3", ","), [["a", "b", "c"], ["1", "2", "3"]]);

// Quoted field containing the delimiter.
assert.deepStrictEqual(parseCSV('name,note\n"Ada, Lovelace",hi', ","), [
  ["name", "note"],
  ["Ada, Lovelace", "hi"],
]);

// Quoted field containing an embedded newline.
assert.deepStrictEqual(parseCSV('a,b\n"line1\nline2",x', ","), [
  ["a", "b"],
  ["line1\nline2", "x"],
]);

// Escaped double-quote ("" -> ") inside a quoted field.
assert.deepStrictEqual(parseCSV('a\n"she said ""hi"""', ","), [["a"], ['she said "hi"']]);

// CRLF line endings are treated like LF.
assert.deepStrictEqual(parseCSV("a,b\r\n1,2\r\n", ","), [["a", "b"], ["1", "2"]]);

// detectDelimiter picks whichever of , ; \t appears most in the first line.
assert.strictEqual(detectDelimiter("a;b;c\n1;2;3"), ";");
assert.strictEqual(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");
assert.strictEqual(detectDelimiter("a,b,c\n1,2,3"), ",");

// csvToJson: header row becomes keys, rows become objects.
assert.deepStrictEqual(csvToJson("name,age\nAda,30\nGrace,85", ","), [
  { name: "Ada", age: "30" },
  { name: "Grace", age: "85" },
]);

// csvToJson: ragged row (fewer fields than header) fills missing with "".
assert.deepStrictEqual(csvToJson("a,b,c\n1,2", ","), [{ a: "1", b: "2", c: "" }]);

// csvToJson: Turkish characters pass through untouched.
assert.deepStrictEqual(csvToJson("şehir,ülke\nİstanbul,Türkiye", ","), [
  { şehir: "İstanbul", ülke: "Türkiye" },
]);

// csvToJson: empty input yields empty array.
assert.deepStrictEqual(csvToJson("", ","), []);
assert.deepStrictEqual(csvToJson("   ", ","), []);

// csvToJson: header only, no data rows.
assert.deepStrictEqual(csvToJson("a,b,c", ","), []);

// jsonToCsv: round-trips an array of flat objects.
const csvOut = jsonToCsv('[{"name":"Ada","age":30},{"name":"Grace","age":85}]', ",");
assert.strictEqual(csvOut, "name,age\r\nAda,30\r\nGrace,85");

// jsonToCsv: header is the union of keys across all objects (missing -> empty).
const unionOut = jsonToCsv('[{"a":1,"b":2},{"a":3,"c":4}]', ",");
assert.strictEqual(unionOut, "a,b,c\r\n1,2,\r\n3,,4");

// jsonToCsv: values needing quotes (embedded delimiter, quote, newline) are escaped.
assert.strictEqual(csvField('has,comma', ","), '"has,comma"');
assert.strictEqual(csvField('has "quote"', ","), '"has ""quote"""');
assert.strictEqual(csvField('line1\nline2', ","), '"line1\nline2"');
assert.strictEqual(csvField("plain", ","), "plain");

// jsonToCsv: a single (non-array) object is treated as a one-row table.
assert.strictEqual(jsonToCsv('{"a":1,"b":2}', ","), "a,b\r\n1,2");

// jsonToCsv: invalid JSON throws so the UI can show an error.
assert.throws(() => jsonToCsv("not json", ","));

// jsonToCsv: empty input yields empty string.
assert.strictEqual(jsonToCsv("", ","), "");
assert.strictEqual(jsonToCsv("[]", ","), "");

// Semicolon delimiter works end-to-end for both directions.
assert.deepStrictEqual(csvToJson("a;b\n1;2", ";"), [{ a: "1", b: "2" }]);
assert.strictEqual(jsonToCsv('[{"a":"1","b":"2"}]', ";"), "a;b\r\n1;2");

console.log("csv-json: OK");
