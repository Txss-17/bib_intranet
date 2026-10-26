import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useCustomizationReviewRequests,
  type CustomizationReviewRequest,
} from "@/hooks/useCatalogCustomization";
import { usePlatformActions } from "@/hooks/usePlatformSync";

export function CustomizationReviewQueue({
  canReview,
}: {
  canReview: boolean;
}) {
  const query = useCustomizationReviewRequests();
  return (
    <section className="enterprise-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            Demandes de personnalisation Platform
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Importées à chaque synchronisation du bridge. Seuls les dossiers de
            votre périmètre sont accessibles.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Actualiser
        </Button>
      </div>
      {query.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Chargement des demandes…
        </p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Les demandes sont indisponibles. Vérifiez la migration et la
          synchronisation du bridge, puis réessayez.
        </p>
      ) : !query.data?.length ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Aucune demande transmise dans votre périmètre.
        </p>
      ) : (
        query.data.map((request) => (
          <ReviewItem
            key={request.id + ":" + request.version}
            request={request}
            canReview={canReview}
          />
        ))
      )}
    </section>
  );
}
function ReviewItem({
  request,
  canReview,
}: {
  request: CustomizationReviewRequest;
  canReview: boolean;
}) {
  const { reviewCustomization } = usePlatformActions();
  const [comment, setComment] = useState(request.supplier_comment ?? "");
  const reviewable = ["submitted", "in_review"].includes(
    request.supplier_status,
  );
  const labels: Record<string, string> = {
    submitted: "À examiner",
    in_review: "En revue",
    approved: "Accord technique",
    changes_requested: "Modifications demandées",
    rejected: "Refusé",
  };
  const configLabels: Record<string, string> = {
    brand: "Marque",
    color: "Couleur",
    logoOption: "Technique du logo",
    packaging: "Packaging",
    marking: "Marquage",
    material: "Matière",
    finish: "Finition",
    dimensions: "Dimensions",
    text: "Texte",
    instructions: "Consignes",
  };
  return (
    <article className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-medium">
          {request.products?.name ?? "Produit"}
          {request.merchant_config.brand
            ? " · " + request.merchant_config.brand
            : ""}
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {labels[request.supplier_status] ?? request.supplier_status}
        </span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {Object.entries(configLabels).map(([key, label]) =>
          request.merchant_config[key] ? (
            <div key={key}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap break-words">
                {request.merchant_config[key]}
              </dd>
            </div>
          ) : null,
        )}
      </dl>
      {request.merchant_config.logo?.startsWith("https://") && (
        <a
          href={request.merchant_config.logo}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm underline"
        >
          Ouvrir le fichier de logo
        </a>
      )}
      <p className="text-xs text-muted-foreground">
        L’accord technique ne valide pas l’échantillon physique et ne déclenche
        pas la production.
      </p>
      {canReview && reviewable ? (
        <div className="space-y-3">
          <label className="block space-y-2 text-sm">
            <span>Commentaire visible par le marchand</span>
            <Textarea
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={reviewCustomization.isPending}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              ["in_review", "Prendre en revue"],
              ["approved", "Accord technique"],
              ["changes_requested", "Demander des modifications"],
              ["rejected", "Refuser"],
            ].map(([status, label]) => (
              <Button
                key={status}
                size="sm"
                variant={status === "approved" ? "default" : "outline"}
                disabled={
                  reviewCustomization.isPending ||
                  (["changes_requested", "rejected"].includes(status) &&
                    !comment.trim())
                }
                onClick={() =>
                  reviewCustomization.mutate({
                    requestId: request.id,
                    version: request.version,
                    status,
                    comment: comment.trim() || null,
                  })
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        request.supplier_comment && (
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
            {request.supplier_comment}
          </p>
        )
      )}
    </article>
  );
}
