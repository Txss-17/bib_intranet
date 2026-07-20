import { Laptop, FileText, CreditCard, Package, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EQUIPMENT = [
  { name: 'Ordinateur portable', detail: 'Non renseigné', status: 'pending' as const },
  { name: 'Écran externe', detail: 'Non renseigné', status: 'pending' as const },
  { name: 'Casque / accessoires', detail: 'Non renseigné', status: 'pending' as const },
];

const LICENSES = [
  { name: 'Suite Microsoft 365', detail: 'Business Standard', status: 'active' as const },
  { name: 'Google Workspace', detail: 'Non renseigné', status: 'pending' as const },
  { name: 'VPN entreprise', detail: 'Actif', status: 'active' as const },
];

const HR_DOCS = [
  { name: 'Contrat de travail', type: 'Contrat' },
  { name: 'Bulletins de salaire', type: 'Paie' },
  { name: 'Convention collective', type: 'Réglementaire' },
  { name: 'Charte informatique', type: 'Politique' },
  { name: 'Politique de frais', type: 'Politique' },
];

function StatusBadge({ status }: { status: 'active' | 'pending' }) {
  if (status === 'active') return <Badge variant="secondary">Actif</Badge>;
  return <Badge variant="outline">À renseigner</Badge>;
}

export function ResourcesTab() {
  return (
    <div className="space-y-6">
      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Laptop className="h-4 w-4" /> Matériel attribué
        </h3>
        <div className="space-y-2">
          {EQUIPMENT.map((e) => (
            <div key={e.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.detail}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Package className="h-4 w-4" /> Licences & outils
        </h3>
        <div className="space-y-2">
          {LICENSES.map((l) => (
            <div key={l.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.detail}</p>
              </div>
              <StatusBadge status={l.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Carte entreprise
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Statut</p>
            <Badge variant="secondary" className="mt-1">Active</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plafond mensuel</p>
            <p className="text-sm font-medium mt-1">— (à définir Finance)</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Catégories autorisées</p>
            <p className="text-sm font-medium mt-1">Transport · Repas · Hébergement</p>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" /> Voir l'historique des dépenses
          </Button>
        </div>
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documents RH
        </h3>
        <div className="space-y-2">
          {HR_DOCS.map((d) => (
            <div key={d.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.type}</p>
              </div>
              <Button variant="outline" size="sm">Consulter</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
