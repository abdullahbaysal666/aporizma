const assert = require("assert");
const {
  parseDelimited,
  detectDelimiter,
  escapeCell,
  alignSeparator,
  rowsToMarkdown,
  textToMarkdownTable,
} = require("./cell.js");

// parseDelimited: basic comma rows.
assert.deepStrictEqual(parseDelimited("a,b,c\n1,2,3", ","), [["a", "b", "c"], ["1", "2", "3"]]);

// parseDelimited: quoted field containing the delimiter.
assert.deepStrictEqual(parseDelimited('name,note\n"Ada, Lovelace",hi', ","), [
  ["name", "note"],
  ["Ada, Lovelace", "hi"],
]);

// parseDelimited: tab-separated (TSV) input.
assert.deepStrictEqual(parseDelimited("a\tb\n1\t2", "\t"), [["a", "b"], ["1", "2"]]);

// detectDelimiter picks whichever of , ; \t appears most in the first line.
assert.strictEqual(detectDelimiter("a;b;c\n1;2;3"), ";");
assert.strictEqual(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");
assert.strictEqual(detectDelimiter("a,b,c\n1,2,3"), ",");

// escapeCell: pipe characters are escaped so they don't break the table.
assert.strictEqual(escapeCell("a|b"), "a\\|b");

// escapeCell: embedded newlines become <br> so a cell stays one line.
assert.strictEqual(escapeCell("line1\nline2"), "line1<br>line2");
assert.strictEqual(escapeCell("line1\r\nline2"), "line1<br>line2");

// escapeCell: null/undefined become an empty string.
assert.strictEqual(escapeCell(undefined), "");
assert.strictEqual(escapeCell(null), "");

// alignSeparator: none/left/center/right at the minimum width (3).
assert.strictEqual(alignSeparator(3, "none"), "---");
assert.strictEqual(alignSeparator(3, "left"), ":--");
assert.strictEqual(alignSeparator(3, "center"), ":-:");
assert.strictEqual(alignSeparator(3, "right"), "--:");

// alignSeparator: wider column (6).
assert.strictEqual(alignSeparator(6, "none"), "------");
assert.strictEqual(alignSeparator(6, "left"), ":-----");
assert.strictEqual(alignSeparator(6, "center"), ":----:");
assert.strictEqual(alignSeparator(6, "right"), "-----:");

// rowsToMarkdown: basic table, no alignment (values already at the min width
// of 3, so padding is a no-op and the full string is exact and unambiguous).
const basicRows = [["abc", "def"], ["123", "456"], ["ghi", "jkl"]];
assert.strictEqual(
  rowsToMarkdown(basicRows, "none"),
  "| abc | def |\n| --- | --- |\n| 123 | 456 |\n| ghi | jkl |"
);

// rowsToMarkdown: left/center/right alignment change only the separator row.
assert.strictEqual(
  rowsToMarkdown(basicRows, "left"),
  "| abc | def |\n| :-- | :-- |\n| 123 | 456 |\n| ghi | jkl |"
);
assert.strictEqual(
  rowsToMarkdown(basicRows, "center"),
  "| abc | def |\n| :-: | :-: |\n| 123 | 456 |\n| ghi | jkl |"
);
assert.strictEqual(
  rowsToMarkdown(basicRows, "right"),
  "| abc | def |\n| --: | --: |\n| 123 | 456 |\n| ghi | jkl |"
);

// rowsToMarkdown: ragged row (fewer fields than the header) fills missing
// cells with an empty string instead of throwing or shifting columns.
const raggedLines = rowsToMarkdown([["a", "b"], ["1"]], "none").split("\n");
assert.strictEqual(raggedLines.length, 3);
assert.ok(raggedLines[2].trim().startsWith("| 1"));

// rowsToMarkdown: a pipe character inside a cell is escaped, not treated as
// a new column.
assert.ok(rowsToMarkdown([["a", "b"], ["x|y", "z"]], "none").includes("x\\|y"));

// rowsToMarkdown: an embedded newline inside a cell becomes <br>.
assert.ok(rowsToMarkdown([["a", "b"], ["line1\nline2", "z"]], "none").includes("line1<br>line2"));

// rowsToMarkdown: empty rows list yields an empty string.
assert.strictEqual(rowsToMarkdown([], "none"), "");

// textToMarkdownTable: empty/whitespace-only input yields zero rows/cols.
assert.deepStrictEqual(textToMarkdownTable("", ",", "none"), { markdown: "", rows: 0, cols: 0 });
assert.deepStrictEqual(textToMarkdownTable("   ", ",", "none"), { markdown: "", rows: 0, cols: 0 });

// textToMarkdownTable: header-only input (no data rows) reports 0 rows.
const headerOnly = textToMarkdownTable("a,b,c", ",", "none");
assert.strictEqual(headerOnly.rows, 0);
assert.strictEqual(headerOnly.cols, 3);
assert.strictEqual(headerOnly.markdown.split("\n").length, 2);

// textToMarkdownTable: reports row/column counts and works with a TSV delimiter.
const tsvResult = textToMarkdownTable("name\tage\nAda\t30\nGrace\t85", "\t", "none");
assert.strictEqual(tsvResult.rows, 2);
assert.strictEqual(tsvResult.cols, 2);

// textToMarkdownTable: Turkish characters pass through untouched.
const trResult = textToMarkdownTable("şehir,ülke\nİstanbul,Türkiye", ",", "none");
assert.ok(trResult.markdown.includes("İstanbul"));
assert.ok(trResult.markdown.includes("Türkiye"));
assert.ok(trResult.markdown.includes("şehir"));

console.log("md-table: OK");
