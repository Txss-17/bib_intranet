import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Shield,
  Users,
  Eye,
  Lock,
} from 'lucide-react';

type PoleKey =
  | 'direction'
  | 'finance'
  | 'ops'
  | 'supplier'
  | 'marketplace'
  | 'support'
  | 'marketing'
  | 'rh'
  | 'audit'
  | 'compliance'
  | 'rse'
  | 'product'
  | 'data'
  | 'security';

type ModuleAccessUser = {
  id: number;
  user: string;
  role: string;
} & Record<PoleKey, boolean>;

const modules: Array<{
  key: PoleKey;
  label: string;
}> = [
  {
    key: 'direction',
    label: 'Direction',
  },
  {
    key: 'finance',
    label: 'Finance',
  },
  {
    key: 'ops',
    label: 'Opérations & Logistique',
  },
  {
    key: 'supplier',
    label: 'Fournisseurs & Produits',
  },
  {
    key: 'marketplace',
    label: 'Marketplace & Customer',
  },
  {
    key: 'support',
    label: 'Support & Customer Success',
  },
  {
    key: 'marketing',
    label: 'Marketing & Communication',
  },
  {
    key: 'rh',
    label: 'RH',
  },
  {
    key: 'audit',
    label: 'Qualité & Audit',
  },
  {
    key: 'compliance',
    label: 'Conformité & Juridique',
  },
  {
    key: 'rse',
    label: 'RSE & Impact',
  },
  {
    key: 'product',
    label: 'Produit & Engineering',
  },
  {
    key: 'data',
    label: 'Data & BI',
  },
  {
    key: 'security',
    label: 'Security & IT',
  },
];

const moduleAccessData: ModuleAccessUser[] = [
  {
    id: 1,
    user: 'Sarah Martin',
    role: 'CEO / Direction',

    direction: true,
    finance: true,
    ops: true,
    supplier: true,
    marketplace: true,
    support: true,
    marketing: true,
    rh: true,
    audit: true,
    compliance: true,
    rse: true,
    product: true,
    data: true,
    security: true,
  },

  {
    id: 2,
    user: 'Marc Leblanc',
    role: 'Responsable Finance',

    direction: false,
    finance: true,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: true,
    compliance: true,
    rse: false,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 3,
    user: 'Julie Dupont',
    role: 'Responsable Opérations & Logistique',

    direction: false,
    finance: false,
    ops: true,
    supplier: true,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: true,
    compliance: false,
    rse: true,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 4,
    user: 'Pierre Klein',
    role: 'Responsable Produit & Engineering',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: false,
    compliance: false,
    rse: false,
    product: true,
    data: false,
    security: true,
  },

  {
    id: 5,
    user: 'Marie Laurent',
    role: 'Responsable RH',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: true,
    audit: false,
    compliance: true,
    rse: false,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 6,
    user: 'Thomas Bernard',
    role: 'Responsable Marketing & Communication',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: true,
    support: true,
    marketing: true,
    rh: false,
    audit: false,
    compliance: false,
    rse: false,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 7,
    user: 'Nora Petit',
    role: 'Responsable Marketplace & Customer Success',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: true,
    support: true,
    marketing: false,
    rh: false,
    audit: false,
    compliance: false,
    rse: false,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 8,
    user: 'Alex Morel',
    role: 'Responsable Data & BI',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: false,
    compliance: false,
    rse: false,
    product: false,
    data: true,
    security: false,
  },

  {
    id: 9,
    user: 'Camille Robert',
    role: 'Responsable Security & IT',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: false,
    compliance: false,
    rse: false,
    product: true,
    data: false,
    security: true,
  },

  {
    id: 10,
    user: 'Lucas Bernard',
    role: 'Responsable RSE & Impact',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: false,
    compliance: false,
    rse: true,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 11,
    user: 'Emma Garcia',
    role: 'Responsable Fournisseurs & Produits',

    direction: false,
    finance: false,
    ops: false,
    supplier: true,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: true,
    compliance: true,
    rse: false,
    product: false,
    data: false,
    security: false,
  },

  {
    id: 12,
    user: 'Hugo Martin',
    role: 'Responsable Audit & Conformité',

    direction: false,
    finance: false,
    ops: false,
    supplier: false,
    marketplace: false,
    support: false,
    marketing: false,
    rh: false,
    audit: true,
    compliance: true,
    rse: false,
    product: false,
    data: false,
    security: false,
  },
];

const kpis = [
  {
    label: 'Utilisateurs',
    value: moduleAccessData.length,
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    label: 'Pôles actifs',
    value: modules.length,
    icon: Shield,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    label: 'Accès en lecture',
    value: moduleAccessData.reduce(
      (total, user) =>
        total +
        modules.filter(
          (module) => user[module.key],
        ).length,
      0,
    ),
    icon: Eye,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    label: 'Restrictions',
    value: moduleAccessData.reduce(
      (total, user) =>
        total +
        modules.filter(
          (module) => !user[module.key],
        ).length,
      0,
    ),
    icon: Lock,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
];

export default function ModuleAccess() {
  const [searchQuery, setSearchQuery] =
    useState('');

  const filtered = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return moduleAccessData;
    }

    return moduleAccessData.filter(
      (user) =>
        user.user
          .toLowerCase()
          .includes(query) ||
        user.role
          .toLowerCase()
          .includes(query),
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">
          Accès lecture des pôles
        </h1>

        <p className="text-muted-foreground">
          Vue de synthèse des droits d'accès en
          lecture par utilisateur et par pôle.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </p>

                    <p
                      className={`mt-1 text-3xl font-bold ${kpi.color}`}
                    >
                      {kpi.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bgColor}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${kpi.color}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>
                Matrice d'accès
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Lecture seule de la matrice de
                référence.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                className="w-64 pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[170px] bg-background">
                    Utilisateur
                  </TableHead>

                  <TableHead className="sticky left-[170px] z-10 min-w-[220px] bg-background">
                    Rôle
                  </TableHead>

                  {modules.map((module) => (
                    <TableHead
                      key={module.key}
                      className="min-w-[120px] whitespace-nowrap text-center text-xs"
                    >
                      {module.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-background font-medium">
                      {user.user}
                    </TableCell>

                    <TableCell className="sticky left-[170px] z-10 whitespace-nowrap bg-background text-sm text-muted-foreground">
                      {user.role}
                    </TableCell>

                    {modules.map((module) => (
                      <TableCell
                        key={module.key}
                        className="text-center"
                      >
                        <Switch
                          checked={
                            user[module.key]
                          }
                          disabled
                          aria-label={`${module.label} — ${user.user}`}
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={
                        modules.length + 2
                      }
                      className="h-24 text-center text-muted-foreground"
                    >
                      Aucun utilisateur ne
                      correspond à la recherche.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
