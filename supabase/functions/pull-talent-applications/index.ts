import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store",
  } });

type TalentRecord = {
  id: string; full_name: string; email: string; location: string | null;
  current_activity: string; preferred_pole: string; assigned_pole: string;
  contribution_type: string; skills: string; motivation: string;
  availability: string; portfolio_url: string | null; locale: string;
  status: string; consent_given_at: string; future_opportunities_consent: boolean;
  created_at: string; updated_at: string; retention_until: string;
};

const valid = (r: unknown): r is TalentRecord => {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return /^[0-9a-f-]{36}$/i.test(String(o.id)) &&
    typeof o.full_name === "string" && o.full_name.length <= 120 &&
    typeof o.email === "string" && o.email.length <= 254 &&
    typeof o.consent_given_at === "string" &&
    Number.isFinite(Date.parse(o.consent_given_at)) &&
    typeof o.retention_until === "string" &&
    Number.isFinite(Date.parse(o.retention_until)) &&
    Number.isFinite(Date.parse(String(o.updated_at))) &&
    Number.isFinite(Date.parse(String(o.created_at)));
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer /i, "");
  if (!jwt) return json({ error: "unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !role) return json({ error: "intranet_not_configured" }, 503);
  const admin = createClient(url, role, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);
  const { data: authorized, error: permissionError } = await admin.rpc(
    "can_access_rh_profiles", { _uid: auth.user.id },
  );
  if (permissionError || authorized !== true) return json({ error: "forbidden" }, 403);

  const base = Deno.env.get("BIB_PLATFORM_FUNCTIONS_URL");
  const secret = Deno.env.get("BIB_TALENT_BRIDGE_SECRET");
  if (!base || !secret || secret.length < 32)
    return json({ error: "talent_bridge_not_configured" }, 412);
  try {
    const received = new Map<string, TalentRecord>();
    let offset = 0;
    let complete = false;
    for (let page = 0; page < 500; page++) {
      const response = await fetch(base.replace(/\/$/, "") + "/intranet-talent-export", {
        method: "POST", signal: AbortSignal.timeout(30000),
        headers: { "Content-Type": "application/json", "x-bib-talent-bridge-key": secret },
        body: JSON.stringify({ offset }),
      });
      if (!response.ok) return json({ error: "platform_export_unavailable", upstream_status: response.status }, 502);
      const body = await response.json();
      if (body?.version !== 1 || body?.source !== "bib_talent" ||
          !Array.isArray(body.applications) || body.applications.length > 200 ||
          typeof body.complete !== "boolean")
        return json({ error: "invalid_talent_export" }, 502);
      for (const raw of body.applications) {
        if (!valid(raw)) return json({ error: "invalid_talent_record" }, 502);
        if (Date.parse(raw.retention_until) > Date.now() && raw.status !== "withdrawn")
          received.set(raw.id, raw);
      }
      if (body.complete) { complete = true; break; }
      if (!Number.isSafeInteger(body.next_offset) || body.next_offset <= offset)
        return json({ error: "invalid_talent_pagination" }, 502);
      offset = body.next_offset;
    }
    if (!complete) return json({ error: "talent_export_incomplete" }, 502);

    const rows = [...received.values()].map(r => ({
      platform_application_id: r.id, full_name: r.full_name, email: r.email,
      location: r.location, current_activity: r.current_activity,
      preferred_pole: r.preferred_pole, assigned_pole: r.assigned_pole,
      contribution_type: r.contribution_type, skills: r.skills,
      motivation: r.motivation, availability: r.availability,
      portfolio_url: r.portfolio_url, locale: r.locale,
      platform_status: r.status, consent_given_at: r.consent_given_at,
      future_opportunities_consent: r.future_opportunities_consent === true,
      submitted_at: r.created_at, platform_updated_at: r.updated_at,
      retention_until: r.retention_until, imported_at: new Date().toISOString(),
    }));
    // Upsert by source identity, not email. Existing manually handled candidate
    // workflows and statuses must never be overwritten by an import.
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await admin.from("hr_talent_applications")
        .upsert(rows.slice(i, i + 100), { onConflict: "platform_application_id" });
      if (error) return json({ error: "talent_intake_write_failed" }, 503);
    }
    // Deletion is delayed until a complete verified snapshot has been written.
    // Clear withdrawn, expired and erased Platform records from the private copy.
    // Platform does not export tombstones; therefore compare against full snapshot.
    const { data: existing, error: readError } = await admin
      .from("hr_talent_applications").select("platform_application_id").limit(10000);
    if (readError || !existing) return json({ error: "talent_retention_reconciliation_failed" }, 503);
    if (existing.length === 10000) return json({ error: "talent_retention_reconciliation_incomplete" }, 503);
    const obsolete = existing.map(row => row.platform_application_id as string)
      .filter(id => !received.has(id));
    for (let i = 0; i < obsolete.length; i += 100) {
      const { error } = await admin.from("hr_talent_applications")
        .delete().in("platform_application_id", obsolete.slice(i, i + 100));
      if (error) return json({ error: "talent_retention_cleanup_failed" }, 503);
    }
    return json({ ok: true, source: "bib_talent", imported: rows.length, purged: obsolete.length });
  } catch {
    return json({ error: "talent_sync_unavailable" }, 503);
  }
});
