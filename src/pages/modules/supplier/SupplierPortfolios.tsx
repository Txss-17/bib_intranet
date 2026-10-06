import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  FolderOpen,
  Users,
  Star,
  AlertTriangle,
  Search,
  ArrowRightLeft,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AssignmentSuggestion } from '@/components/supplier/AssignmentSuggestion';

type SupplierPortfolio = {
  id: string;
  backup_id: string | null;
  backup_name: string;
  category: string;
  created_at: string | null;
  responsible_id: string | null;
  responsible_name: string;
  updated_at: string | null;
};

type PortfolioAssignment = {
  id: string;
  assigned_at: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string;
  portfolio_id: string | null;
  supplier_id: string | null;
};

type SupplierRow = {
  id: string;
  name: string;
  country: string;
  score: number;
  status: string;
  portfolioId: string | null;
  portfolioName: string;
  portfolioCategory: string;
  assignedTo: string;
  lastAudit: string;
  alerts: number;
};

type PortfolioSummary = SupplierPortfolio & {
  supplierCount: number;
  averageScore: number;
  alertCount: number;
};

function useSupplierPortfolios() {
  return useQuery({
    queryKey: ['supplier-portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_portfolios')
        .select('*')
        .order('category')
        .order('responsible_name');

      if (error) {
        throw error;
      }

      return (data ?? []) as SupplierPortfolio[];
    },
  });
}

function useSupplierPortfolioData(
  portfolios: SupplierPortfolio[],
) {
  return useQuery({
    queryKey: [
      'supplier-portfolio-data',
      portfolios.map((portfolio) => portfolio.id),
    ],

    enabled: portfolios.length > 0,

    queryFn: async () => {
      const [
        suppliersResult,
        assignmentsResult,
        alertsResult,
      ] = await Promise.all([
        supabase
          .from('suppliers')
          .select(
            `
              id,
              name,
              country,
              quality_score,
              status,
              last_audit_date
            `,
          )
          .eq('status', 'validated')
          .order('name'),

        supabase
          .from('portfolio_assignments')
          .select(
            `
              id,
              assigned_at,
              assigned_to_id,
              assigned_to_name,
              portfolio_id,
              supplier_id
            `,
          ),

        supabase
          .from('quality_alerts')
          .select('supplier_id, id')
          .eq('status', 'open'),
      ]);

      if (suppliersResult.error) {
        throw suppliersResult.error;
      }

      if (assignmentsResult.error) {
        throw assignmentsResult.error;
      }

      if (alertsResult.error) {
        throw alertsResult.error;
      }

      const portfolioById =
        new Map(
          portfolios.map((portfolio) => [
            portfolio.id,
            portfolio,
          ]),
        );

      const assignmentBySupplier =
        new Map<string, PortfolioAssignment>();

      (
        assignmentsResult.data ?? []
      ).forEach((assignment) => {
        if (!assignment.supplier_id) {
          return;
        }

        assignmentBySupplier.set(
          assignment.supplier_id,
          assignment as PortfolioAssignment,
        );
      });

      const alertsBySupplier: Record<
        string,
        number
      > = {};

      (
        alertsResult.data ?? []
      ).forEach((alert) => {
        if (!alert.supplier_id) {
          return;
        }

        alertsBySupplier[
          alert.supplier_id
        ] =
          (alertsBySupplier[
            alert.supplier_id
          ] ?? 0) + 1;
      });

      return (
        suppliersResult.data ?? []
      ).map((supplier): SupplierRow => {
        const assignment =
          assignmentBySupplier.get(
            supplier.id,
          );

        const portfolio =
          assignment?.portfolio_id
            ? portfolioById.get(
                assignment.portfolio_id,
              )
            : undefined;

        return {
          id: supplier.id,
          name: supplier.name,
          country:
            supplier.country || '🌍',
          score:
            supplier.quality_score ?? 0,
          status: supplier.status,
          portfolioId:
            assignment?.portfolio_id ??
            null,
          portfolioName:
            portfolio?.backup_name ||
            'Non affecté',
          portfolioCategory:
            portfolio?.category ||
            'Non catégorisé',
          assignedTo:
            assignment?.assigned_to_name ||
            portfolio?.responsible_name ||
            'Non assigné',
          lastAudit:
            supplier.last_audit_date
              ? new Date(
                  supplier.last_audit_date,
                ).toLocaleDateString(
                  'fr-FR',
                )
              : '—',
          alerts:
            alertsBySupplier[
              supplier.id
            ] ?? 0,
        };
      });
    },
  });
}

export default function SupplierPortfolios() {
  const [activeTab, setActiveTab] =
    useState('portfolios');

  const [
    selectedPortfolio,
    setSelectedPortfolio,
  ] = useState('all');

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('all');

  const [
    assignmentOpen,
    setAssignmentOpen,
  ] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    name: string;
    portfolioId: string;
    category: string;
  } | null>(null);

  const {
    data: portfolios = [],
    isLoading: portfoliosLoading,
  } = useSupplierPortfolios();

  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
  } = useSupplierPortfolioData(
    portfolios,
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          portfolios.map(
            (portfolio) =>
              portfolio.category,
          ),
        ),
      ).sort(),
    [portfolios],
  );

  const filteredSuppliers =
    useMemo(() => {
      return suppliers.filter(
        (supplier) => {
          const matchesPortfolio =
            selectedPortfolio ===
              'all' ||
            supplier.portfolioId ===
              selectedPortfolio;

          const matchesCategory =
            selectedCategory ===
              'all' ||
            supplier.portfolioCategory ===
              selectedCategory;

          return (
            matchesPortfolio &&
            matchesCategory
          );
        },
      );
    }, [
      suppliers,
      selectedPortfolio,
      selectedCategory,
    ]);

  const suppliersTable =
    useTableInteractions({
      data: filteredSuppliers,
      searchFields: [
        'name',
        'assignedTo',
        'portfolioName',
        'portfolioCategory',
      ],
    });

  const totalSuppliers =
    suppliers.length;

  const averageScore =
    totalSuppliers > 0
      ? Math.round(
          suppliers.reduce(
            (total, supplier) =>
              total + supplier.score,
            0,
          ) / totalSuppliers,
        )
      : 0;

  const totalAlerts =
    suppliers.reduce(
      (total, supplier) =>
        total + supplier.alerts,
      0,
    );

  const portfolioSummaries:
    PortfolioSummary[] =
    portfolios.map((portfolio) => {
      const portfolioSuppliers =
        suppliers.filter(
          (supplier) =>
            supplier.portfolioId ===
            portfolio.id,
        );

      const averageScore =
        portfolioSuppliers.length > 0
          ? Math.round(
              portfolioSuppliers.reduce(
                (total, supplier) =>
                  total +
                  supplier.score,
                0,
              ) /
                portfolioSuppliers.length,
            )
          : 0;

      const alertCount =
        portfolioSuppliers.reduce(
          (total, supplier) =>
            total +
            supplier.alerts,
          0,
        );

      return {
        ...portfolio,
        supplierCount:
          portfolioSuppliers.length,
        averageScore,
        alertCount,
      };
    });

  const unassignedSuppliers =
    suppliers.filter(
      (supplier) =>
        !supplier.portfolioId,
    );

  const suppliersByResponsible =
    useMemo(() => {
      const grouped: Record<
        string,
        SupplierRow[]
      > = {};

      suppliers.forEach((supplier) => {
        const responsible =
          supplier.assignedTo ||
          'Non assigné';

        if (!grouped[responsible]) {
          grouped[responsible] = [];
        }

        grouped[responsible].push(
          supplier,
        );
      });

      return grouped;
    }, [suppliers]);

  const handleReassign = (
    supplierName: string,
    category: string,
  ) => {
    setSelectedSupplier({
      name: supplierName,
      category,
    });

    setAssignmentOpen(true);
  };

  const getLoadColor = (
    count: number,
    max: number,
  ) => {
    const percentage =
      max > 0
        ? (count / max) * 100
        : 0;

    if (percentage >= 90) {
      return 'text-destructive';
    }

    if (percentage >= 70) {
      return 'text-yellow-500';
    }

    return 'text-emerald-500';
  };

  const isLoading =
    portfoliosLoading ||
    suppliersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />

          <div>
            <h1 className="text-3xl font-bold">
              Portefeuilles Fournisseurs
            </h1>

            <p className="text-muted-foreground">
              Gestion des portefeuilles de
              fournisseurs du pôle Fournisseurs
              & Produits.
            </p>
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Un portefeuille constitue l'unité de
          pilotage. La catégorie est une
          caractéristique du portefeuille et ne
          constitue pas un portefeuille autonome.
        </p>
      </div>

      {/* KPIs */}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {totalSuppliers}
            </p>

            <p className="text-xs text-muted-foreground">
              Fournisseurs validés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <FolderOpen className="h-5 w-5 text-primary" />

            <p className="mt-2 text-2xl font-bold">
              {portfolios.length}
            </p>

            <p className="text-xs text-muted-foreground">
              Portefeuilles fournisseurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Star className="h-5 w-5 text-yellow-500" />

            <p className="mt-2 text-2xl font-bold">
              {averageScore}%
            </p>

            <p className="text-xs text-muted-foreground">
              Score qualité moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />

            <p className="mt-2 text-2xl font-bold">
              {totalAlerts}
            </p>

            <p className="text-xs text-muted-foreground">
              Alertes qualité actives
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="portfolios">
            Portefeuilles
          </TabsTrigger>

          <TabsTrigger value="suppliers">
            Fournisseurs
          </TabsTrigger>

          <TabsTrigger value="manager">
            Vue responsable
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
            PORTEFEUILLES
            ============================================================ */}

        <TabsContent
          value="portfolios"
          className="mt-4 space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Portefeuilles fournisseurs
              </CardTitle>

              <CardDescription>
                Chaque carte correspond à un
                enregistrement réel de
                supplier_portfolios.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {portfolioSummaries.length ===
              0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />

                  <p className="mt-3 font-medium">
                    Aucun portefeuille
                    fournisseur
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucun portefeuille n'est
                    actuellement enregistré.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {portfolioSummaries.map(
                    (portfolio) => (
                      <Card
                        key={portfolio.id}
                        className="cursor-pointer transition-shadow hover:shadow-md"
                        onClick={() => {
                          setSelectedPortfolio(
                            portfolio.id,
                          );
                          setActiveTab(
                            'suppliers',
                          );
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-lg">
                                {portfolio.category}
                              </CardTitle>

                              <CardDescription>
                                Responsable :{' '}
                                {portfolio.responsible_name ||
                                  'Non défini'}
                              </CardDescription>
                            </div>

                            <Badge variant="outline">
                              Portefeuille
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Fournisseurs
                              </p>

                              <p className="text-xl font-bold">
                                {
                                  portfolio.supplierCount
                                }
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Alertes
                              </p>

                              <p className="text-xl font-bold">
                                {
                                  portfolio.alertCount
                                }
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Score qualité
                              </span>

                              <span className="font-medium">
                                {
                                  portfolio.averageScore
                                }
                                %
                              </span>
                            </div>

                            <Progress
                              value={
                                portfolio.averageScore
                              }
                              className="h-2"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {portfolio.category}
                            </Badge>

                            {portfolio.backup_name && (
                              <Badge variant="outline">
                                Backup :{' '}
                                {
                                  portfolio.backup_name
                                }
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {unassignedSuppliers.length >
            0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>
                  Fournisseurs non affectés
                </CardTitle>

                <CardDescription>
                  Fournisseurs validés sans
                  association active dans
                  portfolio_assignments.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Badge variant="outline">
                  {unassignedSuppliers.length}{' '}
                  fournisseur
                  {unassignedSuppliers.length >
                  1
                    ? 's'
                    : ''}{' '}
                  non affecté
                  {unassignedSuppliers.length >
                  1
                    ? 's'
                    : ''}
                </Badge>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================
            FOURNISSEURS
            ============================================================ */}

        <TabsContent
          value="suppliers"
          className="mt-4 space-y-4"
        >
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Rechercher un fournisseur, portefeuille ou responsable..."
                value={
                  suppliersTable.searchQuery
                }
                onChange={(event) =>
                  suppliersTable.setSearchQuery(
                    event.target.value,
                  )
                }
                className="pl-8"
              />
            </div>

            <Select
              value={selectedPortfolio}
              onValueChange={
                setSelectedPortfolio
              }
            >
              <SelectTrigger className="w-full md:w-[230px]">
                <SelectValue placeholder="Portefeuille" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les portefeuilles
                </SelectItem>

                {portfolios.map(
                  (portfolio) => (
                    <SelectItem
                      key={portfolio.id}
                      value={portfolio.id}
                    >
                      {portfolio.category}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={
                setSelectedCategory
              }
            >
              <SelectTrigger className="w-full md:w-[190px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes catégories
                </SelectItem>

                {categories.map(
                  (category) => (
                    <SelectItem
                      key={category}
                      value={category}
                    >
                      {category}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      column="name"
                      currentSort={
                        suppliersTable.sortColumn as string
                      }
                      direction={
                        suppliersTable.sortDirection
                      }
                      onSort={(column) =>
                        suppliersTable.toggleSort(
                          column as any,
                        )
                      }
                    >
                      Fournisseur
                    </SortableTableHead>

                    <TableHead>
                      Portefeuille
                    </TableHead>

                    <TableHead>
                      Catégorie
                    </TableHead>

                    <SortableTableHead
                      column="score"
                      currentSort={
                        suppliersTable.sortColumn as string
                      }
                      direction={
                        suppliersTable.sortDirection
                      }
                      onSort={(column) =>
                        suppliersTable.toggleSort(
                          column as any,
                        )
                      }
                    >
                      Score
                    </SortableTableHead>

                    <TableHead>
                      Responsable
                    </TableHead>

                    <TableHead>
                      Dernier audit
                    </TableHead>

                    <TableHead>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {suppliersTable.processedData.map(
                    (supplier) => (
                      <TableRow
                        key={supplier.id}
                      >
                        <TableCell className="font-medium">
                          {supplier.country}{' '}
                          {supplier.name}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              supplier.portfolioId
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {
                              supplier.portfolioName
                            }
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {
                              supplier.portfolioCategory
                            }
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span
                            className={
                              supplier.score >=
                              85
                                ? 'font-medium text-emerald-500'
                                : supplier.score >=
                                    70
                                  ? 'font-medium text-yellow-500'
                                  : 'font-medium text-destructive'
                            }
                          >
                            {supplier.score}%
                          </span>
                        </TableCell>

                        <TableCell>
                          {
                            supplier.assignedTo
                          }
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {
                            supplier.lastAudit
                          }
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleReassign(
                                supplier.name,
                                supplier.portfolioCategory,
                              )
                            }
                          >
                            <ArrowRightLeft className="mr-1 h-4 w-4" />
                            Réassigner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}

                  {suppliersTable
                    .processedData.length ===
                    0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Aucun fournisseur
                        correspondant aux
                        filtres.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================
            VUE RESPONSABLE
            ============================================================ */}

        <TabsContent
          value="manager"
          className="mt-4 space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Répartition de charge
              </CardTitle>

              <CardDescription>
                Charge calculée à partir des
                assignations réelles de
                portfolio_assignments.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  suppliersByResponsible,
                ).map(
                  ([
                    responsible,
                    responsibleSuppliers,
                  ]) => {
                    const maxCapacity = 10;

                    const loadPercentage =
                      Math.round(
                        (responsibleSuppliers.length /
                          maxCapacity) *
                          100,
                      );

                    const averageScore =
                      responsibleSuppliers.length >
                      0
                        ? Math.round(
                            responsibleSuppliers.reduce(
                              (
                                total,
                                supplier,
                              ) =>
                                total +
                                supplier.score,
                              0,
                            ) /
                              responsibleSuppliers.length,
                          )
                        : 0;

                    const alertCount =
                      responsibleSuppliers.reduce(
                        (
                          total,
                          supplier,
                        ) =>
                          total +
                          supplier.alerts,
                        0,
                      );

                    return (
                      <div
                        key={responsible}
                        className="space-y-3 rounded-lg border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {responsible}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {
                                responsibleSuppliers.length
                              }{' '}
                              fournisseur
                              {responsibleSuppliers.length >
                              1
                                ? 's'
                                : ''}
                            </p>
                          </div>

                          {loadPercentage >=
                            90 && (
                            <Badge variant="destructive">
                              Surcharge
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Charge
                            </p>

                            <p
                              className={`font-bold ${getLoadColor(
                                responsibleSuppliers.length,
                                maxCapacity,
                              )}`}
                            >
                              {
                                responsibleSuppliers.length
                              }
                              /{maxCapacity}
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">
                              Score moyen
                            </p>

                            <p className="font-bold">
                              {averageScore}%
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">
                              Alertes
                            </p>

                            <p
                              className={`font-bold ${
                                alertCount >
                                0
                                  ? 'text-destructive'
                                  : 'text-emerald-500'
                              }`}
                            >
                              {alertCount}
                            </p>
                          </div>
                        </div>

                        <Progress
                          value={
                            Math.min(
                              loadPercentage,
                              100,
                            )
                          }
                          className="h-2"
                        />
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>
                Règle de gestion
              </CardTitle>

              <CardDescription>
                Le responsable est issu de
                l'affectation réelle du fournisseur.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">
                  Portefeuille :
                </strong>{' '}
                défini par
                <code className="mx-1">
                  supplier_portfolios
                </code>
                .
              </p>

              <p>
                <strong className="text-foreground">
                  Affectation :
                </strong>{' '}
                définie par
                <code className="mx-1">
                  portfolio_assignments
                </code>
                .
              </p>

              <p>
                <strong className="text-foreground">
                  Fournisseur :
                </strong>{' '}
                relié au portefeuille par
                <code className="mx-1">
                  portfolio_assignments.portfolio_id
                </code>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedSupplier && (
        <AssignmentSuggestion
          open={assignmentOpen}
          onOpenChange={
            setAssignmentOpen
          }
          supplierName={
            selectedSupplier.name
          }
          supplierCategory={
            selectedSupplier.category
          }
        />
      )}
    </div>
  );
}
