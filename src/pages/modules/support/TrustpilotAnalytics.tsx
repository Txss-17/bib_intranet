import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAccountReputation } from '@/hooks/useAccountReputation';

export default function TrustpilotAnalytics() {
  const query = useAccountReputation();
  if (query.isLoading) return <p className="flex h-64 items-center justify-center gap-2" role="status"><Loader2 className="h-6 w-6 animate-spin" />Chargement…</p>;
  if (query.isError) return <div role="alert" className="space-y-3 p-6"><p>Les notes des comptes ne sont pas disponibles.</p><Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></div>;
  const stats = query.data;
  if (!stats) return null;
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold"><Star className="h-7 w-7 text-primary" />Réputation des comptes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notes Trustpilot enregistrées sur les comptes de votre périmètre.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Moyenne des comptes notés</CardTitle></CardHeader>
          <CardContent>
            <p className="text-5xl font-semibold">{stats.average === null ? '—' : stats.average.toFixed(1)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{stats.rated} compte(s) noté(s) sur {stats.total} accessible(s).</p>
            <p className="mt-3 text-xs text-muted-foreground">Chaque compte noté a le même poids. Cette moyenne ne représente pas un score global d’avis individuels.</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Répartition des comptes par note arrondie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.distribution.map(item => (
              <div key={item.stars} className="flex items-center gap-4">
                <span className="flex w-14 items-center gap-1">{item.stars}<Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /></span>
                <Progress value={item.percentage} className="h-3 flex-1" aria-label={`${item.stars} étoiles : ${item.count} comptes`} />
                <span className="w-24 text-sm text-muted-foreground">{item.count} ({item.percentage} %)</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Comptes à suivre</CardTitle><p className="text-sm text-muted-foreground">Les dix notes enregistrées les plus basses dans votre périmètre.</p></CardHeader>
        <CardContent>
          {stats.followUp.length === 0 ? <p className="py-6 text-muted-foreground">Aucune note enregistrée dans votre périmètre.</p> : (
            <ul className="divide-y">
              {stats.followUp.map(account => (
                <li key={account.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-medium">{account.company_name}</span>
                  <span className="flex items-center gap-1">{account.trustpilot_rating?.toFixed(1)} / 5 <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /></span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
