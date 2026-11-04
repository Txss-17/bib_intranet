const uuid = (v) =>
  typeof v === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    v,
  );
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
export function createLegalGovernanceBridgeHandler({
  getCaller,
  getAdmin,
  url,
  secret,
  fetcher = fetch,
}) {
  return async (request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers });
    if (request.method !== "POST")
      return json({ error: "method_not_allowed" }, 405);
    const token = request.headers
      .get("Authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: "unauthorized" }, 401);
    let target;
    try {
      target = new URL(url);
      if (
        target.protocol !== "https:" ||
        target.username ||
        target.password ||
        typeof secret !== "string" ||
        secret.length < 32
      )
        throw new Error();
    } catch {
      return json({ error: "legal_bridge_unavailable" }, 503);
    }
    let body;
    try {
      const text = await request.text();
      if (text.length > 250000)
        return json({ error: "payload_too_large" }, 413);
      body = JSON.parse(text);
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !["identity_snapshot", "create_identity", "deliver"].includes(body.action)
    )
      return json({ error: "invalid_legal_action" }, 400);
    const allowed =
      body.action === "deliver"
        ? ["action", "record_id"]
        : body.action === "identity_snapshot"
          ? ["action", "store_id"]
          : ["action", "store_id", "key", "expected_snapshot_hash", "fields"];
    if (
      Object.keys(body).some((k) => !allowed.includes(k)) ||
      !uuid(body.action === "deliver" ? body.record_id : body.store_id)
    )
      return json({ error: "invalid_legal_fields" }, 400);
    if (
      body.action === "create_identity" &&
      (!uuid(body.key) ||
        typeof body.expected_snapshot_hash !== "string" ||
        !/^[a-f0-9]{64}$/.test(body.expected_snapshot_hash) ||
        !body.fields ||
        typeof body.fields !== "object" ||
        Array.isArray(body.fields))
    )
      return json({ error: "invalid_identity_request" }, 400);
    if (
      body.action === "create_identity" &&
      Object.keys(body.fields).some((k) =>
        [
          "VENDEUR_NOM_LEGAL",
          "SIREN_SIRET",
          "ADRESSE",
          "CONTACT_VENDEUR",
          "TELEPHONE",
        ].includes(k),
      )
    )
      return json({ error: "identity_source_fields_are_readonly" }, 400);
    try {
      const caller = getCaller(token);
      const auth = await caller.auth.getUser(token);
      if (auth.error || !auth.data?.user)
        return json({ error: "unauthorized" }, 401);
      const mode = await caller.rpc("intranet_is_test_mode");
      if (mode.error || typeof mode.data !== "boolean")
        throw new Error("environment_unavailable");
      const environment = mode.data ? "sandbox" : "live";
      const remote = async (payload) => {
        const response = await fetcher(target.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bib-bridge-key": secret,
          },
          body: JSON.stringify({ schema_version: 1, environment, ...payload }),
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw new Error("legal_platform_unavailable");
        const result = await response.json();
        if (result?.ok !== true) throw new Error("invalid_legal_response");
        return result;
      };
      if (body.action === "deliver") {
        const exported = await caller.rpc("export_legal_governance_record", {
          p_id: body.record_id,
        });
        if (exported.error) throw exported.error;
        if (!exported.data || exported.data.environment !== environment)
          throw new Error("legal_environment_mismatch");
        const result = await remote({
          action: "deliver",
          record: exported.data,
        });
        if (!["applied", "replayed", "stale"].includes(result.result))
          throw new Error("invalid_legal_ack");
        const ack = await getAdmin().rpc(
          "acknowledge_legal_governance_delivery",
          { p_id: body.record_id, p_sequence: exported.data.delivery_sequence },
        );
        if (ack.error) throw ack.error;
        return json({ ok: true, result: result.result });
      }
      const rights = await Promise.all(
        ["read", "create"].map((p_action) =>
          caller.rpc("can_intranet_action", {
            p_page: "compliance.contracts",
            p_action,
          }),
        ),
      );
      if (rights.some((r) => r.error || r.data !== true))
        return json({ error: "legal_access_denied" }, 403);
      const { snapshot } = await remote({
        action: "identity_snapshot",
        store_id: body.store_id,
      });
      if (
        !snapshot ||
        snapshot.store_id !== body.store_id ||
        !uuid(snapshot.owner_id) ||
        typeof snapshot.base_hash !== "string" ||
        !snapshot.fields
      )
        throw new Error("invalid_identity_snapshot");
      if (body.action === "identity_snapshot")
        return json({ ok: true, snapshot });
      if (snapshot.base_hash !== body.expected_snapshot_hash)
        return json({ error: "identity_changed" }, 409);
      const result = await caller.rpc("create_legal_governance_record", {
        p_key: body.key,
        p_kind: "identity",
        p_payload: {
          store_id: snapshot.store_id,
          owner_id: snapshot.owner_id,
          fields: { ...body.fields, ...snapshot.fields },
        },
      });
      if (result.error) throw result.error;
      return json({ ok: true, record: result.data });
    } catch (error) {
      return json(
        {
          error:
            error?.code === "42501"
              ? "legal_access_denied"
              : error?.code === "40001"
                ? "legal_record_changed"
                : "legal_bridge_unavailable",
        },
        error?.code === "42501" ? 403 : error?.code === "40001" ? 409 : 503,
      );
    }
  };
}
