import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, FileText, Calendar, Eye, Edit } from 'lucide-react';

const publications = [
  { id: 1, title: 'Bienvenue aux nouveaux collaborateurs', type: 'Annonce', date: '2025-02-02', author: 'RH', views: 145, status: 'published' },
  { id: 2, title: 'Nouveaux avantages sociaux 2025', type: 'Information', date: '2025-01-28', author: 'Direction', views: 312, status: 'published' },
  { id: 3, title: 'Planning des formations Q1', type: 'Planning', date: '2025-01-20', author: 'RH', views: 98, status: 'published' },
  { id: 4, title: 'Rappel: Entretiens annuels', type: 'Rappel', date: '2025-02-01', author: 'RH', views: 87, status: 'published' },
  { id: 5, title: 'Résultats enquête satisfaction', type: 'Rapport', date: '2025-01-15', author: 'RH', views: 203, status: 'published' },
];

export default function Publications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const filteredPublications = publications.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Annonce': return <Badge className="bg-blue-500/10 text-blue-500">{type}</Badge>;
      case 'Information': return <Badge className="bg-green-500/10 text-green-500">{type}</Badge>;
      case 'Rappel': return <Badge className="bg-yellow-500/10 text-yellow-500">{type}</Badge>;
      case 'Rapport': return <Badge className="bg-purple-500/10 text-purple-500">{type}</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publications internes</h1>
          <p className="text-muted-foreground">Actualités et communications RH</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle publication
        </Button>
      </div>

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une publication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input placeholder="Titre de la publication" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Contenu</label>
              <Textarea placeholder="Rédigez votre publication..." className="mt-1" rows={5} />
            </div>
            <div className="flex gap-2">
              <Button>Publier</Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publications.length}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.reduce((sum, p) => sum + p.views, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Lectures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(publications.reduce((sum, p) => sum + p.views, 0) / publications.length)}
            </div>
            <p className="text-xs text-muted-foreground">Par publication</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPublications.map((pub) => (
          <Card key={pub.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(pub.type)}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(pub.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{pub.title}</h3>
                  <p className="text-sm text-muted-foreground">Par {pub.author}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{pub.views} vues</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
