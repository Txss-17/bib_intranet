import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertTriangle, CheckCircle, Calendar, FileText, TrendingUp } from 'lucide-react';

export default function AuditDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pôle Audit</h1>
        <p className="text-muted-foreground">Suivi des audits et conformité</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audits planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Ce trimestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">4</div>
            <p className="text-xs text-muted-foreground">Audits actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">8</div>
            <p className="text-xs text-muted-foreground">À résoudre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">87%</div>
            <p className="text-xs text-muted-foreground">Conformité</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audits récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Audit fournisseur - FreshFarm', type: 'Fournisseur', score: 92, status: 'completed' },
                { name: 'Audit terrain - Entrepôt Lyon', type: 'Terrain', score: null, status: 'in_progress' },
                { name: 'Audit Ops - Process livraison', type: 'Ops', score: 78, status: 'completed' },
                { name: 'Audit fournisseur - BioMarket', type: 'Fournisseur', score: null, status: 'scheduled' },
              ].map((audit, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{audit.name}</p>
                    <Badge variant="outline" className="mt-1">{audit.type}</Badge>
                  </div>
                  <div className="text-right">
                    {audit.score !== null ? (
                      <span className={`font-bold ${audit.score >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {audit.score}%
                      </span>
                    ) : (
                      <Badge variant={audit.status === 'in_progress' ? 'default' : 'secondary'}>
                        {audit.status === 'in_progress' ? 'En cours' : 'Planifié'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Non-conformités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Documentation incomplète', source: 'Audit FreshFarm', severity: 'minor', status: 'open' },
                { title: 'Température stockage', source: 'Audit Entrepôt', severity: 'major', status: 'open' },
                { title: 'Traçabilité manquante', source: 'Audit Ops', severity: 'major', status: 'resolved' },
                { title: 'Formation expiree', source: 'Audit RH', severity: 'minor', status: 'open' },
              ].map((nc, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{nc.title}</p>
                    <p className="text-sm text-muted-foreground">{nc.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={nc.severity === 'major' ? 'destructive' : 'secondary'}>
                      {nc.severity === 'major' ? 'Majeure' : 'Mineure'}
                    </Badge>
                    {nc.status === 'resolved' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapports en attente de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'Rapport audit FreshFarm', date: '2025-02-01', author: 'Paul Lefevre' },
              { title: 'Rapport audit process livraison', date: '2025-01-28', author: 'Marie Dubois' },
            ].map((report, i) => (
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
  );
}
