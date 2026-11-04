import test from "node:test";
import assert from "node:assert/strict";
import { createLegalGovernanceBridgeHandler } from "../../supabase/functions/_shared/legal-governance-bridge-handler.mjs";
const id = "10000000-0000-4000-8000-000000000001",
  owner = "20000000-0000-4000-8000-000000000001";
const hash = "a".repeat(64),
  secret = "s".repeat(40);
const request = (body, token = "valid") =>
  new Request("https://example.test", {
    method: "POST",
    headers: token ? { Authorization: "Bearer " + token } : {},
    body: JSON.stringify(body),
  });
function setup(overrides = {}) {
  const calls = [];
  const remote = [];
  const acks = [];
  let rights = true,
    remoteOk = true;
  const caller = {
    auth: {
      getUser: async () => ({ data: { user: { id: owner } }, error: null }),
    },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (name === "intranet_is_test_mode") return { data: false, error: null };
      if (name === "can_intranet_action") return { data: rights, error: null };
      if (name === "export_legal_governance_record")
        return {
          data: { id, environment: "live", delivery_sequence: 12 },
          error: null,
        };
      return {
        data: { id, kind: "identity", state: "draft", payload: args.p_payload },
        error: null,
      };
    },
  };
  const handler = createLegalGovernanceBridgeHandler({
    url: "https://example.test/legal-governance-import",
    secret,
    getCaller: () => caller,
    getAdmin: () => ({
      rpc: async (name, args) => {
        acks.push([name, args]);
        return { error: null };
      },
    }),
    fetcher: async (_, init) => {
      const body = JSON.parse(init.body);
      remote.push(body);
      return new Response(
        JSON.stringify(
          remoteOk
            ? {
                ok: true,
                ...(body.action === "identity_snapshot"
                  ? {
                      snapshot: {
                        store_id: id,
                        owner_id: owner,
                        base_hash: hash,
                        fields: {
                          VENDEUR_NOM_LEGAL: "Vendeur",
                          SIREN_SIRET: "123456789",
                        },
                      },
                    }
                  : { result: "applied" }),
              }
            : { error: "private remote error" },
        ),
        { status: remoteOk ? 200 : 500 },
      );
    },
    ...overrides,
  });
  return {
    handler,
    calls,
    remote,
    acks,
    setRights: (value) => {
      rights = value;
    },
    failRemote: () => {
      remoteOk = false;
    },
  };
}
test("the bridge requires an authenticated user and configured private server destination", async () => {
  const s = setup();
  assert.equal(
    (await s.handler(request({ action: "deliver", record_id: id }, null)))
      .status,
    401,
  );
  assert.equal(s.calls.length, 0);
  assert.equal(
    (
      await setup({ url: "http://example.test" }).handler(
        request({ action: "deliver", record_id: id }),
      )
    ).status,
    503,
  );
});
test("revoked saved rights prevent an identity lookup before contacting Platform", async () => {
  const s = setup();
  s.setRights(false);
  assert.equal(
    (await s.handler(request({ action: "identity_snapshot", store_id: id })))
      .status,
    403,
  );
  assert.equal(s.remote.length, 0);
  assert.equal(s.acks.length, 0);
});
test("identity creation rereads the trusted owner and base fields, pins the displayed snapshot and never accepts browser replacements", async () => {
  const s = setup();
  const body = {
    action: "create_identity",
    store_id: id,
    key: id,
    expected_snapshot_hash: hash,
    fields: { FORME_OU_EI: "EI" },
  };
  assert.equal(
    (
      await s.handler(
        request({ ...body, fields: { VENDEUR_NOM_LEGAL: "forged" } }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await s.handler(
        request({ ...body, expected_snapshot_hash: "b".repeat(64) }),
      )
    ).status,
    409,
  );
  assert.equal((await s.handler(request(body))).status, 200);
  const call = s.calls.find(
    ([name]) => name === "create_legal_governance_record",
  );
  assert.equal(call[1].p_payload.owner_id, owner);
  assert.equal(call[1].p_payload.fields.VENDEUR_NOM_LEGAL, "Vendeur");
  assert.equal(call[1].p_payload.fields.FORME_OU_EI, "EI");
});
test("delivery reads the authorized current SQL record and acknowledges only its exact confirmed sequence", async () => {
  const s = setup();
  assert.equal(
    (await s.handler(request({ action: "deliver", record_id: id }))).status,
    200,
  );
  assert.deepEqual(s.remote[0], {
    schema_version: 1,
    environment: "live",
    action: "deliver",
    record: { id, environment: "live", delivery_sequence: 12 },
  });
  assert.deepEqual(s.acks, [
    ["acknowledge_legal_governance_delivery", { p_id: id, p_sequence: 12 }],
  ]);
});
test("failed remote delivery remains unacknowledged and private errors are not exposed", async () => {
  const s = setup();
  s.failRemote();
  const response = await s.handler(
    request({ action: "deliver", record_id: id }),
  );
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("private remote"));
  assert.equal(s.acks.length, 0);
});
