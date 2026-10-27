import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformActions } from "@/hooks/usePlatformSync";
import {
  usePlatformRestockRequests,
  type PlatformRestockRequest,
  type RestockStatus,
  type RestockView,
} from "@/hooks/usePlatformRestockRequests";

const statusLabels: Record<RestockStatus, string> = {
  requested: "À examiner",
  approved: "Approuvée",
  ordered: "Commande engagée",
  received: "Réception confirmée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function RestockReviewQueue({
  canReview,
}: {
  canReview: boolean;
}) {
  const [view, setView] = useState<RestockView>("requested");
  const query = usePlatformRestockRequests(view);

  return (
    <section className="enterprise-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            Demandes de réapprovisionnement Platform
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Demandes marchandes importées à chaque synchronisation, dans votre
            périmètre produit.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Actualisation…" : "Actualiser"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        L’approbation est transmise au marchand. Elle ne crédite aucun stock et
        ne crée aucun ordre d’achat fournisseur.
      </p>

      <div className="flex flex-wrap gap-2" aria-label="Afficher les demandes">
        <Button
          size="sm"
          variant={view === "requested" ? "default" : "outline"}
          aria-pressed={view === "requested"}
          onClick={() => setView("requested")}
        >
          À examiner
        </Button>
        <Button
          size="sm"
          variant={view === "history" ? "default" : "outline"}
          aria-pressed={view === "history"}
          onClick={() => setView("history")}
        >
          Historique
        </Button>
      </div>

      {query.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Chargement des demandes…
        </p>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-destructive">
            Impossible de charger les demandes. Réessayez pour obtenir les
            informations à jour.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : !query.data?.length ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {view === "requested"
            ? "Aucune demande à examiner dans votre périmètre."
            : "Aucune demande traitée dans votre périmètre."}
        </p>
      ) : (
        <>
          {query.data.map((request) => (
            <RestockReviewItem
              key={request.id + ":" + request.version}
              request={request}
              canReview={canReview}
            />
          ))}
          {query.data.length === 100 && (
            <p className="text-xs text-muted-foreground">
              Les 100 demandes les plus récentes de cette vue sont affichées.
            </p>
          )}
        </>
      )}
    </section>
  );
}

type ReviewInput = {
  requestId: string;
  version: number;
  status: "approved" | "rejected";
  comment: string | null;
};

function RestockReviewItem({
  request,
  canReview,
}: {
  request: PlatformRestockRequest;
  canReview: boolean;
}) {
  const { reviewRestock } = usePlatformActions();
  const [comment, setComment] = useState(request.review_comment ?? "");
  const [lastAttempt, setLastAttempt] = useState<ReviewInput | null>(null);
  const reviewable = canReview && request.status === "requested";
  const belowMoq = request.requested_quantity < request.catalog_moq;

  const submit = (status: ReviewInput["status"]) => {
    const input: ReviewInput = {
      requestId: request.id,
      version: request.version,
      status,
      comment: comment.trim() || null,
    };
    setLastAttempt(input);
    reviewRestock.mutate(input);
  };

  return (
    <article className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{request.product_name}</h3>
          {request.products && (
            <p className="mt-1 text-xs text-muted-foreground">
              Référence BIB : {request.products.name}
              {request.products.sku ? " · " + request.products.sku : ""}
            </p>
          )}
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {statusLabels[request.status]}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Boutique</dt>
          <dd className="mt-0.5 break-words">
            {request.boutique_name ??
              "Boutique " + request.platform_boutique_id.slice(0, 8)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Quantité demandée</dt>
          <dd className="mt-0.5">
            {request.requested_quantity.toLocaleString("fr-FR")} unités
            {" · "}MOQ : {request.catalog_moq.toLocaleString("fr-FR")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Demande créée le</dt>
          <dd className="mt-0.5">{formatDate(request.created_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dernière mise à jour</dt>
          <dd className="mt-0.5">{formatDate(request.updated_at)}</dd>
        </div>
      </dl>

      {request.note && (
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Note du marchand</p>
          <p className="whitespace-pre-wrap break-words">{request.note}</p>
        </div>
      )}

      {request.review_comment && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">Décision communiquée au marchand</p>
          <p className="mt-1 whitespace-pre-wrap break-words">
            {request.review_comment}
          </p>
        </div>
      )}

      {reviewable && (
        <div className="space-y-3">
          {belowMoq && (
            <p role="alert" className="text-sm text-destructive">
              La quantité est inférieure au MOQ. Cette demande ne peut pas être
              approuvée.
            </p>
          )}
          <label className="block space-y-2 text-sm">
            <span>Commentaire visible par le marchand</span>
            <Textarea
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={reviewRestock.isPending}
              placeholder="Précisez votre décision. Un motif est obligatoire pour un refus."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={reviewRestock.isPending || belowMoq}
              onClick={() => submit("approved")}
            >
              Approuver la demande
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reviewRestock.isPending || !comment.trim()}
              onClick={() => submit("rejected")}
            >
              Refuser avec motif
            </Button>
          </div>

          {reviewRestock.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Transmission de la décision…
            </p>
          )}
          {reviewRestock.isError && (
            <div role="alert" className="space-y-2 rounded-lg border p-3">
              <p className="text-sm text-destructive">
                {reviewRestock.error instanceof Error
                  ? reviewRestock.error.message
                  : "La décision n’a pas pu être confirmée."}
              </p>
              <p className="text-xs text-muted-foreground">
                Actualisez les demandes pour vérifier leur statut ou réessayez
                de transmettre la même décision.
              </p>
              {lastAttempt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reviewRestock.mutate(lastAttempt)}
                >
                  Réessayer la même décision
                </Button>
              )}
            </div>
          )}
          {reviewRestock.isSuccess && (
            <p role="status" className="text-sm text-muted-foreground">
              Décision confirmée par Platform.
            </p>
          )}
        </div>
      )}

      {!canReview && request.status === "requested" && (
        <p className="text-xs text-muted-foreground">
          Lecture seule : la validation requiert les droits sur ce produit.
        </p>
      )}
    </article>
  );
}
