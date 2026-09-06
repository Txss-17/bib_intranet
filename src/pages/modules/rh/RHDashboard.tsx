import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Calendar, GraduationCap, Clock, TrendingUp, Shield, AlertTriangle, ArrowRight } from 'lucide-react';

export default function RHDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Pôle RH</h1>
          <p className="text-muted-foreground">Gestion des ressources humaines</p>
        </div>
        <Button asChild size="sm">
          <Link to="/pole/rh/onboarding"><UserPlus className="mr-1.5 h-4 w-4" /> Ajouter un dossier</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effectif Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+5 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Onboarding</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">8</div>
            <p className="text-xs text-muted-foreground">Nouveaux arrivants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Congés en cours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formations</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Prévues ce mois</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demandes de congés en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Marie Dupont', dates: '10-15 Fév', type: 'CP', days: 5 },
                { name: 'Jean Martin', dates: '12-14 Fév', type: 'RTT', days: 2 },
                { name: 'Sophie Bernard', dates: '20-28 Fév', type: 'CP', days: 7 },
              ].map((request, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.dates}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{request.type}</Badge>
                    <span className="text-sm font-medium">{request.days}j</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochains événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Entretien annuel - Pierre Durand', date: '5 Fév', type: 'Entretien' },
                { title: 'Formation Sécurité', date: '8 Fév', type: 'Formation' },
                { title: 'Arrivée nouveau collaborateur', date: '10 Fév', type: 'Onboarding' },
                { title: 'Team building', date: '15 Fév', type: 'Événement' },
              ].map((event, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="secondary">{event.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pointage du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Présents</span>
                <span className="font-bold text-green-500">98</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Absents</span>
                <span className="font-bold text-red-500">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Télétravail</span>
                <span className="font-bold text-blue-500">17</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicateurs RH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Turnover annuel</span>
                <span className="font-bold">8.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Satisfaction employés</span>
                <span className="font-bold text-green-500">4.2/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Temps moyen recrutement</span>
                <span className="font-bold">32 jours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Éthique & Signalements — Suivi
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Vue confidentielle réservée aux référents RH</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/pole/rh/ethics" className="gap-2">Ouvrir le module <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nouveaux</span>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-2xl font-bold mt-1">4</p>
              <p className="text-xs text-muted-foreground">À trier</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En cours</span>
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold mt-1">12</p>
              <p className="text-xs text-muted-foreground">Investigations actives</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Critiques</span>
                <Shield className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-2xl font-bold mt-1 text-destructive">2</p>
              <p className="text-xs text-muted-foreground">Priorité maximale</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clôturés (30j)</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-1">28</p>
              <p className="text-xs text-muted-foreground">Délai moyen 4.2 j</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
