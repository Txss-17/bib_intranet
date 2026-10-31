import { Link } from 'react-router-dom';
import FinancialOverview from '@/components/operations/FinancialOverview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CashflowRealtime() {
  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-semibold">Trésorerie BIB</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        BIB Platform est la source des commandes et abonnements ; Stripe traite leurs paiements.
        Le registre interne présenté ici rassemble uniquement les flux effectivement synchronisés
        ou enregistrés. Il ne correspond ni au solde bancaire ni au solde disponible chez Stripe.
      </p>
    </header>
    <Card><CardContent className="space-y-3 p-4 text-sm">
      <p className="font-medium">Ne pas confondre encaissement client et trésorerie disponible pour BIB</p>
      <p className="text-muted-foreground">
        Les montants collectés pour les marchands ne sont pas automatiquement des revenus BIB.
        Pour connaître la trésorerie réellement mobilisable, il faut rapprocher les fonds reçus
        sur les comptes bancaires, les frais Stripe, les remboursements, les reversements dus aux
        marchands et les décaissements BIB. Les flux en attente ou non rapprochés restent distincts.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/pole/finance/reconciliation">Vérifier les écarts Stripe</Link></Button>
        <Button variant="outline" asChild><Link to="/pole/finance/payouts">Reversements et règlements</Link></Button>
        <Button variant="outline" asChild><Link to="/pole/finance/transactions">Écritures de la plateforme</Link></Button>
      </div>
    </CardContent></Card>
    <FinancialOverview title="Registre des mouvements de trésorerie" />
  </div>;
}
