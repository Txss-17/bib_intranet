import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Server, Globe, Database, Lock } from 'lucide-react';

const flows = [
  { from: 'LINKSY Connect (public)', to: 'Backend partagé', via: 'app_origin: connect', icon: Globe, color: 'text-blue-500' },
  { from: 'LINKSY Business OS (interne)', to: 'Backend partagé', via: 'app_origin: bos', icon: Lock, color: 'text-green-500' },
  { from: 'Edge Functions', to: 'Tables Supabase', via: 'service_role + RLS', icon: Server, color: 'text-purple-500' },
  { from: 'Public site web', to: 'external_messages', via: 'API Gateway', icon: Globe, color: 'text-orange-500' },
];

export default function TechDataFlow() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Database className="h-7 w-7" /> Flux de données</h1>
        <p className="text-muted-foreground">Échanges entre la zone publique (Connect, site web) et la zone interne (BOS)</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Flux actifs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flows.map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                <f.icon className={`h-6 w-6 ${f.color}`} />
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-medium text-sm">{f.from}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{f.to}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">{f.via}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Zone publique</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Site web marketing (linksy.app)</p>
            <p>• LINKSY Connect (clients/fournisseurs externes)</p>
            <p>• API Gateway (formulaires de contact)</p>
            <p className="text-muted-foreground text-xs pt-2">Données limitées par RLS et app_origin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Zone interne</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• LINKSY Business OS (employés)</p>
            <p>• Edge Functions admin</p>
            <p>• Accès via VPN obligatoire pour data sensibles</p>
            <p className="text-muted-foreground text-xs pt-2">Auth restreinte aux app_origin = 'bos'</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
