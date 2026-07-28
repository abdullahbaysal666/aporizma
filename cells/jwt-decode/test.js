const assert = require("assert");
const { base64UrlDecodeText, decodeJwt, formatUnixDate } = require("./cell.js");

function b64url(obj) {
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeToken(header, payload, sig) {
  return `${b64url(header)}.${b64url(payload)}.${sig !== undefined ? sig : "sig"}`;
}

// Valid token round-trips header/payload exactly, keeps raw signature untouched.
{
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { sub: "123", role: "admin" };
  const r = decodeJwt(makeToken(header, payload, "abc123"));
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.header, header);
  assert.deepStrictEqual(r.payload, payload);
  assert.strictEqual(r.signature, "abc123");
}

// Turkish/non-ASCII text in payload survives (UTF-8 through Base64URL).
{
  const payload = { name: "Gölge şarkı İĞÜÇÖ ıi", city: "İzmir" };
  const r = decodeJwt(makeToken({ alg: "none" }, payload));
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.payload, payload);
}

// Wrong number of dot-separated parts -> format error.
for (const bad of ["", "onlyonepart", "two.parts", "a.b.c.d", "..", "a..c"]) {
  const r = decodeJwt(bad);
  assert.strictEqual(r.ok, false, bad);
  assert.strictEqual(r.reason, "format", bad);
}

// Header segment isn't valid Base64URL -> decode error, correct part flagged.
{
  const r = decodeJwt("not!!valid.eyJhIjoxfQ.sig");
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, "decode");
  assert.strictEqual(r.part, "header");
}

// Payload decodes as Base64URL but isn't valid JSON.
{
  const notJson = Buffer.from("not json", "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const r = decodeJwt(`${b64url({ alg: "none" })}.${notJson}.sig`);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, "json");
  assert.strictEqual(r.part, "payload");
}

// Surrounding whitespace on the whole token is tolerated.
{
  const token = makeToken({ alg: "none" }, { a: 1 });
  const r = decodeJwt(`  ${token}\n`);
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.payload, { a: 1 });
}

// base64UrlDecodeText: direct unit coverage, including invalid input -> null.
assert.strictEqual(base64UrlDecodeText(b64url({ x: 1 })), '{"x":1}');
assert.strictEqual(base64UrlDecodeText("!!!not-base64!!!"), null);

// formatUnixDate: known epoch value + invalid inputs.
assert.strictEqual(formatUnixDate(0), "1970-01-01 00:00:00 UTC");
assert.strictEqual(formatUnixDate(NaN), null);
assert.strictEqual(formatUnixDate("not a number"), null);
assert.strictEqual(formatUnixDate(undefined), null);

console.log("jwt-decode: OK");
