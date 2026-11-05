import { useState } from "react";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** No consent solicitation for an intranet with no optional tracking integration. */
export function CookieInformation() {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="fixed bottom-3 left-3 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Cookie className="h-3.5 w-3.5" aria-hidden="true" />Cookies et confidentialité</button>
    <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto rounded-xl">
      <DialogHeader>
        <DialogTitle>Cookies et stockage dans Intrabib</DialogTitle>
        <DialogDescription>Les usages de cette application sont distincts des choix de cookies du site public BIB.</DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border border-border p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Strictement nécessaires</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>La session Supabase conserve votre connexion. Ses jetons expirent et sont renouvelés pendant la session ; la déconnexion supprime la session enregistrée.</li>
          <li>Le cookie <code>sidebar_state</code> mémorise l'état du menu pendant sept jours après votre action.</li>
          <li>Un marqueur technique conserve l'exécution du nettoyage des anciennes données du navigateur. Il reste jusqu'à la suppression du stockage du site.</li>
        </ul>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">Intrabib n'active actuellement ni statistiques de navigation facultatives, ni lecteur tiers, ni pixel publicitaire. Il n'y a donc aucun usage facultatif à accepter ici. Les usages strictement nécessaires au service demandé ne sont pas soumis à un choix de consentement cookies.</p>
      <p className="text-sm leading-relaxed text-muted-foreground">Vous pouvez vous déconnecter puis supprimer les données du site dans votre navigateur. Cela pourra réinitialiser votre connexion et le menu. Si des traceurs facultatifs sont ajoutés, un choix préalable devra permettre de les accepter, de les refuser ou de les personnaliser, puis de retirer l'accord.</p>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
    </DialogContent>
  </Dialog>;
}
