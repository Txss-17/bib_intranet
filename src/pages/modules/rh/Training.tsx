import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, GraduationCap, Calendar, Users } from 'lucide-react';

const trainings = [
  { id: 1, title: 'Sécurité au travail', type: 'Obligatoire', date: '2025-02-08', duration: '4h', participants: 25, maxParticipants: 30, status: 'upcoming' },
  { id: 2, title: 'Management d\'équipe', type: 'Développement', date: '2025-02-15', duration: '2 jours', participants: 12, maxParticipants: 15, status: 'upcoming' },
  { id: 3, title: 'Formation React avancé', type: 'Technique', date: '2025-02-22', duration: '3 jours', participants: 8, maxParticipants: 10, status: 'upcoming' },
  { id: 4, title: 'RGPD & Protection des données', type: 'Obligatoire', date: '2025-01-25', duration: '2h', participants: 45, maxParticipants: 50, status: 'completed' },
  { id: 5, title: 'Excel avancé', type: 'Bureautique', date: '2025-01-20', duration: '1 jour', participants: 18, maxParticipants: 20, status: 'completed' },
];

export default function Training() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrainings = trainings.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Obligatoire': return <Badge variant="destructive">{type}</Badge>;
      case 'Technique': return <Badge className="bg-blue-500/10 text-blue-500">{type}</Badge>;
      case 'Développement': return <Badge className="bg-purple-500/10 text-purple-500">{type}</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const upcomingCount = trainings.filter(t => t.status === 'upcoming').length;
  const completedCount = trainings.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Formations</h1>
          <p className="text-muted-foreground">Catalogue et suivi des formations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle formation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Formations planifiées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétées</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Ce trimestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainings.reduce((sum, t) => sum + t.participants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total inscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget utilisé</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue des formations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Inscriptions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.title}</TableCell>
                  <TableCell>{getTypeBadge(training.type)}</TableCell>
                  <TableCell>{new Date(training.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{training.duration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{training.participants}/{training.maxParticipants}</span>
                      <Progress 
                        value={(training.participants / training.maxParticipants) * 100} 
                        className="w-16"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={training.status === 'upcoming' ? 'default' : 'secondary'}>
                      {training.status === 'upcoming' ? 'À venir' : 'Terminée'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {training.status === 'upcoming' ? 'S\'inscrire' : 'Détails'}
                    </Button>
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
