import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, AlertTriangle, CheckCircle, Calendar, FileText, TrendingUp, Shield, Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const auditsByType = {
  initial: [
    { name: 'Audit initial — NouveauFournisseur SAS', type: 'Initial', score: null, status: 'in_progress', date: '2026-03-20' },
    { name: 'Audit initial — FreshOrganics', type: 'Initial', score: 72, status: 'completed', date: '2026-03-10' },
  ],
  continuous: [
    { name: 'Surveillance — BioCosmetics SAS', type: 'Continu', trigger: 'Score qualité < 80%', status: 'triggered', date: '2026-03-18' },
    { name: 'Surveillance — NaturaCare', type: 'Continu', trigger: 'Retard livraison x3', status: 'triggered', date: '2026-03-15' },
    { name: 'Surveillance — AromaPlantes', type: 'Continu', trigger: 'Aucune anomalie', status: 'ok', date: '2026-03-12' },
  ],
  periodic: [
    { name: 'Audit trimestriel — BioCosmetics SAS', type: 'Périodique', score: 92, status: 'completed', date: '2026-02-28' },
    { name: 'Audit semestriel — GreenBeauty', type: 'Périodique', score: null, status: 'scheduled', date: '2026-04-15' },
    { name: 'Audit annuel — OrganicWorld Ltd', type: 'Périodique', score: 45, status: 'completed', date: '2026-01-20' },
  ],
};

const recentNonConformities = [
  { title: 'Documentation incomplète', source: 'Audit FreshFarm', severity: 'minor', status: 'open' },
  { title: 'Température stockage', source: 'Audit Entrepôt', severity: 'major', status: 'open' },
  { title: 'Traçabilité manquante', source: 'Audit Ops', severity: 'major', status: 'resolved' },
  { title: 'Formation expirée', source: 'Audit RH', severity: 'minor', status: 'open' },
];

const pendingReports = [
  { title: 'Rapport audit FreshFarm', date: '2025-02-01', author: 'Paul Lefevre' },
  { title: 'Rapport audit process livraison', date: '2025-01-28', author: 'Marie Dubois' },
];

export default function AuditDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pôle Audit</h1>
          <p className="text-muted-foreground">Suivi des audits et conformité — 3 niveaux d'audit</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/pole/audit/supplier">Audits fournisseurs</Link></Button>
          <Button variant="outline" asChild><Link to="/pole/audit/ops">Audits Ops</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audits planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">12</div><p className="text-xs text-muted-foreground">Ce trimestre</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">4</div><p className="text-xs text-muted-foreground">Audits actifs</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-500">8</div><p className="text-xs text-muted-foreground">À résoudre</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">87%</div><p className="text-xs text-muted-foreground">Conformité</p></CardContent>
        </Card>
      </div>

      {/* 3-Level Audit Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Audits par type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="initial">
            <TabsList>
              <TabsTrigger value="initial" className="gap-1"><Eye className="h-3.5 w-3.5" /> Initial</TabsTrigger>
              <TabsTrigger value="continuous" className="gap-1"><RefreshCw className="h-3.5 w-3.5" /> Surveillance continue</TabsTrigger>
              <TabsTrigger value="periodic" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Périodique</TabsTrigger>
            </TabsList>

            <TabsContent value="initial" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Audits déclenchés à l'ajout d'un nouveau fournisseur — obligatoires avant validation.</p>
              <div className="space-y-3">
                {auditsByType.initial.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score !== null ? (
                        <span className={`font-bold text-sm ${a.score >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>{a.score}%</span>
                      ) : (
                        <Badge variant="default">En cours</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="continuous" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Surveillance automatique basée sur des seuils (score, incidents, retards).</p>
              <div className="space-y-3">
                {auditsByType.continuous.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">Déclencheur : {a.trigger}</p>
                    </div>
                    <Badge variant={a.status === 'triggered' ? 'destructive' : 'secondary'}>
                      {a.status === 'triggered' ? 'Alerte déclenchée' : 'OK'}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="periodic" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Audits planifiés à intervalle régulier (trimestriel, semestriel, annuel).</p>
              <div className="space-y-3">
                {auditsByType.periodic.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.score !== null ? (
                        <span className={`font-bold text-sm ${a.score >= 70 ? 'text-green-500' : a.score >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>{a.score}%</span>
                      ) : (
                        <Badge variant="secondary">Planifié</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Non-conformités récentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNonConformities.map((nc, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{nc.title}</p>
                    <p className="text-sm text-muted-foreground">{nc.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={nc.severity === 'major' ? 'destructive' : 'secondary'}>
                      {nc.severity === 'major' ? 'Majeure' : 'Mineure'}
                    </Badge>
                    {nc.status === 'resolved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Rapports en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReports.map((report, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">Par {report.author} - {new Date(report.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Badge>À valider</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
