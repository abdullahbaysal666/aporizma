const assert = require("assert");
const nodeCrypto = require("crypto");
const { webcrypto } = nodeCrypto;
const { ALGOS, bufToHex, applyCase, hashText, hashAll, algoElementId } = require("./cell.js");

const digestFn = (algo, bytes) => webcrypto.subtle.digest(algo, bytes);

// Node's classic crypto module as an independent oracle (different code path
// than Web Crypto's subtle.digest) to catch encoding/hex-conversion bugs.
const oracle = (algo, text) =>
  nodeCrypto.createHash(algo.toLowerCase().replace("-", "")).update(Buffer.from(text, "utf8")).digest("hex");

async function main() {
  // bufToHex: known byte sequence -> exact hex, including zero-padding.
  const buf = new Uint8Array([0, 1, 15, 16, 255, 171]).buffer;
  assert.strictEqual(bufToHex(buf), "00010f10ffab");

  // applyCase: lower (default) and upper.
  assert.strictEqual(applyCase("ab12cd", false), "ab12cd");
  assert.strictEqual(applyCase("ab12cd", true), "AB12CD");

  // algoElementId: maps algo name to the DOM id the UI looks up.
  assert.strictEqual(algoElementId("SHA-1"), "out-sha1");
  assert.strictEqual(algoElementId("SHA-256"), "out-sha256");
  assert.strictEqual(algoElementId("SHA-384"), "out-sha384");
  assert.strictEqual(algoElementId("SHA-512"), "out-sha512");

  // hashText: well-known RFC test vector for "abc" (SHA-256), hardcoded sanity check.
  const abcSha256 = await hashText("abc", "SHA-256", digestFn);
  assert.strictEqual(abcSha256, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

  // hashText: every supported algorithm matches an independent oracle for the same input.
  for (const algo of ALGOS) {
    const got = await hashText("abc", algo, digestFn);
    assert.strictEqual(got, oracle(algo, "abc"), `${algo} mismatch vs oracle for "abc"`);
  }

  // hashText: empty string still produces the algorithm's defined digest of zero bytes.
  const emptyHash = await hashText("", "SHA-256", digestFn);
  assert.strictEqual(emptyHash, oracle("SHA-256", ""));
  assert.strictEqual(emptyHash.length, 64);

  // hashText: Turkish characters hash correctly as UTF-8 (not Latin-1/ASCII truncation).
  const trText = "İstanbul çöğüşı — Aporizma kuluçka";
  const trHash = await hashText(trText, "SHA-256", digestFn);
  assert.strictEqual(trHash, oracle("SHA-256", trText));

  // hashAll: returns every algorithm's digest, each matching the single-algo call.
  const all = await hashAll("aporizma", ALGOS, digestFn);
  assert.strictEqual(Object.keys(all).length, ALGOS.length);
  for (const algo of ALGOS) {
    assert.strictEqual(all[algo], await hashText("aporizma", algo, digestFn));
  }

  // hashText: unsupported algorithm (e.g. MD5, not exposed by Web Crypto) rejects.
  await assert.rejects(() => hashText("x", "MD5", digestFn));

  console.log("hash-gen: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
