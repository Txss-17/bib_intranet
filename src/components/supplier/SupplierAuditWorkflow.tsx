import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { intranetRpc } from "@/lib/intranet";
import { readAllPages } from "@/lib/operationsMetrics";
import { downloadAuditEvidencePdf } from "@/lib/auditEvidencePdf";
import {
  useSupplierAuditCases,
  useSupplierAuditCaseActions,
  useSupplierAuditCaseEvents,
  useSupplierAuditHandoffs,
  useTransmitSupplierAudit,
  type SupplierAuditCase,
} from "@/hooks/useSupplierAuditCases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  draft: "Qualification",
  preselected: "Présélectionné",
  contracted: "Contrat enregistré",
  in_progress: "Contrôle en cours",
  report_review: "Rapport à relire",
  reported: "Rapport validé",
  decided: "Décision enregistrée",
  cancelled: "Annulé",
  none: "Sans devis",
  review: "Validation Finance attendue",
  approved: "Devis validé par Finance",
  sent: "Devis communiqué",
  accepted: "Devis accepté",
};
const actions: Record<string, string> = {
  preselect: "Valider la présélection",
  contract: "Enregistrer le contrat applicable",
  draft_quote: "Établir une version de devis",
  submit_quote: "Soumettre le devis à Finance",
  approve_quote: "Valider le devis",
  send_quote: "Communiquer le devis",
  record_acceptance: "Enregistrer une acceptation externe",
  record_invoice: "Rattacher une facture émise",
  record_payment: "Rapprocher un paiement reçu",
  start: "Autoriser le contrôle",
  submit_report: "Soumettre le rapport",
  approve_report: "Valider le rapport",
  decide: "Décider par référence",
  cancel: "Annuler le dossier",
  create: "Dossier créé",
  portal_accept: "Devis accepté par le partenaire",
};
const euro = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
function cents(value: string) {
  const s = value.trim().replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(s))
    throw new Error(
      "Saisissez un montant positif avec deux décimales au maximum.",
    );
  const [a, b = ""] = s.split(".");
  return Number(a) * 100 + Number(b.padEnd(2, "0"));
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.replace(/\W/g, "-");
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={10000}
        />
      ) : (
        <Input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
        />
      )}
    </div>
  );
}

export default function SupplierAuditWorkflow({
  supplierId,
  auditInbox = false,
}: {
  supplierId?: string;
  auditInbox?: boolean;
}) {
  const { user, profile } = useAuth();
  const { can } = usePermissions();
  const query = useSupplierAuditCases(supplierId);
  const handoffs = useSupplierAuditHandoffs();
  const handoffIds = new Set(handoffs.data?.map(h => h.case_id) ?? []);
  const receivedCases = query.data?.filter(c => handoffIds.has(c.id)) ?? [];
  const visibleCases = auditInbox ? receivedCases : (query.data ?? []);
  const mutations = useSupplierAuditCaseActions();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [supplier, setSupplier] = useState(supplierId ?? "");
  const [kind, setKind] = useState("initial");
  const [scope, setScope] = useState("");
  const [incident, setIncident] = useState("");
  const suppliers = useQuery({
    queryKey: [
      "audit-case-supplier-options",
      user?.id,
      profile?.test_account === true,
    ],
    enabled: !!user && can("supplier.suppliers", "create") && !supplierId,
    queryFn: () =>
      readAllPages<{ id: string; name: string }>((cursor) => {
        let q = supabase
          .from("suppliers")
          .select("id,name")
          .order("id")
          .limit(500);
        if (cursor) q = q.gt("id", cursor);
        return q;
      }),
  });
  const current = query.data?.find((c) => c.id === selected);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const c = await mutations.create.mutateAsync({
        supplierId: supplier,
        kind,
        scope: scope
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        incident: incident.trim() || null,
      });
      setSelected(c.id);
      setCreating(false);
      setScope("");
      toast.success("Dossier fournisseur créé.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {auditInbox ? "Dossiers transmis au pôle Audit" : "Qualification et audits fournisseurs"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {auditInbox
              ? "Réception des dossiers envoyés par Fournisseurs : audits documentaires initiaux et contre-audits. L’examen, les rapports et la validation appartiennent au pôle Audit."
              : "Les dossiers de qualification sont transmis explicitement au pôle Audit, avec auteur, date et motif. Devis, acceptation, prestation, rapport et décision restent distincts. Le paiement ne garantit pas le référencement."}
          </p>
        </div>
        {!auditInbox && can("supplier.suppliers", "create") && (
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? "Fermer" : "Nouveau dossier"}
          </Button>
        )}
      </div>
      {creating && (
        <form onSubmit={create} className="space-y-3 rounded-lg border p-3">
          {!supplierId && (
            <div>
              <Label htmlFor="audit-case-supplier">Fournisseur *</Label>
              <select
                id="audit-case-supplier"
                required
                className="h-10 w-full rounded-md border bg-background px-3"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="">Choisir un fournisseur</option>
                {(suppliers.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {suppliers.isError && (
                <p role="alert">La liste des fournisseurs est indisponible.</p>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="audit-case-kind">Nature</Label>
            <select
              id="audit-case-kind"
              className="h-10 w-full rounded-md border bg-background px-3"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="initial">Audit documentaire initial</option>
              <option value="counter_audit">Contre-audit pour anomalie</option>
            </select>
          </div>
          <div>
            <Label htmlFor="audit-case-scope">
              Références présélectionnées, une par ligne *
            </Label>
            <Textarea
              id="audit-case-scope"
              required
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">
              Regrouper les variantes partageant les mêmes justificatifs lors du
              chiffrage. Il ne s’agit pas des quantités de stock.
            </p>
          </div>
          {kind === "counter_audit" && (
            <Field
              label="Référence de l’incident"
              value={incident}
              onChange={setIncident}
            />
          )}
          <Button type="submit" disabled={mutations.create.isPending}>
            {mutations.create.isPending
              ? "Enregistrement…"
              : "Créer le dossier"}
          </Button>
        </form>
      )}
      {query.isLoading && <p role="status">Chargement des dossiers…</p>}
      {query.isError && (
        <p role="alert" className="text-sm text-destructive">
          Dossiers indisponibles. Vérifiez l’activation du parcours et vos
          permissions.{" "}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </p>
      )}
      {auditInbox && handoffs.isLoading && <p role="status">Chargement des transmissions du pôle Audit…</p>}
      {auditInbox && handoffs.isError && <p role="alert" className="text-sm text-destructive">Le registre des transmissions Audit est indisponible. Aucun dossier ne peut être confirmé comme reçu. <Button variant="outline" size="sm" onClick={() => void handoffs.refetch()}>Réessayer</Button></p>}
      {!query.isLoading && !query.isError && (!auditInbox || (!handoffs.isLoading && !handoffs.isError)) && (
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_3fr]">
          <div className="space-y-2">
            {visibleCases.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {auditInbox ? "Aucun dossier transmis au pôle Audit. Les anciens dossiers non transmis restent disponibles depuis leur registre d’origine." : "Aucun dossier accessible."}
              </p>
            )}
            {visibleCases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`w-full space-y-1 rounded-lg border p-3 text-left ${selected === c.id ? "border-primary bg-primary/5" : ""}`}
              >
                <span className="block font-medium">{c.supplier_name}</span>
                <span className="block text-xs text-muted-foreground">
                  {c.kind === "initial" ? "Audit initial" : "Contre-audit"} ·{" "}
                  {c.scope.length} référence(s)
                </span>
                <Badge variant="outline">{labels[c.state] ?? c.state}</Badge>
                {handoffIds.has(c.id) && <Badge variant="secondary" className="ml-1">Transmis au pôle Audit</Badge>}
              </button>
            ))}
          </div>
          {current ? (
            <CaseDetail key={current.id} dossier={current} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un dossier pour consulter ses pièces et validations.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function CaseDetail({ dossier: c }: { dossier: SupplierAuditCase }) {
  const { can } = usePermissions();
  const { user, profile } = useAuth();
  const { advance } = useSupplierAuditCaseActions();
  const handoffs = useSupplierAuditHandoffs();
  const transmit = useTransmitSupplierAudit();
  const [handoffReason,setHandoffReason] = useState("");
  const sentHandoff = handoffs.data?.find(h => h.case_id === c.id);
  const events = useSupplierAuditCaseEvents(c.id);
  const qc = useQueryClient();
  const [action, setAction] = useState("");
  const [baseRevision, setBaseRevision] = useState(c.revision);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [lines, setLines] = useState([{ label: "", quantity: "1", unit: "" }]);
  const [excluded, setExcluded] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [portalId, setPortalId] = useState("");
  const [portalEvidence, setPortalEvidence] = useState("");
  const set = (key: string, value: string) =>
    setFields((v) => ({ ...v, [key]: value }));
  const supplierUpdate = can("supplier.suppliers", "update");
  const auditUpdate = can("audit.supplier", "update");
  const financeUpdate = can("finance.billing", "update");
  const paid = c.payments.reduce((n, p) => n + p.amount_cents, 0);
  const closed = ["decided", "cancelled"].includes(c.state);
  const available: string[] = [];
  if (!closed) {
    if (supplierUpdate && c.state === "draft") available.push("preselect");
    if (supplierUpdate && c.state === "preselected") available.push("contract");
    if (
      auditUpdate &&
      ["preselected", "contracted"].includes(c.state) &&
      c.quote_state !== "accepted"
    )
      available.push("draft_quote");
    if (auditUpdate && c.quote_state === "draft")
      available.push("submit_quote");
    if (
      can("finance.billing", "validate") &&
      c.quote_state === "review" &&
      c.quote_author !== user?.id
    )
      available.push("approve_quote");
    if (supplierUpdate && c.quote_state === "approved")
      available.push("send_quote");
    if (supplierUpdate && c.quote_state === "sent")
      available.push("record_acceptance");
    if (
      auditUpdate &&
      c.state === "contracted" &&
      c.quote_state === "accepted" &&
      (c.quote?.payment_condition !== "prepaid" || paid >= c.quote.total_cents)
    )
      available.push("start");
    if (auditUpdate && c.state === "in_progress")
      available.push("submit_report");
    if (
      can("audit.supplier", "validate") &&
      c.state === "report_review" &&
      c.report_author !== user?.id
    )
      available.push("approve_report");
    if (can("supplier.suppliers", "validate") && c.state === "reported")
      available.push("decide");
    if (
      supplierUpdate &&
      ["draft", "preselected", "contracted"].includes(c.state)
    )
      available.push("cancel");
  }
  if (
    financeUpdate &&
    c.quote_state === "accepted" &&
    !c.invoice &&
    c.state !== "cancelled" &&
    (c.kind === "initial" || c.report_approved_by)
  )
    available.push("record_invoice");
  if (financeUpdate && can("finance.billing", "validate") && c.invoice && c.quote && paid < c.quote.total_cents)
    available.push("record_payment");
  const canTransmit = supplierUpdate && !sentHandoff && ["preselected","contracted"].includes(c.state)
    && !handoffs.isLoading && !handoffs.isError && !handoffs.isFetching;
  const stale = baseRevision !== c.revision;
  const bind = useMutation({
    mutationFn: () =>
      intranetRpc("bind_supplier_audit_portal", {
        p_supplier_id: c.supplier_id,
        p_submission_id: portalId.trim(),
        p_evidence_reference: portalEvidence.trim(),
      }),
    onSuccess: () => {
      toast.success("Dossier partenaire rattaché sur justificatif.");
      setPortalId("");
      setPortalEvidence("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const transmitToAudit = async () => {
    try {
      if (!canTransmit || handoffReason.trim().length < 8 || handoffReason.trim().length > 500)
        throw new Error("Motif de transmission requis (8 à 500 caractères).");
      await transmit.mutateAsync({caseId:c.id,revision:c.revision,reason:handoffReason});
      setHandoffReason("");
      toast.success("Dossier transmis au pôle Audit et inscrit dans la file de réception.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transmission non confirmée.");
    }
  };
  const field = (
    key: string,
    label: string,
    type = "text",
    required = true,
  ) => (
    <Field
      key={key}
      label={label}
      type={type}
      required={required}
      value={fields[key] ?? ""}
      onChange={(v) => set(key, v)}
    />
  );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload: Record<string, unknown> = {};
      if (
        ["preselect", "approve_quote", "approve_report", "cancel"].includes(
          action,
        )
      )
        payload = { reason: fields.reason };
      if (action === "contract")
        payload = {
          contract_reference: fields.reference,
          effective_on: fields.date,
        };
      if (action === "draft_quote")
        payload = {
          quote: {
            lines: lines.map((l) => ({
              label: l.label.trim(),
              quantity: Number(l.quantity),
              unit_cents: cents(l.unit),
            })),
            discount_cents: cents(fields.discount || "0"),
            tax_rate_bps: cents(fields.tax_rate),
            tax_basis: fields.tax_basis,
            currency: "EUR",
            tariff_version: fields.tariff,
            valid_until: fields.valid_until,
            payment_condition: fields.payment_condition || "after_service",
            payment_terms: fields.payment_terms,
            scope_note: fields.scope_note,
            issuer_identity: fields.issuer_identity,
            recipient_identity: fields.recipient_identity,
            ...(c.kind === "counter_audit"
              ? {
                  additional_control: fields.additional_control,
                  supplier_attribution: fields.supplier_attribution,
                  ordinary_logistics_excluded: excluded,
                }
              : {}),
          },
        };
      if (action === "record_acceptance")
        payload = {
          signatory: fields.signatory,
          evidence_reference: fields.evidence,
          quote_hash: c.quote_hash,
        };
      if (action === "record_invoice")
        payload = {
          reference: fields.reference,
          issue_date: fields.date,
          document_reference: fields.evidence,
        };
      if (action === "record_payment") {
        if (fields.bank_verified !== "confirmed" || !fields.bank_statement_reference?.trim()) {
          throw new Error("Le justificatif de relevé bancaire et sa vérification par Finance sont obligatoires.");
        }
        // The restricted server RPC records Finance's bank-statement attestation.
        // The database rejects record_payment if no matching attested credit exists.
        await intranetRpc("attest_supplier_audit_bank_receipt", {
          p_case_id: c.id,
          p_bank_transaction_reference: fields.reference.trim(),
          p_bank_statement_reference: fields.bank_statement_reference.trim(),
          p_credited_on: fields.date,
          p_amount_cents: cents(fields.amount),
        });
        payload = {
          reference: fields.reference,
          paid_on: fields.date,
          amount_cents: cents(fields.amount),
        };
      }
      if (action === "submit_report")
        payload = {
          findings: fields.findings,
          conclusion: fields.conclusion,
          evidence_reference: fields.evidence,
        };
      if (action === "decide")
        payload = {
          decisions: c.scope.map((reference) => ({
            reference,
            decision: decisions[reference],
          })),
          reason: fields.reason,
        };
      await advance.mutateAsync({
        id: c.id,
        revision: baseRevision,
        action,
        payload,
      });
      setAction("");
      setFields({});
      toast.success("Action enregistrée avec sa preuve et son historique.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">{c.supplier_name}</h3>
        <p className="break-all text-xs text-muted-foreground">
          Dossier {c.id} · révision {c.revision}
        </p>
        <p className="text-sm">Références : {c.scope.join(", ")}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{labels[c.state] ?? c.state}</Badge>
          <Badge variant="outline">
            {labels[c.quote_state] ?? c.quote_state}
          </Badge>
        </div>
        {c.contract_reference && (
          <p className="text-sm">
            Contrat : {c.contract_reference} · prise d’effet{" "}
            {c.contract_effective_on}
          </p>
        )}
      </div>
      <section aria-label="Transmission au pôle Audit" className="space-y-2 rounded-lg border p-3">
        <h4 className="font-semibold">Transmission au pôle Audit</h4>
        {handoffs.isLoading ? <p role="status" className="text-sm">Vérification de la réception…</p> :
          handoffs.isError ? <p role="alert" className="text-sm text-destructive">Statut de transmission indisponible. Aucune confirmation ne peut être affichée.</p> :
          sentHandoff ? <p role="status" className="text-sm">Dossier reçu par le pôle Audit le {new Date(sentHandoff.sent_at).toLocaleString("fr-FR")}. Le pôle Audit est responsable des constats et du rapport.</p> :
          <p className="text-sm text-muted-foreground">Non transmis : un dossier visible dans le pôle Audit ne vaut pas réception formelle. Fournisseurs doit soumettre le dossier après qualification.</p>}
        {canTransmit && <>
          <Label htmlFor={`audit-handoff-reason-${c.id}`}>Motif et nature du contrôle *</Label>
          <Textarea id={`audit-handoff-reason-${c.id}`} value={handoffReason}
            maxLength={500} onChange={event=>setHandoffReason(event.target.value)}
            placeholder={c.kind === "counter_audit"
              ? "Contre-audit ciblé : incident, constats d'origine et pièces à vérifier…"
              : "Audit documentaire initial : références et pièces à contrôler…"} />
          <Button type="button" onClick={()=>void transmitToAudit()} disabled={transmit.isPending || handoffReason.trim().length<8}>
            {transmit.isPending ? "Transmission en cours…" : "Transmettre au pôle Audit"}
          </Button>
          <p className="text-xs text-muted-foreground">La transmission crée une trace nominative et horodatée, sans attribuer de conformité, ni publier les documents, ni déclencher une facture.</p>
        </>}
      </section>
      <section aria-label="Pièces justificatives et modèles PDF" className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-semibold">Dossier documentaire — facture et rapport d’audit</h4>
          <p className="text-xs text-muted-foreground">
            Modèles vierges de présentation BIB (non émis). La facture fiscale réelle et le rapport approuvé doivent
            être produits, vérifiés, archivés et rattachés séparément au dossier.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="underline underline-offset-4" href={c.kind === "initial"
            ? "https://drive.google.com/file/d/17CP1lGicPRAP_s_ZBN8CJ2ATsxxgqIWO/view"
            : "https://drive.google.com/file/d/1yeSXIxCzpxOhkLw6CC-uFEX2aQ_brTOh/view"}
            target="_blank" rel="noopener noreferrer">Modèle facture + rapport (PDF)</a>
          <a className="underline underline-offset-4" href={c.kind === "initial"
            ? "https://drive.google.com/file/d/1jfRdJbjkLcwg1JuxzyFYOJLVQbJ7klye/view"
            : "https://drive.google.com/file/d/1sH-7fz28KBbBm-JzgLvLQWHQEIwfoCSz/view"}
            target="_blank" rel="noopener noreferrer">Modèle de rapport seul</a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm"
            disabled={!c.invoice || !c.report || !c.report_approved_by || !c.report.evidence_reference.trim()}
            onClick={() => {
              try { downloadAuditEvidencePdf(c); }
              catch (error) { toast.error((error as Error).message); }
            }}>
            Télécharger synthèse du dossier (PDF)
          </Button>
          <span className="text-xs text-muted-foreground">
            Disponible seulement après rattachement de facture et approbation du rapport.
            Copie de suivi interne non fiscale ; aucun archivage automatique.
          </span>
        </div>
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div><dt className="font-semibold">Facture réelle</dt><dd>{c.invoice
            ? `Rattachée : ${c.invoice.reference} — justificatif ${c.invoice.document_reference}`
            : "Non rattachée"}</dd></div>
          <div><dt className="font-semibold">Rapport réel</dt><dd>{c.report
            ? (c.report_approved_by ? "Approuvé — preuve : " : "En relecture — preuve : ") + c.report.evidence_reference
            : "Non rattaché"}</dd></div>
          <div><dt className="font-semibold">Produits concernés</dt><dd>{c.scope.join(", ") || "À compléter"}</dd></div>
          <div><dt className="font-semibold">Validation produit</dt><dd>{c.reference_decisions?.length
            ? `${c.reference_decisions.length} décision(s) enregistrée(s)`
            : "Non enregistrée"}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Ne pas confondre l’accès à une maquette PDF avec la génération ou l’envoi d’une facture.
          Aucun paiement, validation d’audit ou changement de statut n’est déclenché par ces liens.
        </p>
      </section>
      {c.quote && (
        <div className="space-y-2 rounded-lg border p-3">
          <h4 className="font-semibold">Devis version {c.quote_version}</h4>
          <p className="whitespace-pre-wrap text-sm">
            Émetteur : {c.quote.issuer_identity}
          </p>
          <p className="whitespace-pre-wrap text-sm">
            Destinataire : {c.quote.recipient_identity}
          </p>
          <p className="text-sm">{c.quote.scope_note}</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>Prestation</th>
                <th>Qté</th>
                <th>Prix unitaire HT</th>
              </tr>
            </thead>
            <tbody>
              {c.quote.lines.map((l, i) => (
                <tr key={i}>
                  <td className="py-1">{l.label}</td>
                  <td>{l.quantity}</td>
                  <td>{euro(l.unit_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm">
            Remise : {euro(c.quote.discount_cents)} · HT :{" "}
            {euro(c.quote.net_cents)} · TVA : {euro(c.quote.tax_cents)} ·{" "}
            <strong>Total : {euro(c.quote.total_cents)}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            {c.quote.tax_basis} · Barème : {c.quote.tariff_version} · Validité :{" "}
            {c.quote.valid_until}
          </p>
          <p className="text-sm">
            {c.quote.payment_condition === "prepaid"
              ? "Paiement préalable"
              : "Paiement après prestation"}{" "}
            : {c.quote.payment_terms}
          </p>
          {c.acceptance && (
            <p className="text-sm">
              Acceptation de {c.acceptance.signatory}, enregistrée le{" "}
              {new Date(c.acceptance.recorded_at).toLocaleString("fr-FR")}.
            </p>
          )}
        </div>
      )}
      {c.invoice && (
        <div className="rounded-lg border p-3 text-sm">
          <p>
            Facture rattachée : {c.invoice.reference} · justificatif{" "}
            {c.invoice.document_reference}
          </p>
          <p>
            Paiements rapprochés : {euro(paid)}
            {c.quote ? ` / ${euro(c.quote.total_cents)}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Le rapprochement enregistre une preuve. Il n’émet pas une facture
            fiscale et n’exécute pas de paiement.
          </p>
        </div>
      )}
      {c.report && (
        <div className="space-y-2 rounded-lg border p-3 text-sm">
          <h4 className="font-semibold">
            Rapport {c.report_approved_by ? "validé" : "soumis à relecture"}
          </h4>
          <p className="whitespace-pre-wrap">{c.report.findings}</p>
          <p className="whitespace-pre-wrap">{c.report.conclusion}</p>
          <p className="text-xs text-muted-foreground">
            Preuves : {c.report.evidence_reference}
          </p>
        </div>
      )}
      {c.reference_decisions && (
        <div className="rounded-lg border p-3 text-sm">
          <h4 className="font-semibold">Décision par référence</h4>
          {c.reference_decisions.map((d) => (
            <p key={d.reference}>
              {d.reference} :{" "}
              {d.decision === "admitted"
                ? "Admise"
                : d.decision === "refused"
                  ? "Refusée"
                  : "À corriger"}
            </p>
          ))}
          <p>{c.reason}</p>
          <p className="text-xs text-muted-foreground">
            L’admission concerne ces références. La validation du catalogue et
            de l’échantillon marchand reste nécessaire avant publication.
          </p>
        </div>
      )}
      {available.length > 0 && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border p-3">
          <Label htmlFor="audit-action">Action autorisée</Label>
          <select
            id="audit-action"
            required
            value={action}
            className="h-10 w-full rounded-md border bg-background px-3"
            onChange={(e) => {
              setAction(e.target.value);
              setBaseRevision(c.revision);
              setFields({});
              setLines([{ label: "", quantity: "1", unit: "" }]);
              setExcluded(false);
              setDecisions({});
            }}
          >
            <option value="">Choisir une action</option>
            {available.map((a) => (
              <option key={a} value={a}>
                {actions[a]}
              </option>
            ))}
          </select>
          {action && stale && (
            <p role="alert" className="text-sm text-destructive">
              Ce dossier a changé. Reprenez l’action depuis la version
              actualisée avant d’enregistrer.
            </p>
          )}
          {[
            "preselect",
            "approve_quote",
            "approve_report",
            "cancel",
            "decide",
          ].includes(action) && field("reason", "Motif de la décision")}
          {action === "contract" && (
            <>
              {field("reference", "Référence du contrat signé")}
              {field("date", "Date de prise d’effet", "date")}
            </>
          )}
          {action === "draft_quote" && (
            <>
              <p className="text-sm text-muted-foreground">
                Montants en euros. Aucun tarif ou régime fiscal n’est approuvé
                automatiquement.
              </p>
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]"
                >
                  <Input
                    aria-label={`Prestation ${i + 1}`}
                    required
                    placeholder="Prestation"
                    value={line.label}
                    onChange={(e) =>
                      setLines((v) =>
                        v.map((l, j) =>
                          i === j ? { ...l, label: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label={`Quantité ${i + 1}`}
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    required
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((v) =>
                        v.map((l, j) =>
                          i === j ? { ...l, quantity: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  <Input
                    aria-label={`Prix unitaire HT en euros ${i + 1}`}
                    required
                    placeholder="Prix HT €"
                    value={line.unit}
                    onChange={(e) =>
                      setLines((v) =>
                        v.map((l, j) =>
                          i === j ? { ...l, unit: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={lines.length === 1}
                    onClick={() => setLines((v) => v.filter((_, j) => i !== j))}
                  >
                    Retirer
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={lines.length >= 50}
                onClick={() =>
                  setLines((v) => [
                    ...v,
                    { label: "", quantity: "1", unit: "" },
                  ])
                }
              >
                Ajouter une prestation
              </Button>
              <div className="grid gap-3 sm:grid-cols-2">
                {field("discount", "Remise en euros", "text", false)}
                {field("tax_rate", "Taux de TVA en pourcentage")}
                {field("tax_basis", "Régime fiscal et justification")}
                {field("tariff", "Version du barème accepté")}
                {field("valid_until", "Validité du devis", "date")}
              </div>
              <div>
                <Label htmlFor="audit-payment-condition">
                  Condition de paiement
                </Label>
                <select
                  id="audit-payment-condition"
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={fields.payment_condition || "after_service"}
                  onChange={(e) => set("payment_condition", e.target.value)}
                >
                  <option value="after_service">Après prestation</option>
                  {c.kind === "initial" && (
                    <option value="prepaid">Avant prestation</option>
                  )}
                </select>
              </div>
              {field(
                "issuer_identity",
                "Identité légale complète de l’émetteur",
                "textarea",
              )}
              {field(
                "recipient_identity",
                "Identité légale complète du fournisseur destinataire",
                "textarea",
              )}
              {field("payment_terms", "Échéance et modalités contractuelles")}
              {field(
                "scope_note",
                "Périmètre et livrables du contrôle",
                "textarea",
              )}
              {c.kind === "counter_audit" && (
                <>
                  {field(
                    "additional_control",
                    "Prestation supplémentaire justifiée",
                  )}
                  {field(
                    "supplier_attribution",
                    "Imputabilité fournisseur établie",
                  )}
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      required
                      checked={excluded}
                      onChange={(e) => setExcluded(e.target.checked)}
                    />
                    Ce contrôle est distinct des contrôles logistiques
                    ordinaires déjà rémunérés.
                  </label>
                </>
              )}
            </>
          )}
          {action === "record_acceptance" && (
            <>
              {field("signatory", "Nom et qualité du représentant habilité")}
              {field(
                "evidence",
                "Référence de la preuve externe d’acceptation",
              )}
              <p className="text-xs text-muted-foreground">
                La preuve doit viser exactement la version du devis affichée.
              </p>
            </>
          )}
          {action === "record_invoice" && (
            <>
              {field("reference", "Numéro de facture émise")}
              {field("date", "Date d’émission", "date")}
              {field("evidence", "Référence du document conservé")}
            </>
          )}
          {action === "record_payment" && (
            <>
              <p className="rounded-md border border-amber-400/40 bg-amber-50/50 p-3 text-sm text-foreground">
                Ce flux concerne un virement du fournisseur vers le compte professionnel BIB.
                Consultez le relevé de banque : un ordre de virement ou un statut Stripe
                ne confirme pas à lui seul le crédit de ce compte. L'enregistrement reste
                soumis à la validation financière et aux contrôles serveur.
              </p>
              {field("reference", "Identifiant unique du mouvement bancaire crédité")}
              {field("bank_statement_reference", "Référence du relevé bancaire vérifié")}
              {field("date", "Date de crédit constatée sur le relevé", "date")}
              {field("amount", "Montant crédité en euros")}
              <div className="space-y-1">
                <Label htmlFor="finance-bank-verification">Confirmation Finance *</Label>
                <select
                  id="finance-bank-verification"
                  required
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={fields.bank_verified ?? ""}
                  onChange={(e) => set("bank_verified", e.target.value)}
                >
                  <option value="">Confirmation requise</option>
                  <option value="confirmed">Crédit vérifié sur le relevé du compte professionnel BIB</option>
                </select>
              </div>
            </>
          )}
          {action === "submit_report" && (
            <>
              {field("findings", "Constats et contrôles réalisés", "textarea")}
              {field(
                "conclusion",
                "Conclusion et limites du contrôle",
                "textarea",
              )}
              {field("evidence", "Référence des preuves conservées")}
            </>
          )}
          {action === "decide" &&
            c.scope.map((reference) => (
              <div key={reference}>
                <Label htmlFor={`decision-${reference}`}>{reference}</Label>
                <select
                  id={`decision-${reference}`}
                  required
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={decisions[reference] ?? ""}
                  onChange={(e) =>
                    setDecisions((v) => ({ ...v, [reference]: e.target.value }))
                  }
                >
                  <option value="">Choisir une décision</option>
                  <option value="admitted">Admise</option>
                  <option value="correction_required">À corriger</option>
                  <option value="refused">Refusée</option>
                </select>
              </div>
            ))}
          {action && (
            <Button
              type="submit"
              disabled={
                advance.isPending || stale || !available.includes(action)
              }
            >
              {advance.isPending ? "Enregistrement…" : actions[action]}
            </Button>
          )}
        </form>
      )}
      {can("supplier.suppliers", "validate") && !profile?.test_account && (
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Rattacher l’espace partenaire vérifié
          </summary>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              bind.mutate();
            }}
          >
            <Field
              label="Identifiant du dossier partenaire vérifié"
              value={portalId}
              onChange={setPortalId}
            />
            <Field
              label="Justificatif du rapprochement d’identité"
              value={portalEvidence}
              onChange={setPortalEvidence}
            />
            <p className="text-xs text-muted-foreground">
              Le rattachement est immuable. Vérifiez le dossier approuvé dans
              BIB Platform avant validation.
            </p>
            <Button type="submit" disabled={bind.isPending}>
              Valider le rattachement
            </Button>
          </form>
        </details>
      )}
      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Historique des 100 dernières actions
        </summary>
        {events.isError && (
          <p role="alert" className="text-sm">
            Historique indisponible.
          </p>
        )}
        {events.data?.map((e) => (
          <p key={e.id} className="mt-2 text-sm">
            {new Date(e.created_at).toLocaleString("fr-FR")} ·{" "}
            {actions[e.action] ?? e.action}
          </p>
        ))}
      </details>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          void qc.invalidateQueries({ queryKey: ["supplier-audit-cases"] });
          void qc.invalidateQueries({
            queryKey: ["supplier-audit-case-events"],
          });
        }}
      >
        Actualiser le dossier
      </Button>
    </div>
  );
}
