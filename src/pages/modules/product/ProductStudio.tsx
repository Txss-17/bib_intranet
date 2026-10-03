import { useMemo, useState } from "react";
import {
  Activity,
  Boxes,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitBranch,
  Layers3,
  Play,
  Plus,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StudioProject = {
  id: string;
  name: string;
  description: string;
  environment: "production" | "staging" | "development";
  status: "active" | "review" | "paused";
  updated: string;
};

const PROJECTS: StudioProject[] = [
  {
    id: "bib-platform",
    name: "BIB Platform",
    description: "Plateforme principale BIB et services applicatifs.",
    environment: "production",
    status: "active",
    updated: "Il y a 18 min",
  },
  {
    id: "bib-marketplace",
    name: "BIB Marketplace",
    description: "Catalogue, boutiques vérifiées et parcours marketplace.",
    environment: "staging",
    status: "review",
    updated: "Il y a 1 h",
  },
  {
    id: "bib-circular",
    name: "BIB Circular",
    description: "Programme de recyclage et services associés.",
    environment: "development",
    status: "active",
    updated: "Il y a 3 h",
  },
  {
    id: "bib-intranet",
    name: "BIB Intranet",
    description: "Système interne, pôles opérationnels et gouvernance.",
    environment: "production",
    status: "active",
    updated: "Il y a 42 min",
  },
];

const environmentLabel: Record<StudioProject["environment"], string> = {
  production: "Production",
  staging: "Staging",
  development: "Développement",
};

const statusLabel: Record<StudioProject["status"], string> = {
  active: "Actif",
  review: "En revue",
  paused: "En pause",
};

function statusClass(status: StudioProject["status"]) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "review") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function ProductStudio() {
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return PROJECTS;
    }

    return PROJECTS.filter((project) =>
      `${project.name} ${project.description} ${project.environment}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [search]);

  return (
    <div className="min-h-full bg-slate-50/60">
      <div className="space-y-6 p-6 lg:p-8">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Produit & Engineering
                </Badge>
                <Badge variant="outline">Studio</Badge>
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Product Studio
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Espace de travail centralisé pour développer, tester et
                  superviser les produits et services BIB.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Terminal className="h-4 w-4" />
                Console
              </Button>

              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau projet
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Boxes className="h-5 w-5" />
                </div>
                <Badge variant="outline">Actifs</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">4</div>
              <p className="text-sm text-muted-foreground">
                projets supervisés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Rocket className="h-5 w-5" />
                </div>
                <Badge variant="outline">Déploiements</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">12</div>
              <p className="text-sm text-muted-foreground">
                sur les 7 derniers jours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Activity className="h-5 w-5" />
                </div>
                <Badge variant="outline">Services</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">18</div>
              <p className="text-sm text-muted-foreground">
                services supervisés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-100 p-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant="outline">Disponibilité</Badge>
              </div>
              <div className="mt-4 text-2xl font-semibold">99,9 %</div>
              <p className="text-sm text-muted-foreground">
                disponibilité supervisée
              </p>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projets</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Projets produit</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Applications et services actuellement suivis par
                      Produit & Engineering.
                    </p>
                  </div>

                  <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher un projet..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border bg-white p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Code2 className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{project.name}</h3>

                            <Badge
                              variant="outline"
                              className={statusClass(project.status)}
                            >
                              {statusLabel[project.status]}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {project.description}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>
                              Environnement :{" "}
                              <strong className="font-medium text-foreground">
                                {environmentLabel[project.environment]}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>Mis à jour {project.updated}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Settings2 className="h-4 w-4" />
                          Configurer
                        </Button>

                        <Button size="sm" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProjects.length === 0 && (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <p className="font-medium">Aucun projet trouvé</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Modifie les critères de recherche.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Environnements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["Production", "Stable", "4 projets"],
                    ["Staging", "Validation", "1 projet"],
                    ["Développement", "En cours", "2 projets"],
                  ].map(([name, state, count]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {state}
                        </p>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers3 className="h-5 w-5" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button variant="outline" className="justify-start gap-2">
                    <Play className="h-4 w-4" />
                    Lancer un environnement
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <GitBranch className="h-4 w-4" />
                    Consulter les branches
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <Rocket className="h-4 w-4" />
                    Préparer un déploiement
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Déploiement BIB Platform terminé",
                  "Nouvelle version du Marketplace envoyée en staging",
                  "Documentation API mise à jour",
                  "Contrôle de disponibilité exécuté",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm">{item}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {index + 1} h
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}