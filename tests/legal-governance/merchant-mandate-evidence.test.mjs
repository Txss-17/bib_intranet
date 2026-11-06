import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Intranet has no Vitest dependency. Load the production TS module using the
// TypeScript compiler already installed for the app's CI build.
const source = await readFile(
  new URL("../../src/lib/merchantMandateEvidence.ts", import.meta.url), "utf8",
);
const transformed = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.deepEqual(transformed.diagnostics ?? [], []);
const { classifyMandateEvidence, isMandateOperationallyAuthorized } =
  await import("data:text/javascript;charset=utf-8," + encodeURIComponent(transformed.outputText));

const recorded = {
  id: "10000000-0000-4000-8000-000000000001",
  evidence_id: "10000000-0000-4000-8000-000000000002",
  mandate_key: "procurement",
  document_version: "v1",
  document_sha256: "a".repeat(64),
  accepted_at: "2026-11-06T09:00:00Z",
  revoked_at: null,
};

test("recorded evidence does not confer operational authorization", () => {
  assert.equal(classifyMandateEvidence(recorded), "recorded");
  assert.equal(isMandateOperationallyAuthorized(recorded), false);
});

test("revocation is distinguished from a recorded acceptance", () => {
  assert.equal(classifyMandateEvidence({
    ...recorded, revoked_at: "2026-11-06T10:00:00Z",
  }), "revoked");
  assert.equal(classifyMandateEvidence({
    ...recorded, revoked_at: "2026-11-05T10:00:00Z",
  }), "invalid");
});

test("invalid mandate kind, hash, identity, and timestamps are rejected", () => {
  assert.equal(classifyMandateEvidence({ ...recorded, mandate_key: "all" }), "invalid");
  assert.equal(classifyMandateEvidence({ ...recorded, document_sha256: "invalid" }), "invalid");
  assert.equal(classifyMandateEvidence({ ...recorded, evidence_id: "not-a-uuid" }), "invalid");
  assert.equal(classifyMandateEvidence({ ...recorded, accepted_at: "not-a-date" }), "invalid");
});
