import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useLegalRecords,
  useLegalActions,
  useLegalRecordDetails,
  legalBridge,
  type LegalKind,
  type LegalRecord,
  type IdentitySnapshot,
} from "@/hooks/useLegalGovernance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const states: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Revue juridique attendue",
  legal_approved: "Revue juridique enregistrée",
  direction_approved: "Validation Direction enregistrée",
  published: "Publié dans le registre",
  withdrawn: "Retiré",
};
const actions: Record<string, string> = {
  edit: "Corriger le brouillon",
  submit: "Soumettre à la revue juridique",
  legal_approve: "Valider la revue juridique",
  direction_approve: "Valider pour la Direction",
  publish: "Publier et transmettre à Platform",
  withdraw: "Retirer et transmettre à Platform",
  reject: "Demander une correction",
  create: "Création",
};
const fieldLabels: Record<string, string> = {
  FORME_OU_EI: "Forme juridique réelle ou EI",
  MEDIATEUR_COORDONNEES: "Médiateur effectivement désigné et coordonnées",
  TVA_ID: "Identification TVA ou mention applicable vérifiée",
  BIB_IDENTITE_LEGALE_VERIFIEE: "Identité légale vérifiée de l’exploitant BIB",
  BIB_CONTACT: "Coordonnées de BIB",
  HEBERGEUR_RAISON_SOCIALE_ET_COORDONNEES:
    "Hébergeur contractuel et coordonnées",
  CAPITAL_SOCIAL: "Capital social si applicable",
  REGISTRE_IMMATRICULATION: "Registre d’immatriculation si applicable",
};
const requiredFields = Object.keys(fieldLabels).slice(0, 6);
function TextField({
  name,
  label,
  value,
  onChange,
  multiline = false,
  required = true,
  type = "text",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>
        {label}
        {required ? " *" : ""}
      </Label>
      {multiline ? (
        <Textarea
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200000}
          rows={8}
          required={required}
        />
      ) : (
        <Input
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={5000}
          type={type}
          required={required}
        />
      )}
    </div>
  );
}
function IdentityFields({
  fields,
  onChange,
  prefix,
}: {
  fields: Record<string, string>;
  onChange: (fields: Record<string, string>) => void;
  prefix: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(fieldLabels).map(([key, label]) => (
        <TextField
          key={key}
          name={prefix + "-" + key}
          label={label}
          value={fields[key] ?? ""}
          onChange={(value) => onChange({ ...fields, [key]: value })}
          required={requiredFields.includes(key)}
        />
      ))}
    </div>
  );
}
export default function LegalGovernancePanel({
  kind = "model",
}: {
  kind?: LegalKind;
}) {
  const { can } = usePermissions();
  const page =
    kind === "model" ? "compliance.policies" : "compliance.contracts";
  const query = useLegalRecords(kind);
  const api = useLegalActions();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [modelKey, setModelKey] = useState("JUR-B01");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [store, setStore] = useState("");
  const [snapshot, setSnapshot] = useState<IdentitySnapshot | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const load = useMutation({
    mutationFn: () =>
      legalBridge<{ snapshot: IdentitySnapshot }>({
        action: "identity_snapshot",
        store_id: store.trim(),
      }),
    onSuccess: (r) => setSnapshot(r.snapshot),
    onError: (e: Error) => toast.error(e.message),
  });
  const current = query.data?.find((r) => r.id === selected);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r =
        kind === "model"
          ? await api.create.mutateAsync({
              kind,
              payload: {
                model_key: modelKey,
                version: version.trim(),
                title: title.trim(),
                body,
                effective_at: new Date(date).toISOString(),
                locale: "fr",
              },
            })
          : await api.identity.mutateAsync({
              snapshot: snapshot!,
              fields: Object.fromEntries(
                Object.entries(fields)
                  .map(([k, v]) => [k, v.trim()])
                  .filter(([, v]) => v),
              ),
            });
      setSelected(r.id);
      setCreating(false);
      setVersion("");
      setTitle("");
      setBody("");
      setDate("");
      setSnapshot(null);
      setFields({});
      toast.success("Brouillon enregistré. Aucune approbation n’est présumée.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {kind === "model"
              ? "Modèles juridiques des boutiques"
              : "Vendeurs : vérification des identités"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {kind === "model"
              ? "JUR-B01, B02 et B03 : texte contrôlé, relecture juridique puis validation Direction distinctes."
              : "Les données de base sont relues sur Platform. Un justificatif et une revue indépendante sont requis."}
          </p>
        </div>
        {can(page, "create") && (
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? "Fermer" : "Nouveau dossier"}
          </Button>
        )}
      </header>
      {creating && (
        <form onSubmit={create} className="space-y-3 rounded-lg border p-4">
          {kind === "model" ? (
            <>
              <Label htmlFor="legal-model-key">Modèle</Label>
              <select
                id="legal-model-key"
                className="h-10 w-full rounded-md border bg-background px-3"
                value={modelKey}
                onChange={(e) => setModelKey(e.target.value)}
              >
                {["JUR-B01", "JUR-B02", "JUR-B03"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <TextField
                name="legal-version"
                label="Version documentaire unique"
                value={version}
                onChange={setVersion}
              />
              <TextField
                name="legal-title"
                label="Titre présenté"
                value={title}
                onChange={setTitle}
              />
              <TextField
                name="legal-effective"
                label="Entrée en vigueur (heure locale)"
                type="datetime-local"
                value={date}
                onChange={setDate}
              />
              <TextField
                name="legal-body"
                label="Texte complet du modèle, avec ses champs contrôlés {{…}}"
                value={body}
                onChange={setBody}
                multiline
              />
              <p className="text-xs text-muted-foreground">
                Reprendre le modèle documentaire applicable. Aucune clause libre
                du thème de boutique ne remplace ce texte. Les champs et les
                validations sont contrôlés au serveur.
              </p>
            </>
          ) : (
            <>
              <TextField
                name="legal-store-id"
                label="Identifiant exact de la boutique Platform"
                value={store}
                onChange={(value) => {
                  setStore(value);
                  setSnapshot(null);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={load.isPending}
                onClick={() => load.mutate()}
              >
                Lire l’identité sur Platform
              </Button>
              {snapshot && (
                <>
                  <div className="space-y-1 rounded border p-3 text-sm">
                    {Object.entries(snapshot.fields).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}</strong> : {value}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Ces données sont relues avant la création. Leur correction
                      passe par la boutique, puis une nouvelle vérification.
                    </p>
                  </div>
                  <IdentityFields
                    fields={fields}
                    onChange={setFields}
                    prefix="legal-create"
                  />
                </>
              )}
            </>
          )}
          <Button
            type="submit"
            disabled={
              api.create.isPending ||
              api.identity.isPending ||
              (kind === "identity" && !snapshot)
            }
          >
            Enregistrer le brouillon
          </Button>
        </form>
      )}
      {query.isLoading && <p role="status">Chargement du registre…</p>}
      {query.isError && (
        <p role="alert">
          Registre indisponible. Vérifiez les permissions et l’activation.{" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </p>
      )}
      {!query.isLoading && !query.isError && (
        <div className="grid gap-4 lg:grid-cols-[minmax(200px,1fr)_3fr]">
          <nav aria-label="Dossiers juridiques" className="space-y-2">
            {query.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun dossier accessible.
              </p>
            )}
            {query.data?.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`block w-full rounded-lg border p-3 text-left ${r.id === selected ? "border-primary" : ""}`}
              >
                <strong className="block text-sm break-words">
                  {kind === "model"
                    ? String(r.payload.model_key) +
                      " · " +
                      String(r.payload.version)
                    : String(
                        (r.payload.fields as Record<string, string>)
                          .VENDEUR_NOM_LEGAL,
                      )}
                </strong>
                <Badge variant="outline">{states[r.state]}</Badge>
              </button>
            ))}
          </nav>
          {current ? (
            <RecordDetail key={current.id} record={current} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un dossier pour consulter le texte et ses
              validations.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function RecordDetail({ record: r }: { record: LegalRecord }) {
  const { can } = usePermissions();
  const { user } = useAuth();
  const api = useLegalActions();
  const { events, deliveries } = useLegalRecordDetails(r.id);
  const page =
    r.kind === "model" ? "compliance.policies" : "compliance.contracts";
  const [action, setAction] = useState("");
  const [revision, setRevision] = useState(r.revision);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [title, setTitle] = useState(String(r.payload.title ?? ""));
  const [text, setText] = useState(String(r.payload.body ?? ""));
  const [date, setDate] = useState(String(r.payload.effective_at ?? ""));
  const [fields, setFields] = useState(
    (r.payload.fields ?? {}) as Record<string, string>,
  );
  const available: string[] = [];
  if (can(page, "update") && r.state === "draft")
    available.push("edit", "submit");
  if (can(page, "validate")) {
    if (r.state === "submitted" && r.created_by !== user?.id)
      available.push("legal_approve");
    if (
      (r.kind === "model" && r.state === "direction_approved") ||
      (r.kind === "identity" && r.state === "legal_approved")
    )
      available.push("publish");
    if (r.state === "published") available.push("withdraw");
    if (["submitted", "legal_approved", "direction_approved"].includes(r.state))
      available.push("reject");
  }
  if (
    r.kind === "model" &&
    r.state === "legal_approved" &&
    can("direction.governance", "validate") &&
    ![r.created_by, r.legal_reviewer].includes(user?.id ?? "")
  )
    available.push("direction_approve");
  const stale = revision !== r.revision;
  const delivery = deliveries.data?.find(
    (d) => d.delivery_sequence === r.delivery_sequence,
  );
  const transmit = async () => {
    try {
      await api.deliver.mutateAsync(r.id);
      toast.success("Transmission confirmée par Platform.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload: Record<string, unknown> =
        action === "submit" ? {} : { reason, evidence };
      if (action === "edit")
        payload = {
          payload:
            r.kind === "model"
              ? {
                  ...r.payload,
                  title,
                  body: text,
                  effective_at: new Date(date).toISOString(),
                }
              : {
                  ...r.payload,
                  fields: Object.fromEntries(
                    Object.entries(fields).filter(([, v]) => v.trim()),
                  ),
                },
        };
      await api.advance.mutateAsync({ id: r.id, revision, action, payload });
      toast.success("Action et pièces de validation enregistrées.");
      setAction("");
      if (["publish", "withdraw"].includes(action)) {
        try {
          await api.deliver.mutateAsync(r.id);
          toast.success("Transmission confirmée par Platform.");
        } catch {
          toast.warning(
            "Décision enregistrée ; transmission en attente. Utilisez Réessayer la transmission.",
          );
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  return (
    <article className="min-w-0 space-y-4">
      <div className="space-y-2 rounded border p-3">
        <p className="break-all text-xs text-muted-foreground">
          Dossier {r.id} · révision {r.revision}
        </p>
        <Badge>{states[r.state]}</Badge>
        {r.kind === "model" ? (
          <>
            <h3 className="font-semibold">{String(r.payload.title)}</h3>
            <p className="text-sm">
              Entrée en vigueur :{" "}
              {new Date(String(r.payload.effective_at)).toLocaleString("fr-FR")}
            </p>
            <div
              className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words text-sm"
              tabIndex={0}
            >
              {String(r.payload.body)}
            </div>
          </>
        ) : (
          <>
            <p className="break-all text-xs">
              Boutique : {String(r.payload.store_id)} · entité :{" "}
              {String(r.payload.legal_entity_id)}
            </p>
            {Object.entries(r.payload.fields as Record<string, string>).map(
              ([key, value]) => (
                <p className="text-sm whitespace-pre-wrap" key={key}>
                  <strong>{fieldLabels[key] ?? key}</strong> : {value}
                </p>
              ),
            )}
          </>
        )}
        {r.legal_evidence && (
          <p className="text-xs text-muted-foreground">
            Justificatif juridique : {r.legal_evidence}
          </p>
        )}
        {r.direction_evidence && (
          <p className="text-xs text-muted-foreground">
            Justificatif Direction : {r.direction_evidence}
          </p>
        )}
        {r.reason && <p className="text-sm">Dernier motif : {r.reason}</p>}
      </div>
      {available.length > 0 && (
        <form className="space-y-3 rounded border p-3" onSubmit={submit}>
          <Label htmlFor="legal-action">Action autorisée</Label>
          <select
            id="legal-action"
            required
            value={action}
            className="h-10 w-full rounded-md border bg-background px-3"
            onChange={(e) => {
              setAction(e.target.value);
              setRevision(r.revision);
              setReason("");
              setEvidence("");
              setTitle(String(r.payload.title ?? ""));
              setText(String(r.payload.body ?? ""));
              setDate(String(r.payload.effective_at ?? ""));
              setFields((r.payload.fields ?? {}) as Record<string, string>);
            }}
          >
            <option value="">Choisir une action</option>
            {available.map((a) => (
              <option key={a} value={a}>
                {actions[a]}
              </option>
            ))}
          </select>
          {action === "edit" &&
            (r.kind === "model" ? (
              <>
                <TextField
                  name="legal-edit-title"
                  label="Titre présenté"
                  value={title}
                  onChange={setTitle}
                />
                <TextField
                  name="legal-edit-date"
                  label="Entrée en vigueur (ISO avec fuseau)"
                  value={date}
                  onChange={setDate}
                />
                <TextField
                  name="legal-edit-text"
                  label="Texte complet"
                  value={text}
                  onChange={setText}
                  multiline
                />
              </>
            ) : (
              <IdentityFields
                fields={fields}
                onChange={setFields}
                prefix={"legal-edit-" + r.id}
              />
            ))}
          {action && !["edit", "submit"].includes(action) && (
            <TextField
              name="legal-reason"
              label="Motif de la décision"
              value={reason}
              onChange={setReason}
              multiline
            />
          )}
          {["legal_approve", "direction_approve"].includes(action) && (
            <TextField
              name="legal-evidence"
              label="Référence du justificatif de revue conservé"
              value={evidence}
              onChange={setEvidence}
            />
          )}
          {stale && action && (
            <p role="alert" className="text-sm text-destructive">
              Le dossier a changé. Sélectionnez de nouveau l’action pour
              travailler sur la révision actuelle.
            </p>
          )}
          {action && (
            <Button type="submit" disabled={stale || api.advance.isPending}>
              {actions[action]}
            </Button>
          )}
        </form>
      )}
      {["published", "withdrawn"].includes(r.state) && (
        <div className="space-y-2 rounded border p-3">
          <p className="text-sm">
            Transmission actuelle :{" "}
            {delivery?.state === "delivered"
              ? "confirmée par Platform"
              : "en attente de confirmation"}
          </p>
          <p className="text-xs text-muted-foreground">
            La publication au registre et l’activation distante sont distinctes.
            Une transmission manquante doit être reprise, en particulier après
            retrait.
          </p>
          {can(page, "validate") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void transmit()}
              disabled={api.deliver.isPending}
            >
              Réessayer la transmission
            </Button>
          )}
        </div>
      )}
      <details className="rounded border p-3">
        <summary>Historique des 100 dernières actions</summary>
        {events.isError && <p role="alert">Historique indisponible.</p>}
        {events.data?.map((e) => (
          <p className="mt-2 text-sm" key={e.id}>
            {new Date(e.created_at).toLocaleString("fr-FR")} ·{" "}
            {actions[e.action] ?? e.action}
          </p>
        ))}
      </details>
      <Button type="button" variant="outline" size="sm" onClick={api.refresh}>
        Actualiser le dossier
      </Button>
    </article>
  );
}
