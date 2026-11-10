import { test } from "node:test";
import assert from "node:assert/strict";
import { checkStagingTarget, checkPair } from "../../scripts/check-staging-targets.mjs";

test("requires separately approved expected database names", () => {
  assert.throws(() => checkStagingTarget("postgresql://u:p@host/staging", "", "Platform"));
  assert.throws(() => checkStagingTarget("postgresql://u:p@host/production", "staging", "Platform"));
});
test("rejects malformed or insecure remote targets", () => {
  assert.throws(() => checkStagingTarget("http://host/staging", "staging", "Platform"));
  assert.throws(() => checkStagingTarget("postgresql://u:p@host/staging?sslmode=disable", "staging", "Platform"));
});
test("rejects same database for both apps", () => {
  const a = checkStagingTarget("postgresql://u:p@host/platform_stage", "platform_stage", "Platform");
  assert.throws(() => checkPair(a, a));
  const b = checkStagingTarget("postgresql://u:p@host/intranet_stage", "intranet_stage", "Intranet");
  assert.doesNotThrow(() => checkPair(a, b));
});
