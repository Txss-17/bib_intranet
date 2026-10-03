import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Beaker,
  CheckCircle2,
  FlaskConical,
  Lightbulb,
  MessageSquareText,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InnovationItem = {
  id: string;
  title: string;
  description: string;
  type: "idea" | "experiment" | "friction" | "recommendation";
  status: "new" | "in_progress" | "validated" | "blocked";
  owner: string;
};

const ITEMS: InnovationItem[] = [
  {
    id: "innovation-001",
    title: "Nouveau parcours boutique vérifiée",
    description:
      "Simplifier la découverte des boutiques et renforcer les signaux de confiance.",
    type: "idea",
    status: "in_progress",
    owner: "Produit",
  },
  {
    id: "innovation-002",
    title: "BIB Circular — visibilité produit",
    description:
      "Étudier les mécanismes permettant de valoriser les produits des marchands participants.",
    type: "experiment",
    status: "validated",
    owner: "Produit & RSE",
  },
  {
    id: "innovation-003",
    title: "Friction onboarding marchand",
    description:
      "Réduire les étapes entre candidature fournisseur, validation et publication.",
    type: "friction",
    status: "new",
    owner: "Marketplace",
  },
  {
    id: "innovation-004",
    title: "Observabilité marketplace",
    description:
      "Centraliser les signaux techniques et métier utiles aux équipes produit.",
    type: "recommendation",
    status: "in_progress",
    owner: "Engineering",
  },
];

const typeLabel: Record<InnovationItem["type"], string> = {
  idea: "Idée",
  experiment: "Expérimentation",
  friction: "Friction",
  recommendation: "Recommandation",
};

const statusLabel: Record<InnovationItem["status"], string> = {
  new: "Nouveau",
  in_progress: "En cours",
  validated: "Validé",
  blocked: "Bloqué",
};

function statusClass(status: InnovationItem["status"]) {
  switch (status) {
    case "validated":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in_progress":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "blocked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function typeIcon(type: InnovationItem["type"]) {
  switch (type) {
    case "idea":
      return Lightbulb;
    case "experiment":
      return FlaskConical;
    case "friction":
      return AlertTriangle;
    case "recommendation":
      return Target;
  }
}

export default function ProductInnovation() {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return ITEMS;
    }

    return ITEMS.filter((item) =>
      `${item.title} ${item.description} ${item.owner} ${typeLabel[item.type]}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [search]);

  return (
    <div className="min-h-full bg-slate-50/60">
      <div className="space-y-6 p-6 lg:p-8">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Produit & Engineering
                </Badge>
                <Badge variant="outline">Innovation</Badge>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Innovation produit
              </h1>

              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Centraliser les idées, expérimentations, frictions et
                recommandations qui alimentent l'évolution des produits BIB.
              </p>
            </div>

            <Button className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Nouvelle initiative
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Lightbulb className="h-5 w-5" />
                <Badge variant="outline">Idées</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">8</div>
              <p className="text-sm text-muted-foreground">
                idées suivies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Beaker className="h-5 w-5" />
                <Badge variant="outline">Expériences</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">3</div>
              <p className="text-sm text-muted-foreground">
                expérimentations actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5" />
                <Badge variant="outline">Frictions</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">5</div>
              <p className="text-sm text-muted-foreground">
                points à traiter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5" />
                <Badge variant="outline">Validées</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">11</div>
              <p className="text-sm text-muted-foreground">
                initiatives validées
              </p>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="portfolio" className="space-y-4">
          <TabsList>
            <TabsTrigger value="portfolio">Portefeuille</TabsTrigger>
            <TabsTrigger value="experiments">Expérimentations</TabsTrigger>
            <TabsTrigger value="frictions">Frictions</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Initiatives produit</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vision consolidée des sujets d'innovation.
                    </p>
                  </div>

                  <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {filteredItems.map((item) => {
                  const Icon = typeIcon(item.type);

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-white p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Icon className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium">{item.title}</h3>

                              <Badge variant="outline">
                                {typeLabel[item.type]}
                              </Badge>

                              <Badge
                                variant="outline"
                                className={statusClass(item.status)}
                              >
                                {statusLabel[item.status]}
                              </Badge>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {item.owner}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          Ouvrir
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Expérimentations
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {ITEMS.filter((item) => item.type === "experiment").map(
                  (item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={statusClass(item.status)}
                        >
                          {statusLabel[item.status]}
                        </Badge>
                      </div>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" />
                  Frictions identifiées
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {ITEMS.filter((item) => item.type === "friction").map(
                  (item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}