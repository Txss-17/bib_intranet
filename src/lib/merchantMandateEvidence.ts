/**
 * Read-only projection of Platform merchant mandate evidence.
 * This module is deliberately transport-agnostic: Intrabib must obtain
 * records through an authenticated, role-authorized server bridge, never
 * from a browser using Platform service-role credentials.
 */
export type MandateKind = "procurement" | "invoicing" | "sav_assistance";
export type MerchantMandateEvidence = {
  id: string;
  mandate_key: MandateKind;
  document_version: string;
  document_sha256: string;
  accepted_at: string;
  revoked_at: string | null;
  evidence_id: string;
};
export type MandateEvidenceState = "recorded" | "revoked" | "invalid";

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const sha256 = /^[a-f0-9]{64}$/;
const mandateKinds = new Set<MandateKind>(["procurement", "invoicing", "sav_assistance"]);

export function classifyMandateEvidence(value: unknown): MandateEvidenceState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "invalid";
  const e = value as Record<string, unknown>;
  if (typeof e.id !== "string" || !uuid.test(e.id) ||
      typeof e.evidence_id !== "string" || !uuid.test(e.evidence_id) ||
      typeof e.mandate_key !== "string" || !mandateKinds.has(e.mandate_key as MandateKind) ||
      typeof e.document_version !== "string" || !e.document_version.trim() ||
      typeof e.document_sha256 !== "string" || !sha256.test(e.document_sha256) ||
      typeof e.accepted_at !== "string" || !Number.isFinite(Date.parse(e.accepted_at)))
    return "invalid";
  if (e.revoked_at !== null) {
    if (typeof e.revoked_at !== "string" ||
        !Number.isFinite(Date.parse(e.revoked_at)) ||
        Date.parse(e.revoked_at) < Date.parse(e.accepted_at)) return "invalid";
    return "revoked";
  }
  return "recorded";
}

/** A recorded event is not by itself proof that a mandate is currently enforceable. */
export function isMandateOperationallyAuthorized(_evidence: unknown): false {
  return false;
}
