import { describe, expect, it } from "vitest";
import { classifyMandateEvidence, isMandateOperationallyAuthorized } from "@/lib/merchantMandateEvidence";

const evidence = {
  id: "10000000-0000-4000-8000-000000000001",
  evidence_id: "10000000-0000-4000-8000-000000000002",
  mandate_key: "procurement",
  document_version: "v1",
  document_sha256: "a".repeat(64),
  accepted_at: "2026-11-06T09:00:00Z",
  revoked_at: null,
};

describe("merchant mandate evidence projection", () => {
  it("recognizes a structurally recorded event but never authorizes operations", () => {
    expect(classifyMandateEvidence(evidence)).toBe("recorded");
    expect(isMandateOperationallyAuthorized(evidence)).toBe(false);
  });
  it("separates revocation from acceptance", () => {
    expect(classifyMandateEvidence({ ...evidence, revoked_at: "2026-11-06T10:00:00Z" })).toBe("revoked");
    expect(classifyMandateEvidence({ ...evidence, revoked_at: "2026-11-05T10:00:00Z" })).toBe("invalid");
  });
  it("rejects unrecognized mandates and malformed proof", () => {
    expect(classifyMandateEvidence({ ...evidence, mandate_key: "all" })).toBe("invalid");
    expect(classifyMandateEvidence({ ...evidence, document_sha256: "invalid" })).toBe("invalid");
  });
});
