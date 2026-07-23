const assert = require("assert");
const { splitLines, processLines, processText } = require("./cell.js");

// No options: lines pass through unchanged.
assert.deepStrictEqual(processLines("b\na\nc"), ["b", "a", "c"]);

// Trim removes leading/trailing whitespace per line.
assert.deepStrictEqual(processLines("  a  \n b\n", { trim: true }), ["a", "b", ""]);

// Remove blank lines (including whitespace-only lines).
assert.deepStrictEqual(
  processLines("a\n\n  \nb", { removeEmpty: true }),
  ["a", "b"]
);

// Dedupe keeps first occurrence, is case-sensitive.
assert.deepStrictEqual(
  processLines("a\nb\na\nA\nb", { dedupe: true }),
  ["a", "b", "A"]
);

// Sort ascending with Turkish locale collation.
assert.deepStrictEqual(
  processLines("elma\narmut\nçay", { sort: "asc" }),
  ["armut", "çay", "elma"]
);

// Sort descending.
assert.deepStrictEqual(
  processLines("a\nc\nb", { sort: "desc" }),
  ["c", "b", "a"]
);

// Reverse order.
assert.deepStrictEqual(processLines("a\nb\nc", { reverse: true }), ["c", "b", "a"]);

// Combined: dedupe before sort, then reverse un-does sort direction.
assert.deepStrictEqual(
  processLines("b\na\nb\nc", { dedupe: true, sort: "asc", reverse: true }),
  ["c", "b", "a"]
);

// CRLF and CR line endings are normalized.
assert.deepStrictEqual(splitLines("a\r\nb\rc"), ["a", "b", "c"]);

// processText rejoins with \n.
assert.strictEqual(processText("b\na", { sort: "asc" }), "a\nb");

// Empty input.
assert.deepStrictEqual(processLines(""), [""]);

console.log("line-tools: OK");
