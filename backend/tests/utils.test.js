const test = require("node:test");
const assert = require("node:assert/strict");

const { chunkArray, backoffDelay } = require("../utils/batchUtils");
const { extractJsonArray } = require("../utils/jsonUtils");
const { sanitizeCrmRecord, recordHasContactInfo, rowHasContactInfo } = require("../utils/validation");

test("chunkArray splits evenly", () => {
  assert.deepEqual(chunkArray([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test("chunkArray handles size larger than array", () => {
  assert.deepEqual(chunkArray([1, 2], 10), [[1, 2]]);
});

test("chunkArray throws on invalid size", () => {
  assert.throws(() => chunkArray([1], 0));
});

test("backoffDelay grows with attempt number and stays capped", () => {
  const d0 = backoffDelay(0, 100, 1000);
  const d5 = backoffDelay(5, 100, 1000);
  assert.ok(d0 <= 1000 && d5 <= 1000);
});

test("extractJsonArray parses plain JSON array", () => {
  const result = extractJsonArray('[{"a":1}]');
  assert.deepEqual(result, [{ a: 1 }]);
});

test("extractJsonArray strips markdown code fences", () => {
  const result = extractJsonArray('```json\n[{"a":1}]\n```');
  assert.deepEqual(result, [{ a: 1 }]);
});

test("extractJsonArray strips surrounding prose", () => {
  const result = extractJsonArray('Here is the result:\n[{"a":1}]\nHope that helps!');
  assert.deepEqual(result, [{ a: 1 }]);
});

test("extractJsonArray throws on non-array JSON", () => {
  assert.throws(() => extractJsonArray('{"a":1}'));
});

test("extractJsonArray recovers complete objects from a truncated array", () => {
  // Simulates a response cut off mid-object, as happens when a model hits
  // its max output token limit partway through writing the array.
  const truncated = '[{"a":1,"b":"x"},{"a":2,"b":"y"},{"a":3,"b":"trunc';
  const result = extractJsonArray(truncated);
  assert.deepEqual(result, [
    { a: 1, b: "x" },
    { a: 2, b: "y" },
  ]);
});

test("extractJsonArray recovery ignores braces inside string values", () => {
  const truncated = '[{"note":"contains { and } inside a string","id":1},{"id":2,"cut';
  const result = extractJsonArray(truncated);
  assert.deepEqual(result, [{ note: "contains { and } inside a string", id: 1 }]);
});

test("extractJsonArray throws when nothing is recoverable", () => {
  assert.throws(() => extractJsonArray("[complete garbage, not json at all"));
});

test("sanitizeCrmRecord rejects hallucinated enum values", () => {
  const clean = sanitizeCrmRecord({
    crm_status: "SUPER_HOT_LEAD", // not in allowed list
    data_source: "leads_on_demand", // valid
  });
  assert.equal(clean.crm_status, "");
  assert.equal(clean.data_source, "leads_on_demand");
});

test("sanitizeCrmRecord strips newlines from every field", () => {
  const clean = sanitizeCrmRecord({ name: "John\nDoe", crm_note: "line1\nline2" });
  assert.equal(clean.name, "John Doe");
  assert.equal(clean.crm_note, "line1 line2");
});

test("sanitizeCrmRecord drops unparseable created_at", () => {
  const clean = sanitizeCrmRecord({ created_at: "not-a-real-date-at-all-xyz" });
  assert.equal(clean.created_at, "");
});

test("sanitizeCrmRecord keeps a valid created_at", () => {
  const clean = sanitizeCrmRecord({ created_at: "2026-05-13 14:20:48" });
  assert.equal(clean.created_at, "2026-05-13 14:20:48");
});

test("recordHasContactInfo true when email present", () => {
  assert.equal(recordHasContactInfo({ email: "a@b.com", mobile_without_country_code: "" }), true);
});

test("recordHasContactInfo false when both missing", () => {
  assert.equal(recordHasContactInfo({ email: "", mobile_without_country_code: "" }), false);
});

test("rowHasContactInfo detects email in arbitrary column", () => {
  assert.equal(rowHasContactInfo({ "Contact Info": "reach me at a@b.com" }), true);
});

test("rowHasContactInfo detects phone-like digit sequences", () => {
  assert.equal(rowHasContactInfo({ Notes: "call 9876543210 anytime" }), true);
});

test("rowHasContactInfo false when no contact info exists", () => {
  assert.equal(rowHasContactInfo({ Name: "John", City: "Mumbai" }), false);
});
