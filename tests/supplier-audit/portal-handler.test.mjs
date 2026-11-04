import test from "node:test";
import assert from "node:assert/strict";
import { createSupplierAuditPortalHandler } from "../../supabase/functions/_shared/supplier-audit-portal-handler.mjs";
const secret = "s".repeat(40),
  submission = "10000000-0000-4000-8000-000000000001",
  caseId = "20000000-0000-4000-8000-000000000001",
  key = "30000000-0000-4000-8000-000000000001",
  hash = "a".repeat(64);
const request = (body, token = secret) =>
  new Request("https://intrabib.test/audit", {
    method: "POST",
    headers: { "x-bib-bridge-key": token },
    body: JSON.stringify(body),
  });
const base = { schema_version: 1, submission_id: submission, action: "list" };
test("the private endpoint checks configuration, method and secret before opening its service client", async () => {
  let opened = 0;
  const getAdmin = () => {
    opened++;
    throw new Error();
  };
  let h = createSupplierAuditPortalHandler({ secret: "short", getAdmin });
  assert.equal((await h(request(base))).status, 503);
  h = createSupplierAuditPortalHandler({ secret, getAdmin });
  assert.equal((await h(request(base, "wrong"))).status, 401);
  assert.equal((await h(new Request("https://intra.test"))).status, 405);
  assert.equal(opened, 0);
});
test("unknown fields and malformed acceptances cannot call privileged SQL", async () => {
  const h = createSupplierAuditPortalHandler({
    secret,
    getAdmin: () => {
      throw new Error("should not open");
    },
  });
  assert.equal((await h(request({ ...base, actor_id: "forged" }))).status, 400);
  assert.equal(
    (
      await h(
        request({
          ...base,
          action: "accept",
          case_id: caseId,
          revision: 1,
          key,
          quote_hash: "bad",
          signatory: "Partner",
        }),
      )
    ).status,
    400,
  );
});
test("portal list is scoped to its verified submission, including an empty result", async () => {
  const calls = [];
  const h = createSupplierAuditPortalHandler({
    secret,
    getAdmin: () => ({
      rpc: async (name, args) => {
        calls.push([name, args]);
        return { data: [], error: null };
      },
    }),
  });
  const r = await h(request(base));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { cases: [] });
  assert.deepEqual(calls, [
    ["list_supplier_audit_portal", { p_submission_id: submission }],
  ]);
});
test("acceptance of another supplier case is rejected before mutation", async () => {
  let mutations = 0;
  const h = createSupplierAuditPortalHandler({
    secret,
    getAdmin: () => ({
      rpc: async (name) => {
        if (name === "advance_supplier_audit_case") mutations++;
        return { data: [], error: null };
      },
    }),
  });
  const r = await h(
    request({
      ...base,
      action: "accept",
      case_id: caseId,
      revision: 1,
      key,
      quote_hash: hash,
      signatory: "Partner",
    }),
  );
  assert.equal(r.status, 404);
  assert.equal(mutations, 0);
});
test("acceptance retains its key, revision and hash but never exposes internal mutation data", async () => {
  const calls = [];
  let accepted = false;
  const h = createSupplierAuditPortalHandler({
    secret,
    getAdmin: () => ({
      rpc: async (name, args) => {
        calls.push([name, args]);
        if (name === "advance_supplier_audit_case") {
          accepted = true;
          return {
            data: {
              internal_note: "PRIVATE",
              payments: [{ bank_reference: "PRIVATE" }],
            },
            error: null,
          };
        }
        return {
          data: [{ id: caseId, quote_state: accepted ? "accepted" : "sent" }],
          error: null,
        };
      },
    }),
  });
  const r = await h(
    request({
      ...base,
      action: "accept",
      case_id: caseId,
      revision: 7,
      key,
      quote_hash: hash,
      signatory: " Partner ",
    }),
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), {
    cases: [{ id: caseId, quote_state: "accepted" }],
  });
  assert.deepEqual(calls[1], [
    "advance_supplier_audit_case",
    {
      p_id: caseId,
      p_revision: 7,
      p_key: key,
      p_action: "portal_accept",
      p_payload: {
        submission_id: submission,
        signatory: "Partner",
        quote_hash: hash,
      },
    },
  ]);
});
test("revision errors are reported as conflicts without returning internal SQL details", async () => {
  const h = createSupplierAuditPortalHandler({
    secret,
    getAdmin: () => ({
      rpc: async (name) =>
        name === "list_supplier_audit_portal"
          ? { data: [{ id: caseId }], error: null }
          : {
              data: null,
              error: { code: "40001", message: "PRIVATE SQL DETAILS" },
            },
    }),
  });
  const r = await h(
    request({
      ...base,
      action: "accept",
      case_id: caseId,
      revision: 1,
      key,
      quote_hash: hash,
      signatory: "Partner",
    }),
  );
  assert.equal(r.status, 409);
  assert.deepEqual(await r.json(), { error: "quote_changed" });
});
