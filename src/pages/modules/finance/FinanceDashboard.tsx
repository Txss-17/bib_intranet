import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useCashflows } from '@/hooks/useFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FINANCE_SECTIONS = [
  { page: 'finance.cashflow', path: '/pole/finance/cashflow', name: 'Trésorerie', detail: 'Entrées, sorties et soldes par devise du registre interne' },
  { page: 'finance.transactions', path: '/pole/finance/transactions', name: 'Transactions', detail: 'Mouvements et dossiers de contrôle financier' },
  { page: 'finance.billing', path: '/pole/finance/billing', name: 'Facturation', detail: 'Factures et vérifications documentaires' },
  { page: 'finance.payouts', path: '/pole/finance/payouts', name: 'Paiements partenaires', detail: 'Versements marchands et règlements fournisseurs' },
  { page: 'finance.reconciliation', path: '/pole/finance/reconciliation', name: 'Rapprochement', detail: 'Comparaison commandes, paiements, factures et reversements' },
  { page: 'finance.subscriptions', path: '/pole/finance/subscriptions', name: 'Abonnements', detail: 'Contrôles financiers des abonnements Marketplace' },
  { page: 'finance.cards', path: '/pole/finance/cards', name: 'Cartes entreprise', detail: 'Suivi des dépenses, demandes et décisions autorisées' },
  { page: 'finance.guarantee', path: '/pole/finance/guarantee', name: 'Fonds de garantie', detail: 'Mouvements enregistrés et justificatifs de contrôle' },
  { page: 'finance.salaries', path: '/pole/finance/salaries', name: 'Salaires & primes', detail: 'Suivi administratif, sans exécution de paiement' },
] as const;

export default function FinanceDashboard() {
  const { canViewPage } = usePermissions();
  const canReadCashflows = canViewPage('finance.cashflow');
  const movements = useCashflows({ limit: 8 });
  const visible = FINANCE_SECTIONS.filter(section => canViewPage(section.page));
  const recent = canReadCashflows && !movements.isError ? movements.data || [] : [];

  return <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-semibold">Pilotage financier BIB</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Accès centralisé aux registres Finance, aux vérifications et aux dossiers de suivi.
        Les montants affichés proviennent des écritures internes ; aucun virement n'est exécuté par ce tableau de bord.
      </p>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map(section => <Card key={section.page}>
        <CardHeader className="pb-2"><CardTitle className="text-base">{section.name}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="min-h-10 text-sm text-muted-foreground">{section.detail}</p>
          <Button variant="outline" size="sm" asChild><Link to={section.path}>Ouvrir la rubrique</Link></Button>
        </CardContent>
      </Card>)}
    </div>
    {visible.length === 0 && <p role="alert">Aucune rubrique financière n'est accessible avec les permissions de ce compte.</p>}
    {canReadCashflows && <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Derniers mouvements du registre</h2>
        <Button variant="outline" size="sm" asChild><Link to="/pole/finance/cashflow">Consulter la trésorerie</Link></Button>
      </div>
      {movements.isLoading && <p role="status">Chargement des mouvements…</p>}
      {movements.isError && <p role="alert" className="text-sm text-destructive">
        Registre de trésorerie indisponible. Aucun montant n'est confirmé.
        <Button variant="outline" size="sm" onClick={() => void movements.refetch()}>Réessayer</Button>
      </p>}
      {!movements.isLoading && !movements.isError && recent.length === 0 && <p className="text-sm text-muted-foreground">Aucun mouvement enregistré.</p>}
      {!movements.isLoading && !movements.isError && recent.length > 0 &&
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b"><th className="p-3">Date</th><th className="p-3">Référence</th><th className="p-3">Nature</th><th className="p-3">Montant</th><th className="p-3">Devise</th></tr></thead>
            <tbody>{recent.map(row => <tr key={row.id} className="border-b last:border-0">
              <td className="p-3">{row.transaction_date}</td>
              <td className="p-3">{row.reference || row.description || '—'}</td>
              <td className="p-3">{row.type === 'income' ? 'Entrée' : row.type === 'expense' ? 'Sortie' : row.type}</td>
              <td className="p-3 tabular-nums">{Number(row.amount).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
              <td className="p-3">{row.currency || 'Non renseignée'}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      <p className="text-xs text-muted-foreground">
        Aperçu limité aux huit dernières écritures accessibles. Aucun total multi-devises ni solde bancaire n'est déduit de cet aperçu.
      </p>
    </section>}
  </div>;
}
