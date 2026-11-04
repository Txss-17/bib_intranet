import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const author = "10000000-0000-4000-8000-000000000001",
  reviewer = "10000000-0000-4000-8000-000000000002",
  director = "10000000-0000-4000-8000-000000000003",
  outsider = "10000000-0000-4000-8000-000000000004";
const store = "20000000-0000-4000-8000-000000000001";
let db;
before(async () => {
  db = new PGlite();
  await db.exec(
    await readFile(new URL("./fixture.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    await readFile(
      new URL(
        "../../drizzle/migrations/0084_legal_document_governance.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});
after(async () => db.close());
beforeEach(async () => {
  await db.exec(
    "TRUNCATE legal_governance_records,legal_governance_events,legal_governance_deliveries CASCADE;TRUNCATE test_grants;",
  );
  for (const actor of [author, reviewer, director])
    for (const page of [
      "compliance.policies",
      "compliance.contracts",
      "direction.governance",
    ])
      for (const action of ["read", "create", "update", "validate"])
        await db.query("INSERT INTO test_grants VALUES($1,$2,$3)", [
          actor,
          page,
          action,
        ]);
});
async function as(actor, fn, { sandbox = false, service = false } = {}) {
  return db.transaction(async (tx) => {
    await tx.exec(
      "SET LOCAL ROLE " + (service ? "service_role" : "authenticated"),
    );
    await tx.query(
      "SELECT set_config('request.jwt.claim.sub',$1,true),set_config('test.sandbox',$2,true)",
      [actor ?? "", String(sandbox)],
    );
    return fn(tx);
  });
}
const model = () => ({
  model_key: "JUR-B01",
  version: "v1",
  title: "Texte fictif pour test",
  body: [
    "VENDEUR_NOM_LEGAL",
    "BOUTIQUE_NOM",
    "FORME_OU_EI",
    "SIREN_SIRET",
    "ADRESSE",
    "CONTACT_VENDEUR",
    "MEDIATEUR_COORDONNEES",
    "CGV_MODELE_VERSION",
    "CGV_BOUTIQUE_VERSION",
    "DATE_EFFET",
  ]
    .map((x) => "{{" + x + "}}")
    .join("\n"),
  effective_at: "2026-01-01T00:00:00Z",
  locale: "fr",
});
const fields = () => ({
  VENDEUR_NOM_LEGAL: "Vendeur fictif",
  SIREN_SIRET: "123456789",
  ADRESSE: "Adresse fictive",
  CONTACT_VENDEUR: "test@example.test",
  FORME_OU_EI: "EI",
  MEDIATEUR_COORDONNEES: "Médiateur fictif",
  TVA_ID: "Régime fictif",
  BIB_IDENTITE_LEGALE_VERIFIEE: "Exploitant fictif",
  BIB_CONTACT: "Contact fictif",
  HEBERGEUR_RAISON_SOCIALE_ET_COORDONNEES: "Hébergeur fictif",
});
const identity = (id = store) => ({
  store_id: id,
  owner_id: author,
  fields: fields(),
});
const create = (
  kind = "model",
  payload = model(),
  key = randomUUID(),
  actor = author,
  opts = {},
) =>
  as(
    actor,
    async (tx) =>
      (
        await tx.query(
          "SELECT create_legal_governance_record($1,$2,$3) result",
          [key, kind, payload],
        )
      ).rows[0].result,
    opts,
  );
const act = (r, action, payload = {}, actor = author, key = randomUUID()) =>
  as(
    actor,
    async (tx) =>
      (
        await tx.query(
          "SELECT advance_legal_governance_record($1,$2,$3,$4,$5) result",
          [r.id, r.revision, key, action, payload],
        )
      ).rows[0].result,
  );
const proof = {
  reason: "Revue documentée",
  evidence: "Référence du justificatif conservé",
};
async function reviewed(
  kind = "model",
  payload = kind === "model" ? model() : identity(),
) {
  let r = await create(kind, payload);
  r = await act(r, "submit");
  r = await act(r, "legal_approve", proof, reviewer);
  if (kind === "model") r = await act(r, "direction_approve", proof, director);
  return r;
}
test("saved rights and environment isolate drafts; no created record is implicitly approved", async () => {
  const r = await create();
  assert.equal(r.state, "draft");
  assert.equal(r.legal_reviewer, null);
  assert.equal(r.activation_sequence, null);
  assert.equal(
    (
      await as(outsider, (tx) =>
        tx.query("SELECT * FROM legal_governance_records"),
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (
      await as(
        author,
        (tx) => tx.query("SELECT * FROM legal_governance_records"),
        { sandbox: true },
      )
    ).rows.length,
    0,
  );
  await assert.rejects(
    () =>
      create("model", { ...model(), version: "v2" }, randomUUID(), outsider),
    /forbidden|row-level/,
  );
  await assert.rejects(
    () =>
      as(author, (tx) =>
        tx.query(
          "UPDATE legal_governance_records SET state='published' WHERE id=$1",
          [r.id],
        ),
      ),
    /direct_write/,
  );
});
test("a legal model requires independent legal and Direction reviews, both on evidence", async () => {
  let r = await create();
  r = await act(r, "submit");
  await assert.rejects(
    () => act(r, "legal_approve", proof, author),
    /independent_legal/,
  );
  await assert.rejects(
    () => act(r, "publish", proof, reviewer),
    /approvals_required/,
  );
  r = await act(r, "legal_approve", proof, reviewer);
  await assert.rejects(
    () => act(r, "direction_approve", proof, reviewer),
    /independent_direction/,
  );
  r = await act(r, "direction_approve", proof, director);
  r = await act(r, "publish", proof, reviewer);
  assert.equal(r.state, "published");
  assert.ok(r.delivery_sequence > r.activation_sequence);
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM legal_governance_deliveries"))
      .rows[0].n,
    1,
  );
});
test("permissions revoked after submission remain effective at the final decision", async () => {
  let r = await create();
  r = await act(r, "submit");
  await db.query(
    "DELETE FROM test_grants WHERE actor=$1 AND page='compliance.policies' AND action='validate'",
    [reviewer],
  );
  await assert.rejects(
    () => act(r, "legal_approve", proof, reviewer),
    /action_forbidden/,
  );
});
test("new content invalidates prior reviews through rejection; published records cannot be rewritten", async () => {
  let r = await reviewed();
  r = await act(r, "reject", proof, reviewer);
  assert.equal(r.legal_reviewer, null);
  assert.equal(r.direction_reviewer, null);
  r = await act(r, "edit", {
    payload: {
      ...r.payload,
      body: r.payload.body + " Nouvelle version du brouillon",
    },
  });
  r = await act(r, "submit");
  r = await act(r, "legal_approve", proof, reviewer);
  r = await act(r, "direction_approve", proof, director);
  r = await act(r, "publish", proof, reviewer);
  await assert.rejects(() => act(r, "edit", { payload: r.payload }), /locked/);
  await assert.rejects(() => act(r, "reject", proof, reviewer), /transition/);
  r = await act(r, "withdraw", proof, reviewer);
  assert.equal(r.state, "withdrawn");
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM legal_governance_deliveries"))
      .rows[0].n,
    2,
  );
});
test("retries retain one event, reject key collisions and detect stale revisions", async () => {
  const key = randomUUID();
  let r = await create("model", model(), key);
  assert.equal((await create("model", model(), key)).id, r.id);
  await assert.rejects(
    () => create("model", { ...model(), title: "Autre" }, key),
    /key_conflict/,
  );
  const command = randomUUID();
  const updated = await act(r, "submit", {}, author, command);
  assert.deepEqual(await act(r, "submit", {}, author, command), updated);
  await assert.rejects(() => act(r, "submit", {}), /revision/);
  await assert.rejects(
    () => act(r, "reject", proof, author, command),
    /key_conflict/,
  );
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM legal_governance_events"))
      .rows[0].n,
    2,
  );
});
test("the same real EI registration shares one entity across separate boutiques; identity keys are server controlled", async () => {
  const first = await create("identity", identity());
  const second = await create("identity", identity(randomUUID()));
  assert.equal(first.payload.legal_entity_id, second.payload.legal_entity_id);
  await assert.rejects(
    () => create("identity", { ...identity(), legal_entity_id: randomUUID() }),
    /server_assigned/,
  );
  await assert.rejects(
    () =>
      act(first, "edit", {
        payload: {
          ...first.payload,
          fields: { ...first.payload.fields, SIREN_SIRET: "987654321" },
        },
      }),
    /refresh_identity/,
  );
});
test("templates reject arbitrary variables and identity values cannot inject another template token", async () => {
  await assert.rejects(
    () =>
      create("model", { ...model(), body: model().body + " {{FREE_TEXT}}" }),
    /unknown_legal_placeholder/,
  );
  await assert.rejects(
    () =>
      create("model", {
        ...model(),
        body: model().body.replace("{{MEDIATEUR_COORDONNEES}}", ""),
      }),
    /missing_legal_placeholder/,
  );
  await assert.rejects(
    () =>
      create("identity", {
        ...identity(),
        fields: { ...fields(), FORME_OU_EI: "{{SIREN_SIRET}}" },
      }),
    /invalid_identity_field/,
  );
});
test("exports require a published reviewed record and the browser cannot acknowledge delivery", async () => {
  const draft = await create();
  await assert.rejects(
    () =>
      as(author, (tx) =>
        tx.query("SELECT export_legal_governance_record($1)", [draft.id]),
      ),
    /export_forbidden/,
  );
  let r = await reviewed("identity");
  r = await act(r, "publish", proof, reviewer);
  const exported = await as(
    reviewer,
    async (tx) =>
      (
        await tx.query("SELECT export_legal_governance_record($1) result", [
          r.id,
        ])
      ).rows[0].result,
  );
  assert.equal(exported.payload.legal_entity_id, r.payload.legal_entity_id);
  assert.equal(exported.legal_evidence, undefined);
  await assert.rejects(
    () =>
      as(reviewer, (tx) =>
        tx.query("SELECT acknowledge_legal_governance_delivery($1,$2)", [
          r.id,
          r.delivery_sequence,
        ]),
      ),
    /permission denied/,
  );
  await as(
    null,
    (tx) =>
      tx.query("SELECT acknowledge_legal_governance_delivery($1,$2)", [
        r.id,
        r.delivery_sequence,
      ]),
    { service: true },
  );
  assert.equal(
    (await db.query("SELECT state FROM legal_governance_deliveries")).rows[0]
      .state,
    "delivered",
  );
});
