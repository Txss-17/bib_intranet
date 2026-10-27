import { useMemo, useRef, useState } from "react";
import { FileText, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { poles } from "@/data/poles";
import { useHrPublications, useSaveHrPublication, useHrPublicationPermissions } from "@/hooks/useHrPublications";
import type { HrPublication } from "@/lib/hrPublications";

const categories = {
  announcement: "Annonce", information: "Information", planning: "Planning",
  reminder: "Rappel", report: "Rapport",
};
type Category = keyof typeof categories;
type SaveStatus = "draft" | "published" | "archived";
const statusLabels: Record<HrPublication["status"], string> = {
  draft: "Brouillon", scheduled: "Programmée", published: "Publiée", archived: "Archivée",
};
type FormState = {
  title: string; summary: string; body: string; subtype: Category | "";
  visibility: "" | "all" | "pole"; poles: string[];
};
const emptyForm = (): FormState => ({
  title: "", summary: "", body: "", subtype: "announcement", visibility: "all", poles: [],
});
const isCategory = (value: string | null): value is Category =>
  value !== null && Object.prototype.hasOwnProperty.call(categories, value);
const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR", {
    dateStyle: "medium", timeStyle: "short",
  });
};
const poleName = (id: string) => poles.find((pole) => pole.id === id)?.name ?? id;
function audienceLabel(row: HrPublication) {
  if (row.visibility_scope === "all") return "Tous les collaborateurs";
  const targets = (row.visibility_targets ?? []).map(poleName).join(", ");
  return row.visibility_scope === "pole"
    ? targets || "Pôles non renseignés"
    : [row.visibility_scope, targets].filter(Boolean).join(" : ");
}
function supportedAudience(row: HrPublication) {
  return row.visibility_scope === "all"
    ? !row.visibility_targets?.length
    : row.visibility_scope === "pole" && !!row.visibility_targets?.length &&
      row.visibility_targets.every((id) => poles.some((pole) => pole.id === id));
}

export default function Publications() {
  const query = useHrPublications();
  const save = useSaveHrPublication();
  const rights = useHrPublicationPermissions();
  const canRead = rights.data?.read === true;
  const canCreate = rights.data?.create === true;
  const canUpdate = rights.data?.update === true;
  const canPublish = rights.data?.publish === true;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reading, setReading] = useState<HrPublication | null>(null);
  const [editing, setEditing] = useState<HrPublication | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const saving = useRef(false);
  const creationKey = useRef<string | null>(null);
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("fr");
    return rows.filter((row) =>
      (status === "all" || row.status === status) &&
      [row.title, row.summary, row.body, row.subtype && categories[row.subtype as Category],
        audienceLabel(row)].filter(Boolean).join(" ").toLocaleLowerCase("fr").includes(needle));
  }, [rows, search, status]);
  const selected = reading && (rows.find((row) => row.id === reading.id) ?? reading);
  const canEdit = (row: HrPublication) => canUpdate && (row.status === "draft" || canPublish);

  const openEditor = (row: HrPublication | null) => {
    if (saving.current || save.isPending || (row ? !canEdit(row) : !canCreate)) return;
    save.reset();
    setFormError("");
    setEditing(row);
    creationKey.current = row ? null : crypto.randomUUID();
    setForm(row ? {
      title: row.title, summary: row.summary ?? "", body: row.body ?? "",
      subtype: isCategory(row.subtype) ? row.subtype : "",
      visibility: supportedAudience(row) ? row.visibility_scope as "all" | "pole" : "",
      poles: (row.visibility_targets ?? []).filter((id) => poles.some((pole) => pole.id === id)),
    } : emptyForm());
    setEditorOpen(true);
  };
  const submit = async (nextStatus: SaveStatus) => {
    if (saving.current || save.isPending) return;
    const needsPublish = nextStatus !== "draft" || (editing && editing.status !== "draft");
    if (!(editing ? canUpdate : canCreate) || (needsPublish && !canPublish)) {
      setFormError("Vous ne disposez pas des droits nécessaires à cette action."); return;
    }
    if (!form.title.trim() || !form.subtype || !form.visibility ||
        (form.visibility === "pole" && !form.poles.length)) {
      setFormError("Renseignez le titre, la catégorie et une audience valide."); return;
    }
    if (nextStatus === "published" && !form.body.trim()) {
      setFormError("Le contenu est obligatoire pour publier."); return;
    }
    saving.current = true;
    setFormError("");
    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id, expectedUpdatedAt: editing.updated_at } : { creationKey: creationKey.current! }),
        title: form.title.trim(), summary: form.summary.trim(), body: form.body.trim(),
        subtype: form.subtype, status: nextStatus, visibility: form.visibility,
        poles: form.visibility === "pole" ? form.poles : [],
      });
      setEditorOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Enregistrement impossible. Réessayez.");
    } finally {
      saving.current = false;
    }
  };

  if (rights.isLoading) return (
    <p role="status" className="enterprise-card p-6 text-sm text-muted-foreground">
      Vérification de vos droits sur les publications RH…
    </p>
  );
  if (rights.isError) return (
    <div role="alert" className="enterprise-card space-y-3 p-6">
      <p className="text-sm text-destructive">Vos droits n’ont pas pu être vérifiés.</p>
      <Button variant="outline" size="sm" disabled={rights.isFetching}
        onClick={() => void rights.refetch()}>Réessayer</Button>
    </div>
  );
  if (!canRead) return (
    <div role="alert" className="enterprise-card p-6 text-sm">
      Vous n’avez pas accès aux publications RH.
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FileText className="h-7 w-7" /> Publications internes
          </h1>
          <p className="text-muted-foreground">Actualités et communications RH</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
          {canCreate && <Button onClick={() => openEditor(null)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle publication
          </Button>}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["published", "draft", "archived"] as const).map((value) => (
          <Card key={value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {value === "published" ? "Publiées" : value === "draft" ? "Brouillons" : "Archivées"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {query.isLoading ? "…" : query.isError ? "—" : rows.filter((row) => row.status === value).length}
              </p>
              <p className="text-xs text-muted-foreground">Dans les publications chargées</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Rechercher une publication" className="pl-9" placeholder="Titre, contenu, audience…"
            value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select aria-label="Filtrer par statut" className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Jusqu’aux 200 publications RH les plus récemment modifiées dans votre périmètre.
      </p>

      {query.isLoading ? (
        <p role="status" className="enterprise-card p-6 text-sm text-muted-foreground">Chargement des publications…</p>
      ) : query.isError ? (
        <div role="alert" className="enterprise-card space-y-3 p-6">
          <p className="text-sm text-destructive">Les publications n’ont pas pu être chargées.</p>
          <Button size="sm" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      ) : !filtered.length ? (
        <p className="enterprise-card p-10 text-center text-sm text-muted-foreground">
          {rows.length ? "Aucune publication ne correspond aux filtres." : "Aucune publication RH dans votre périmètre."}
        </p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex flex-col justify-between gap-4 pt-6 sm:flex-row">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{statusLabels[row.status] ?? row.status}</Badge>
                    <Badge variant="outline">{isCategory(row.subtype) ? categories[row.subtype] : row.subtype ?? "Catégorie non renseignée"}</Badge>
                  </div>
                  <h2 className="break-words text-lg font-semibold">{row.title}</h2>
                  {row.summary && <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{row.summary}</p>}
                  <p className="text-xs text-muted-foreground">{audienceLabel(row)}</p>
                  <p className="text-xs text-muted-foreground">Modifiée le {formatDate(row.updated_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2 self-start">
                  <Button size="sm" variant="outline" onClick={() => setReading(row)}>Lire</Button>
                  {canEdit(row) && <Button size="sm" variant="ghost" onClick={() => openEditor(row)}>Modifier</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setReading(null); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">{selected?.title}</DialogTitle>
            <DialogDescription>{selected && statusLabels[selected.status]} · Communication RH</DialogDescription>
          </DialogHeader>
          {selected && <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Audience</dt><dd>{audienceLabel(selected)}</dd></div>
              <div><dt className="text-muted-foreground">Pôle auteur</dt><dd>{selected.author_pole ? poleName(selected.author_pole) : "Non renseigné"}</dd></div>
              <div><dt className="text-muted-foreground">Publication</dt><dd>{formatDate(selected.publish_at)}</dd></div>
              <div><dt className="text-muted-foreground">Dernière modification</dt><dd>{formatDate(selected.updated_at)}</dd></div>
              {selected.available_at && <div><dt className="text-muted-foreground">Disponible à partir du</dt><dd>{formatDate(selected.available_at)}</dd></div>}
              {selected.archive_at && <div><dt className="text-muted-foreground">Archivage</dt><dd>{formatDate(selected.archive_at)}</dd></div>}
            </dl>
            {selected.summary && <p className="whitespace-pre-wrap break-words font-medium">{selected.summary}</p>}
            <div className="whitespace-pre-wrap break-words border-t pt-4 text-sm">
              {selected.body || "Aucun contenu renseigné."}
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={(open) => {
        if (!save.isPending && !saving.current) setEditorOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"
          onEscapeKeyDown={(event) => { if (save.isPending || saving.current) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (save.isPending || saving.current) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la publication" : "Nouvelle publication"}</DialogTitle>
            <DialogDescription>Préparez le contenu et choisissez les collaborateurs destinataires.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit("draft"); }}>
            {editing?.status === "scheduled" && <p className="rounded-lg border p-3 text-sm">
              Cette publication est programmée. Choisissez explicitement de la remettre en brouillon, de la publier maintenant ou de l’archiver.
            </p>}
            {editing && (!isCategory(editing.subtype) || !supportedAudience(editing)) &&
              <p className="rounded-lg border p-3 text-sm">
                La catégorie ou l’audience enregistrée utilise une configuration historique.
                Choisissez une catégorie et une audience prises en charge avant d’enregistrer.
                Audience actuelle : {audienceLabel(editing)}.
              </p>}
            <fieldset disabled={save.isPending} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="hr-publication-title">Titre</Label>
                <Input id="hr-publication-title" maxLength={255} required value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="hr-publication-summary">Résumé</Label>
                <Textarea id="hr-publication-summary" rows={2} maxLength={1000} value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="hr-publication-body">Contenu</Label>
                <Textarea id="hr-publication-body" rows={8} maxLength={20000} value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })} />
                <p className="text-xs text-muted-foreground">Texte simple. Obligatoire pour publier.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="hr-publication-category">Catégorie</Label>
                  <select id="hr-publication-category" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.subtype} onChange={(event) => setForm({ ...form, subtype: event.target.value as Category | "" })}>
                    <option value="" disabled>Choisir une catégorie</option>
                    {Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select></div>
                <div className="space-y-2"><Label htmlFor="hr-publication-audience">Audience</Label>
                  <select id="hr-publication-audience" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as FormState["visibility"] })}>
                    <option value="" disabled>Choisir une audience</option>
                    <option value="all">Tous les collaborateurs</option><option value="pole">Pôles sélectionnés</option>
                  </select></div>
              </div>
              {form.visibility === "pole" && <fieldset className="rounded-lg border p-3">
                <legend className="px-1 text-sm font-medium">Pôles destinataires</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {poles.map((pole) => <label key={pole.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.poles.includes(pole.id)}
                      onChange={(event) => setForm({ ...form, poles: event.target.checked
                        ? [...form.poles, pole.id] : form.poles.filter((id) => id !== pole.id) })} />
                    {pole.name}
                  </label>)}
                </div>
              </fieldset>}
            </fieldset>
            {formError && <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{formError}</p>}
            {save.isPending && <p role="status" className="text-sm text-muted-foreground">Enregistrement…</p>}
            <DialogFooter className="flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={save.isPending} onClick={() => { if (!saving.current) setEditorOpen(false); }}>Annuler</Button>
              <Button type="submit" variant="outline" disabled={save.isPending}>
                {editing && editing.status !== "draft" ? "Repasser en brouillon" : "Enregistrer le brouillon"}
              </Button>
              {canPublish && <>
                {editing && editing.status !== "archived" && <Button type="button" variant="outline"
                  disabled={save.isPending} onClick={() => void submit("archived")}>Archiver</Button>}
                <Button type="button" disabled={save.isPending} onClick={() => void submit("published")}>
                  {editing?.status === "published" ? "Enregistrer la publication" : "Publier maintenant"}
                </Button>
              </>}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
