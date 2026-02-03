import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, FileText, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const esgScores = [
  { category: 'Environnement', score: 75, trend: +5, details: 'Réduction CO₂, recyclage, énergie verte' },
  { category: 'Social', score: 82, trend: +3, details: 'Conditions de travail, diversité, formation' },
  { category: 'Gouvernance', score: 68, trend: +8, details: 'Éthique, transparence, conformité' },
];

const reports = [
  { id: 'ESG-2024-Q1', name: 'Rapport ESG Q1 2024', type: 'Trimestriel', date: '2024-04-15', status: 'published', score: 75 },
  { id: 'ESG-2023-AN', name: 'Rapport ESG Annuel 2023', type: 'Annuel', date: '2024-02-28', status: 'published', score: 72 },
  { id: 'ESG-2023-Q4', name: 'Rapport ESG Q4 2023', type: 'Trimestriel', date: '2024-01-15', status: 'published', score: 71 },
  { id: 'ESG-2024-Q2', name: 'Rapport ESG Q2 2024', type: 'Trimestriel', date: '2024-07-15', status: 'draft', score: null },
];

export default function ESGReports() {
  const overallScore = Math.round(esgScores.reduce((sum, s) => sum + s.score, 0) / esgScores.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports ESG</h1>
        <p className="text-muted-foreground">Environnement, Social et Gouvernance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score ESG Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallScore}/100</div>
            <p className="text-xs text-green-600 mt-1">+5 pts vs trimestre précédent</p>
          </CardContent>
        </Card>

        {esgScores.map((item) => (
          <Card key={item.category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{item.score}</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+{item.trend}</span>
              </div>
              <Progress value={item.score} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">{item.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rapports publiés</CardTitle>
            <Button><FileText className="mr-2 h-4 w-4" /> Nouveau rapport</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono">{report.id}</TableCell>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    {report.score ? (
                      <Badge variant="default">{report.score}/100</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'published' ? 'default' : 'secondary'}>
                      {report.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
