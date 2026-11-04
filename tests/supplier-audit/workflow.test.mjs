import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const supplierUser = "10000000-0000-4000-8000-000000000001";
const auditor = "10000000-0000-4000-8000-000000000002";
const finance = "10000000-0000-4000-8000-000000000003";
const reviewer = "10000000-0000-4000-8000-000000000004";
const outsider = "10000000-0000-4000-8000-000000000005";
const supplier = "20000000-0000-4000-8000-000000000001";
const otherSupplier = "20000000-0000-4000-8000-000000000002";
const sandboxSupplier = "20000000-0000-4000-8000-000000000003";
const submission = "30000000-0000-4000-8000-000000000001";
let db;
before(async () => {
  db = new PGlite();
  await db.exec(`
 CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid()RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION auth.role()RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
 GRANT USAGE ON SCHEMA public,auth TO authenticated,service_role,anon;
 CREATE TABLE public.test_grants(actor uuid,page text,action text,PRIMARY KEY(actor,page,action));
 CREATE FUNCTION public.can_intranet_action(p text,a text)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM test_grants WHERE actor=auth.uid() AND page=p AND action=a)$$;
 CREATE FUNCTION public.intranet_is_test_mode()RETURNS boolean LANGUAGE sql STABLE AS $$SELECT coalesce(current_setting('test.sandbox',true),'false')='true'$$;
 CREATE TABLE public.suppliers(id uuid PRIMARY KEY,name text,owner_id uuid,test_account boolean DEFAULT false);
 ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
 CREATE POLICY supplier_owner ON public.suppliers FOR SELECT TO authenticated USING(owner_id=auth.uid());
 GRANT SELECT ON public.suppliers TO authenticated;
 `);
  await db.exec(
    await readFile(
      new URL(
        "../../drizzle/migrations/0083_supplier_audit_commercial_workflow.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query(
    "INSERT INTO suppliers VALUES($1,'Nom proche',$2,false),($3,'Nom proche autre',$4,false),($5,'Sandbox',$2,true)",
    [supplier, supplierUser, otherSupplier, outsider, sandboxSupplier],
  );
});
after(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(
    "TRUNCATE supplier_audit_cases,supplier_audit_case_events,supplier_audit_payment_evidence,supplier_audit_portal_links CASCADE; TRUNCATE test_grants;",
  );
  for (const [actor, page] of [
    [supplierUser, "supplier.suppliers"],
    [auditor, "audit.supplier"],
    [finance, "finance.billing"],
    [reviewer, "audit.supplier"],
  ]) {
    for (const action of ["read", "create", "update", "validate"])
      await db.query("INSERT INTO test_grants VALUES($1,$2,$3)", [
        actor,
        page,
        action,
      ]);
  }
});
async function as(actor, fn, { service = false, sandbox = false } = {}) {
  return db.transaction(async (tx) => {
    await tx.exec(
      "SET LOCAL ROLE " + (service ? "service_role" : "authenticated"),
    );
    await tx.query(
      "SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('test.sandbox',$3,true)",
      [
        actor ?? "",
        service ? "service_role" : "authenticated",
        String(sandbox),
      ],
    );
    return fn(tx);
  });
}
async function create({
  kind = "initial",
  id = supplier,
  incident = null,
  key = randomUUID(),
  scope = ["SKU-A", "SKU-B"],
} = {}) {
  return as(
    supplierUser,
    async (tx) =>
      (
        await tx.query(
          "SELECT create_supplier_audit_case($1,$2,$3,$4,$5) AS result",
          [key, id, kind, scope, incident],
        )
      ).rows[0].result,
  );
}
async function act(
  c,
  action,
  payload = {},
  actor = supplierUser,
  key = randomUUID(),
  opts = {},
) {
  return as(
    actor,
    async (tx) =>
      (
        await tx.query(
          "SELECT advance_supplier_audit_case($1,$2,$3,$4,$5) AS result",
          [c.id, c.revision, key, action, payload],
        )
      ).rows[0].result,
    opts,
  );
}
const future = "2099-12-31";
function quote(condition = "after_service") {
  return {
    lines: [
      { label: "Contrôle documentaire", quantity: 1, unit_cents: 15000 },
      { label: "Complexité", quantity: 1, unit_cents: 4500 },
      { label: "Frais externes", quantity: 1, unit_cents: 3000 },
    ],
    discount_cents: 1500,
    tax_rate_bps: 2000,
    tax_basis: "TVA 20 % selon régime vérifié",
    currency: "EUR",
    tariff_version: "Exemple accepté pour ce devis",
    valid_until: future,
    payment_condition: condition,
    payment_terms:
      condition === "prepaid"
        ? "Paiement préalable à la prestation"
        : "Paiement à échéance contractuelle après service",
    scope_note: "Deux références partageant les justificatifs appropriés",
    issuer_identity: "Exploitant BIB fictif pour le test SQL uniquement",
    recipient_identity: "Fournisseur fictif pour le test SQL uniquement",
  };
}
async function prepared({
  condition = "after_service",
  kind = "initial",
} = {}) {
  let c = await create({
    kind,
    incident: kind === "counter_audit" ? "INC-1" : null,
  });
  c = await act(c, "preselect", {
    reason: "Capacité et intérêt commercial vérifiés",
  });
  c = await act(c, "contract", {
    contract_reference: "CONTRACT-1",
    effective_on: "2026-01-01",
  });
  const q = quote(condition);
  if (kind === "counter_audit")
    Object.assign(q, {
      ordinary_logistics_excluded: true,
      additional_control: "Analyse documentaire distincte du contrôle 3PL",
      supplier_attribution:
        "Responsabilité établie avec preuves et observations",
    });
  c = await act(c, "draft_quote", { quote: q }, auditor);
  c = await act(c, "submit_quote", {}, auditor);
  c = await act(
    c,
    "approve_quote",
    { reason: "Périmètre montant et fiscalité contrôlés" },
    finance,
  );
  c = await act(c, "send_quote");
  c = await act(c, "record_acceptance", {
    signatory: "Représentant habilité",
    evidence_reference: "ACCEPTANCE-1",
    quote_hash: c.quote_hash,
  });
  return c;
}
test("exact supplier ID, ownership, environment, creation idempotency and immutable case fields", async () => {
  const key = randomUUID();
  const c = await create({ key });
  const again = await create({ key });
  assert.equal(c.id, again.id);
  assert.equal(c.supplier_id, supplier);
  assert.equal(c.supplier_name, "Nom proche");
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM supplier_audit_cases")).rows[0]
      .n,
    1,
  );
  await assert.rejects(
    () => create({ id: otherSupplier }),
    /supplier|row-level|forbidden/i,
  );
  await assert.rejects(
    () => create({ id: sandboxSupplier }),
    /supplier|row-level|forbidden/i,
  );
  await assert.rejects(
    () => create({ key, scope: ["DIFFERENT"] }),
    /key_conflict/,
  );
  await assert.rejects(
    () =>
      as(supplierUser, (tx) =>
        tx.query(
          "UPDATE supplier_audit_cases SET state='decided' WHERE id=$1",
          [c.id],
        ),
      ),
    /direct_write_forbidden/,
  );
  await assert.rejects(
    () =>
      as(supplierUser, (tx) =>
        tx.query("DELETE FROM supplier_audit_cases WHERE id=$1", [c.id]),
      ),
    /permission denied/,
  );
  assert.equal(
    (await as(outsider, (tx) => tx.query("SELECT * FROM supplier_audit_cases")))
      .rows.length,
    0,
  );
});
test("quote arithmetic is exact and does not accept client totals or missing fiscal information", async () => {
  const result = (
    await db.query("SELECT calculate_supplier_audit_quote($1) result", [
      quote(),
    ])
  ).rows[0].result;
  assert.equal(result.net_cents, 21000);
  assert.equal(result.tax_cents, 4200);
  assert.equal(result.total_cents, 25200);
  await assert.rejects(
    () =>
      db.query("SELECT calculate_supplier_audit_quote($1)", [
        { ...quote(), total_cents: 1 },
      ]),
    /invalid_quote/,
  );
  await assert.rejects(
    () =>
      db.query("SELECT calculate_supplier_audit_quote($1)", [
        { ...quote(), tax_basis: "" },
      ]),
    /required_audit_field/,
  );
  await assert.rejects(
    () =>
      db.query("SELECT calculate_supplier_audit_quote($1)", [
        { ...quote(), lines: [{ label: "x", quantity: 1, unit_cents: -1 }] },
      ]),
    /invalid_quote_line/,
  );
});
test("permissions are rechecked on every command and review cannot approve its own quote", async () => {
  let c = await create();
  c = await act(c, "preselect", { reason: "Présélection justifiée" });
  c = await act(c, "draft_quote", { quote: quote() }, auditor);
  c = await act(c, "submit_quote", {}, auditor);
  await db.query(
    "INSERT INTO test_grants VALUES($1,'finance.billing','read'),($1,'finance.billing','validate')",
    [auditor],
  );
  await assert.rejects(
    () => act(c, "approve_quote", { reason: "Test" }, auditor),
    /independent_finance/,
  );
  await assert.rejects(
    () => act(c, "approve_quote", { reason: "Test" }, supplierUser),
    /forbidden/,
  );
  await db.query(
    "DELETE FROM test_grants WHERE actor=$1 AND action='validate'",
    [finance],
  );
  await assert.rejects(
    () => act(c, "approve_quote", { reason: "Test" }, finance),
    /forbidden/,
  );
});
test("revision conflicts, replay and key collisions preserve a single immutable event", async () => {
  const c = await create();
  const key = randomUUID();
  const payload = { reason: "Présélection justifiée" };
  const next = await act(c, "preselect", payload, supplierUser, key);
  const replay = await act(c, "preselect", payload, supplierUser, key);
  assert.deepEqual(replay, next);
  await assert.rejects(() => act(c, "preselect", payload), /revision|conflict/);
  await assert.rejects(
    () => act(c, "preselect", { reason: "Autre motif" }, supplierUser, key),
    /key_conflict/,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM supplier_audit_case_events WHERE case_id=$1",
        [c.id],
      )
    ).rows[0].n,
    2,
  );
  await assert.rejects(
    () =>
      as(auditor, (tx) =>
        tx.query("UPDATE supplier_audit_case_events SET action='create'"),
      ),
    /permission denied/,
  );
});
test("post-service audits can start unpaid; prepayment audits require documented invoice and full payment", async () => {
  let post = await prepared();
  post = await act(post, "start", {}, auditor);
  assert.equal(post.state, "in_progress");
  let pre = await prepared({ condition: "prepaid" });
  await assert.rejects(
    () => act(pre, "start", {}, auditor),
    /prepayment_required/,
  );
  pre = await act(
    pre,
    "record_invoice",
    {
      reference: "INV-1",
      issue_date: "2026-01-02",
      document_reference: "DOC-1",
    },
    finance,
  );
  pre = await act(
    pre,
    "record_payment",
    { reference: "PAY-1", paid_on: "2026-01-03", amount_cents: 10000 },
    finance,
  );
  await assert.rejects(
    () => act(pre, "start", {}, auditor),
    /prepayment_required/,
  );
  pre = await act(
    pre,
    "record_payment",
    { reference: "PAY-2", paid_on: "2026-01-04", amount_cents: 15200 },
    finance,
  );
  pre = await act(pre, "start", {}, auditor);
  assert.equal(pre.state, "in_progress");
  assert.equal(pre.reference_decisions, null);
  await assert.rejects(
    () => act(pre, "draft_quote", { quote: quote() }, auditor),
    /quote_locked/,
  );
});
test("counter-audit cannot duplicate ordinary logistics or bill before independent report approval", async () => {
  let c = await create({ kind: "counter_audit", incident: "INC-1" });
  c = await act(c, "preselect", { reason: "Contrôle supplémentaire justifié" });
  await assert.rejects(
    () => act(c, "draft_quote", { quote: quote() }, auditor),
    /ordinary_logistics/,
  );
  await assert.rejects(
    () => create({ kind: "counter_audit", incident: "INC-1" }),
    /unique|duplicate/,
  );
  await db.exec("TRUNCATE supplier_audit_cases CASCADE");
  c = await prepared({ kind: "counter_audit" });
  await assert.rejects(
    () =>
      act(
        c,
        "record_invoice",
        {
          reference: "INV-X",
          issue_date: "2026-01-02",
          document_reference: "DOC-X",
        },
        finance,
      ),
    /invoice_not_allowed/,
  );
  c = await act(c, "start", {}, auditor);
  c = await act(
    c,
    "submit_report",
    {
      findings: "Constats documentés",
      conclusion: "Non-conforme",
      evidence_reference: "EVIDENCE-1",
    },
    auditor,
  );
  await assert.rejects(
    () => act(c, "approve_report", { reason: "Revu" }, auditor),
    /independent_report/,
  );
  c = await act(
    c,
    "approve_report",
    { reason: "Rapport et preuves contrôlés" },
    reviewer,
  );
  c = await act(
    c,
    "record_invoice",
    {
      reference: "INV-X",
      issue_date: "2026-01-02",
      document_reference: "DOC-X",
    },
    finance,
  );
  assert.ok(c.invoice);
});
test("a final report and complete reference decisions are required independently of payment and score", async () => {
  let c = await prepared();
  await assert.rejects(
    () => act(c, "decide", { decisions: [], reason: "Payé" }),
    /validated_report/,
  );
  c = await act(c, "start", {}, auditor);
  await assert.rejects(
    () =>
      act(
        c,
        "submit_report",
        { findings: "x", conclusion: "x", evidence_reference: "" },
        auditor,
      ),
    /required_audit_field/,
  );
  c = await act(
    c,
    "submit_report",
    {
      findings: "Défaut de traçabilité",
      conclusion: "Références à refuser",
      evidence_reference: "PROOF-1",
    },
    auditor,
  );
  c = await act(c, "approve_report", { reason: "Preuves examinées" }, reviewer);
  await assert.rejects(
    () =>
      act(c, "decide", {
        decisions: [{ reference: "SKU-A", decision: "admitted" }],
        reason: "Incomplet",
      }),
    /scope_mismatch/,
  );
  c = await act(c, "decide", {
    decisions: c.scope.map((reference) => ({ reference, decision: "refused" })),
    reason: "Non-conformités établies",
  });
  assert.equal(c.state, "decided");
  assert.equal(c.reference_decisions[0].decision, "refused");
  assert.equal(
    (await db.query("SELECT name FROM suppliers WHERE id=$1", [supplier]))
      .rows[0].name,
    "Nom proche",
  );
  await assert.rejects(
    () => act(c, "submit_report", { findings: "Changé" }, auditor),
    /closed/,
  );
});
test("supplier portal exposes only its issued documents and accepts exactly the presented quote", async () => {
  let c = await prepared();
  // A fresh sent quote is used for portal acceptance; accepted quotes cannot be rewritten.
  await db.exec("TRUNCATE supplier_audit_cases CASCADE");
  c = await create();
  c = await act(c, "preselect", { reason: "Avis favorable" });
  c = await act(c, "draft_quote", { quote: quote() }, auditor);
  c = await act(c, "submit_quote", {}, auditor);
  c = await act(c, "approve_quote", { reason: "Contrôlé" }, finance);
  c = await act(c, "send_quote");
  await as(supplierUser, (tx) =>
    tx.query("SELECT bind_supplier_audit_portal($1,$2,$3)", [
      supplier,
      submission,
      "Rapprochement dossier partenaire vérifié",
    ]),
  );
  const list = await as(
    null,
    async (tx) =>
      (
        await tx.query("SELECT list_supplier_audit_portal($1) result", [
          submission,
        ])
      ).rows[0].result,
    { service: true },
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].supplier_id, undefined);
  assert.equal(list[0].report, null);
  const other = await as(
    null,
    async (tx) =>
      (
        await tx.query("SELECT list_supplier_audit_portal($1) result", [
          randomUUID(),
        ])
      ).rows[0].result,
    { service: true },
  );
  assert.deepEqual(other, []);
  await assert.rejects(
    () =>
      act(
        c,
        "portal_accept",
        {
          submission_id: randomUUID(),
          signatory: "Partner",
          quote_hash: c.quote_hash,
        },
        null,
        randomUUID(),
        { service: true },
      ),
    /portal_forbidden/,
  );
  await assert.rejects(
    () =>
      act(
        c,
        "portal_accept",
        { submission_id: submission, signatory: "Partner", quote_hash: "old" },
        null,
        randomUUID(),
        { service: true },
      ),
    /acceptible/,
  );
  c = await act(
    c,
    "portal_accept",
    {
      submission_id: submission,
      signatory: "Représentant habilité",
      quote_hash: c.quote_hash,
    },
    null,
    randomUUID(),
    { service: true },
  );
  assert.equal(c.quote_state, "accepted");
  assert.equal(c.acceptance.channel, "partner_portal");
});
test("invoice and payment evidence cannot be counted twice across audit dossiers", async () => {
  let first = await prepared();
  first = await act(
    first,
    "record_invoice",
    {
      reference: "INV-ONE",
      issue_date: "2026-01-02",
      document_reference: "DOC-ONE",
    },
    finance,
  );
  first = await act(
    first,
    "record_payment",
    { reference: "BANK-LINE-1", paid_on: "2026-01-03", amount_cents: 1000 },
    finance,
  );
  let second = await prepared();
  await assert.rejects(
    () =>
      act(
        second,
        "record_invoice",
        {
          reference: "INV-ONE",
          issue_date: "2026-01-02",
          document_reference: "DOC-ONE",
        },
        finance,
      ),
    /unique|duplicate/,
  );
  second = await act(
    second,
    "record_invoice",
    {
      reference: "INV-TWO",
      issue_date: "2026-01-02",
      document_reference: "DOC-TWO",
    },
    finance,
  );
  await assert.rejects(
    () =>
      act(
        second,
        "record_payment",
        { reference: "BANK-LINE-1", paid_on: "2026-01-03", amount_cents: 1000 },
        finance,
      ),
    /unique|duplicate/,
  );
  assert.deepEqual(
    (
      await db.query("SELECT payments FROM supplier_audit_cases WHERE id=$1", [
        second.id,
      ])
    ).rows[0].payments,
    [],
  );
});
test("catalogue admission follows the latest immutable reference decision, not a later payment", async () => {
  async function decided(outcome) {
    let c = await prepared();
    c = await act(c, "start", {}, auditor);
    c = await act(
      c,
      "submit_report",
      {
        findings: "Contrôles effectués",
        conclusion: "Conclusion documentée",
        evidence_reference: "PROOF",
      },
      auditor,
    );
    c = await act(c, "approve_report", { reason: "Rapport revu" }, reviewer);
    return act(c, "decide", {
      decisions: c.scope.map((reference) => ({ reference, decision: outcome })),
      reason: "Décision documentée",
    });
  }
  const admission = (reference) =>
    as(
      null,
      async (tx) =>
        (
          await tx.query(
            "SELECT get_supplier_reference_admission($1,$2,false) admitted",
            [supplier, reference],
          )
        ).rows[0].admitted,
      { service: true },
    );
  assert.equal(await admission("SKU-A"), false);
  let first = await decided("admitted");
  assert.equal(await admission("SKU-A"), true);
  assert.equal(await admission("SKU-UNKNOWN"), false);
  await decided("refused");
  assert.equal(await admission("SKU-A"), false);
  first = await act(
    first,
    "record_invoice",
    {
      reference: "INV-OLDER",
      issue_date: "2026-01-02",
      document_reference: "DOC-OLDER",
    },
    finance,
  );
  await act(
    first,
    "record_payment",
    { reference: "PAY-OLDER", paid_on: "2026-01-03", amount_cents: 1000 },
    finance,
  );
  assert.equal(await admission("SKU-A"), false);
  await assert.rejects(
    () =>
      as(supplierUser, (tx) =>
        tx.query("SELECT get_supplier_reference_admission($1,$2,false)", [
          supplier,
          "SKU-A",
        ]),
      ),
    /permission denied/,
  );
});

test("two decisions with the same transaction timestamp have a deterministic server event order", async () => {
  async function reported() {
    let c = await prepared();
    c = await act(c, "start", {}, auditor);
    c = await act(
      c,
      "submit_report",
      {
        findings: "Contrôles",
        conclusion: "Conclusion",
        evidence_reference: "PROOF",
      },
      auditor,
    );
    return act(c, "approve_report", { reason: "Rapport revu" }, reviewer);
  }
  const first = await reported();
  const second = await reported();
  await as(supplierUser, async (tx) => {
    for (const [c, decision] of [
      [first, "admitted"],
      [second, "refused"],
    ]) {
      await tx.query("SELECT advance_supplier_audit_case($1,$2,$3,$4,$5)", [
        c.id,
        c.revision,
        randomUUID(),
        "decide",
        {
          decisions: c.scope.map((reference) => ({ reference, decision })),
          reason: "Décision motivée",
        },
      ]);
    }
  });
  const events = (
    await db.query(
      "SELECT created_at FROM supplier_audit_case_events WHERE action='decide' ORDER BY event_order",
    )
  ).rows;
  assert.equal(String(events[0].created_at), String(events[1].created_at));
  const admitted = await as(
    null,
    async (tx) =>
      (
        await tx.query(
          "SELECT get_supplier_reference_admission($1,$2,false) admitted",
          [supplier, "SKU-A"],
        )
      ).rows[0].admitted,
    { service: true },
  );
  assert.equal(admitted, false);
});
