const uuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
function equal(a, b) {
  const x = new TextEncoder().encode(a),
    y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

/** Only Platform's server supplies submission_id after verifying the partner token. */
export function createSupplierAuditPortalHandler({ secret, getAdmin }) {
  return async (request) => {
    if (request.method !== "POST")
      return json({ error: "method_not_allowed" }, 405);
    if (typeof secret !== "string" || secret.length < 32)
      return json({ error: "audit_portal_not_configured" }, 503);
    if (!equal(request.headers.get("x-bib-bridge-key") ?? "", secret))
      return json({ error: "unauthorized" }, 401);
    let body;
    try {
      const text = await request.text();
      if (text.length > 12000) return json({ error: "payload_too_large" }, 413);
      body = JSON.parse(text);
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      body.schema_version !== 1 ||
      !uuid(body.submission_id) ||
      !["list", "accept", "list_references"].includes(body.action)
    )
      return json({ error: "invalid_audit_request" }, 400);
    const fields =
      ["list", "list_references"].includes(body.action)
        ? ["schema_version", "submission_id", "action"]
        : [
            "schema_version",
            "submission_id",
            "action",
            "case_id",
            "revision",
            "key",
            "quote_hash",
            "signatory",
          ];
    if (Object.keys(body).some((k) => !fields.includes(k)))
      return json({ error: "invalid_audit_fields" }, 400);
    if (
      body.action === "accept" &&
      (!uuid(body.case_id) ||
        !uuid(body.key) ||
        !Number.isInteger(body.revision) ||
        body.revision < 1 ||
        body.revision > 2147483647 ||
        typeof body.quote_hash !== "string" ||
        !/^[a-f0-9]{64}$/.test(body.quote_hash) ||
        typeof body.signatory !== "string" ||
        body.signatory.trim().length < 2 ||
        body.signatory.trim().length > 200)
    )
      return json({ error: "invalid_audit_acceptance" }, 400);
    try {
      const admin = getAdmin();
      const list = async () => {
        const r = await admin.rpc("list_supplier_audit_portal", {
          p_submission_id: body.submission_id,
        });
        if (r.error) throw r.error;
        if (!Array.isArray(r.data)) throw new Error("invalid_audit_response");
        return r.data;
      };
      if (body.action === "list_references") {
        const result = await admin.rpc("list_supplier_portal_reference_decisions", {
          p_submission_id: body.submission_id,
        });
        if (result.error) throw result.error;
        if (!Array.isArray(result.data)) throw new Error("reference_decisions_unavailable");
        return json({ references: result.data });
      }
      const cases = await list();
      if (body.action === "list") return json({ cases });
      if (!cases.some((c) => c.id === body.case_id))
        return json({ error: "audit_not_found" }, 404);
      const result = await admin.rpc("advance_supplier_audit_case", {
        p_id: body.case_id,
        p_revision: body.revision,
        p_key: body.key,
        p_action: "portal_accept",
        p_payload: {
          submission_id: body.submission_id,
          signatory: body.signatory.trim(),
          quote_hash: body.quote_hash,
        },
      });
      if (result.error) throw result.error;
      // Never return the internal mutation result: it contains staff notes/proofs.
      return json({ cases: await list() });
    } catch (error) {
      const code = error?.code;
      return json(
        {
          error:
            code === "40001"
              ? "quote_changed"
              : code === "42501"
                ? "audit_access_denied"
                : code === "22023"
                  ? "audit_acceptance_invalid"
                  : "audit_service_unavailable",
        },
        code === "40001"
          ? 409
          : code === "42501"
            ? 403
            : code === "22023"
              ? 400
              : 503,
      );
    }
  };
}
