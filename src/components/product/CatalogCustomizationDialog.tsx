import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CAPABILITY_KEYS,
  parseCustomizationCapabilities,
  parseCustomizationTerms,
  type CustomizationCapabilities,
} from "@/lib/productCustomization";
import {
  useSaveCatalogCustomization,
  type QualifiedCatalogProduct,
} from "@/hooks/useCatalogCustomization";

const labels = {
  logo: "Techniques de logo",
  colors: "Couleurs autorisées (#RRGGBB)",
  materials: "Matières",
  finishes: "Finitions",
  packaging: "Packagings",
  marking: "Marquages",
  dimensions: "Dimensions disponibles",
};
export function CatalogCustomizationDialog({
  product,
  onClose,
}: {
  product: QualifiedCatalogProduct | null;
  onClose: () => void;
}) {
  const save = useSaveCatalogCustomization();
  const [lists, setLists] = useState<Record<string, string>>({});
  const [text, setText] = useState(false);
  const [terms, setTerms] = useState({ moq: "", days: "", surcharge: "" });
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!product) return;
    try {
      const caps = parseCustomizationCapabilities(
        product.customization_capabilities,
      );
      const storedTerms = parseCustomizationTerms(product.customization_terms);
      setLists(
        Object.fromEntries(
          CAPABILITY_KEYS.map((key) => [key, caps[key]?.join("\n") ?? ""]),
        ),
      );
      setText(caps.text === true);
      setTerms({
        moq: String(storedTerms.moq ?? ""),
        days: String(storedTerms.lead_time_days ?? ""),
        surcharge:
          storedTerms.surcharge_cents == null
            ? ""
            : (storedTerms.surcharge_cents / 100).toFixed(2),
      });
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [product]);
  const submit = async () => {
    if (!product) return;
    try {
      const raw: CustomizationCapabilities = { text };
      for (const key of CAPABILITY_KEYS)
        raw[key] = [
          ...new Set(
            (lists[key] ?? "")
              .split(/\r?\n/)
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ];
      const price = terms.surcharge.trim();
      if (price && !/^\d+(?:[.,]\d{1,2})?$/.test(price))
        throw new Error("Le supplément doit avoir au plus deux décimales.");
      const [whole, fraction = ""] = price.replace(",", ".").split(".");
      const parsed = parseCustomizationTerms({
        ...(terms.moq.trim() ? { moq: Number(terms.moq) } : {}),
        ...(terms.days.trim() ? { lead_time_days: Number(terms.days) } : {}),
        ...(price
          ? {
              surcharge_cents:
                Number(whole) * 100 + Number(fraction.padEnd(2, "0")),
              currency: product.currency,
            }
          : {}),
        sample_required: true,
      });
      await save.mutateAsync({
        productId: product.id,
        capabilities: parseCustomizationCapabilities(raw),
        terms: parsed,
      });
      toast.success(
        "Capacités enregistrées. Transmettez le produit à Platform pour les publier.",
      );
      onClose();
    } catch (error) {
      toast.error("Enregistrement impossible", {
        description:
          (error as { code?: string }).code === "42501"
            ? "Vous n’avez pas les droits sur ce portefeuille produit."
            : "Vérifiez les options, les couleurs, les quantités, les délais et la devise.",
      });
    }
  };
  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capacités de personnalisation</DialogTitle>
          <DialogDescription>
            {product?.name} — saisissez uniquement les options confirmées avec
            le fournisseur. Une option par ligne ; une liste vide signifie
            qu’aucune option n’est qualifiée.
          </DialogDescription>
        </DialogHeader>
        {loadError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive p-4 text-sm text-destructive"
          >
            Les capacités enregistrées sont invalides. Corrigez la fiche source
            avant de la transmettre.
          </p>
        ) : (
          <fieldset
            disabled={save.isPending}
            className="grid gap-4 sm:grid-cols-2"
          >
            {CAPABILITY_KEYS.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={"cap-" + key}>{labels[key]}</Label>
                <Textarea
                  id={"cap-" + key}
                  value={lists[key] ?? ""}
                  onChange={(event) =>
                    setLists({ ...lists, [key]: event.target.value })
                  }
                  rows={3}
                />
              </div>
            ))}
            <label className="flex items-center gap-3 self-start rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={text}
                onChange={(event) => setText(event.target.checked)}
              />
              Texte personnalisé autorisé
            </label>
            <div className="space-y-2">
              <Label htmlFor="cap-moq">MOQ de personnalisation</Label>
              <Input
                id="cap-moq"
                type="number"
                min={1}
                step={1}
                placeholder={
                  product?.moq != null
                    ? "MOQ catalogue : " + product.moq
                    : "À confirmer"
                }
                value={terms.moq}
                onChange={(event) =>
                  setTerms({ ...terms, moq: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cap-days">Délai confirmé (jours)</Label>
              <Input
                id="cap-days"
                type="number"
                min={1}
                step={1}
                placeholder="À confirmer"
                value={terms.days}
                onChange={(event) =>
                  setTerms({ ...terms, days: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cap-surcharge">
                Supplément unitaire{" "}
                {product?.currency ?? "(devise à renseigner sur la fiche)"}
              </Label>
              <Input
                id="cap-surcharge"
                inputMode="decimal"
                placeholder="Sur devis si non renseigné"
                value={terms.surcharge}
                onChange={(event) =>
                  setTerms({ ...terms, surcharge: event.target.value })
                }
              />
            </div>
            <p className="self-center text-sm text-muted-foreground">
              Échantillon physique obligatoire avant production. Ces données ne
              valident ni un échantillon ni une commande de fabrication.
            </p>
          </fieldset>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={loadError || save.isPending} onClick={submit}>
            {save.isPending ? "Enregistrement…" : "Enregistrer les capacités"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
