import { useParams } from 'react-router-dom';
import { getPoleById } from '@/data/poles';
import { getModuleNavigation } from '@/data/moduleNavigations';
import { PoleId } from '@/types';
import {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
  FileText,
  Construction,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
};

export default function SubSectionPage() {
  const { poleId, subSection } = useParams<{ poleId: string; subSection: string }>();
  
  const pole = getPoleById(poleId || '');
  const navItems = getModuleNavigation(poleId as PoleId);
  const currentSection = navItems.find(item => item.id === subSection);

  if (!pole || !currentSection) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Section not found</p>
      </div>
    );
  }

  const Icon = iconMap[pole.icon] || FileText;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-secondary')}>
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{currentSection.labelFr}</h1>
              <span className={cn('h-2 w-2 rounded-full', pole.color)} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pole.shortName} · {pole.name}
            </p>
          </div>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="enterprise-card p-12 text-center">
        <Construction className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Module en cours de développement
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cette section sera bientôt disponible. Les fonctionnalités de "{currentSection.labelFr}" 
          pour le pôle {pole.name} sont en préparation.
        </p>
      </div>

      {/* Section-specific mock data placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="enterprise-card p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Éléments en attente
          </h4>
          <p className="text-2xl font-semibold text-foreground">—</p>
        </div>
        <div className="enterprise-card p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Actions requises
          </h4>
          <p className="text-2xl font-semibold text-foreground">—</p>
        </div>
        <div className="enterprise-card p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Dernière mise à jour
          </h4>
          <p className="text-2xl font-semibold text-foreground">—</p>
        </div>
      </div>
    </div>
  );
}
