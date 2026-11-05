import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useCashflows } from '@/hooks/useFinance';
import FinancialAnalytics from '@/components/finance/FinancialAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FINANCE_SECTIONS = [
  { page: 'finance.cashflow', path: '/pole/finance/cashflow', name: 'Trésorerie', detail: 'Entrées, sorties et soldes par devise du registre interne' },
  { page: 'finance.transactions', path: '/pole/finance/transactions', name: 'Transactions plateforme', detail: 'Registre des écritures et orientation vers les contrôles de paiement Stripe' },
  { page: 'finance.billing', path: '/pole/finance/billing', name: 'Facturation', detail: 'Factures et vérifications documentaires' },
  { page: 'finance.payouts', path: '/pole/finance/payouts', name: 'Paiements partenaires', detail: 'Versements marchands et règlements fournisseurs' },
  { page: 'finance.reconciliation', path: '/pole/finance/reconciliation', name: 'Rapprochement BIB ↔ Stripe', detail: 'Contrôle par commande : paiement, frais, factures et reversements' },
  { page: 'finance.subscriptions', path: '/pole/finance/subscriptions', name: 'Abonnements', detail: 'Contrôles financiers des abonnements Marketplace' },
  { page: 'finance.cards', path: '/pole/finance/cards', name: 'Cartes entreprise', detail: 'Suivi des dépenses, demandes et décisions autorisées' },
  { page: 'finance.guarantee', path: '/pole/finance/guarantee', name: 'Fonds de garantie', detail: 'Mouvements enregistrés et justificatifs de contrôle' },
  { page: 'finance.salaries', path: '/pole/finance/salaries', name: 'Salaires & primes', detail: 'Suivi administratif, sans exécution de paiement' },
] as const;

export default function FinanceDashboard() {
  const { canViewPage } = usePermissions();
  const canReadCashflows = canViewPage('finance.cashflow');
  const movements = useCashflows({ limit: 8, enabled: canReadCashflows });
  const visible = FINANCE_SECTIONS.filter(section => canViewPage(section.page));
  const recent = canReadCashflows && !movements.isError ? movements.data || [] : [];

  return <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-semibold">Pilotage financier BIB</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Stripe est la source opérationnelle des événements de paiement de BIB Platform : charges, frais, commissions, transferts, remboursements, litiges et versements.
        Cet aperçu s'appuie encore sur les écritures synchronisées dans l’Intranet, et non sur une consultation directe de l’API Stripe. Aucun virement n’est exécuté ici.
      </p>
    </header>
    <Card>
      <CardHeader><CardTitle className="text-base">Séparation des flux financiers — décisions BIB-00 / BIB-00bis</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><strong>GMV ≠ chiffre d'affaires des marchands ≠ revenu propre de BIB.</strong> Les encaissements client, commissions de marchands tiers, abonnements fournisseurs, audits facturés sur devis, créances fournisseurs et reversements ne doivent jamais être additionnés comme un seul revenu BIB.</p>
        <p className="text-muted-foreground">Les boutiques tests propres sont exploitées par la même entreprise individuelle. Elles ne génèrent ni abonnement ni commission internes, mais leurs ventes et charges doivent être distinguées analytiquement. Aucun compte bancaire ou SIREN autonome ne leur est attribué fictivement.</p>
        <p className="text-muted-foreground">Audit documentaire initial payant sur devis accepté (base indicative de 150 €). Forfait fournisseur retenu à 19 €/mois, avec TVA à qualifier. Une commande fournisseur, son paiement et la couverture financière de la production suivent les jalons contractuels ; un paiement Stripe ne constitue ni une facture ni une disponibilité de trésorerie.</p>
        <p className="text-muted-foreground">Les graphiques du registre de trésorerie ci-dessous ne calculent pas encore les trois agrégats GMV / CA marchand / CA BIB. Un rapprochement par commande et partie juridique sera nécessaire avant tout reporting financier consolidé.</p>
      </CardContent>
    </Card>
    {canViewPage('finance.reconciliation') && (
      <Card>
        <CardHeader><CardTitle className="text-base">Contrôle Stripe et virements fournisseurs</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Stripe :</strong> suivre la charge, la commission BIB, les frais,
            les transferts Connect, les refunds, les disputes et les versements.
            Une charge Stripe confirmée n'est ni une facture, ni la preuve du crédit bancaire.
          </p>
          <p>
            <strong>Virements des fournisseurs vers BIB :</strong> Finance vérifie
            séparément le crédit sur le compte professionnel correspondant à l'entité
            BIB émettrice de la facture d'audit ou de contre-audit.
            Les virements non identifiés ou partiels restent à examiner.
          </p>
          <p className="text-muted-foreground">
            Les API Stripe, l'import bancaire et la réconciliation automatique exhaustive
            restent soumis à leur configuration et aux contrôles serveur.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/pole/finance/reconciliation">Rapprochements Stripe</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to="/pole/finance/billing">Factures et audits</Link></Button>
          </div>
        </CardContent>
      </Card>
    )}
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
    {canReadCashflows && <FinancialAnalytics />}
    {canReadCashflows && <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Dernières écritures disponibles dans l’Intranet</h2>
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
