import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';

const envs = [
  { name: 'Production', branch: 'main', url: 'business.linksy.app', status: 'operational', version: 'v2.4.1', uptime: '99.98%' },
  { name: 'Staging', branch: 'staging', url: 'staging.business.linksy.app', status: 'operational', version: 'v2.5.0-rc1', uptime: '99.7%' },
  { name: 'Development', branch: 'develop', url: 'dev.business.linksy.app', status: 'operational', version: 'v2.5.0-dev', uptime: '98.2%' },
];

export default function TechEnvironments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GitBranch className="h-7 w-7" /> Environnements</h1>
        <p className="text-muted-foreground">Dev / Staging / Production — versions et statuts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {envs.map((e) => (
          <Card key={e.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{e.name}</CardTitle>
                {e.status === 'operational' ? <CheckCircle2 className="h-5 w-5 text-success" /> : <AlertCircle className="h-5 w-5 text-warning" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Branche</p><p className="font-mono">{e.branch}</p></div>
              <div><p className="text-muted-foreground text-xs">URL</p><p className="font-mono text-xs">{e.url}</p></div>
              <div><p className="text-muted-foreground text-xs">Version</p><Badge variant="outline">{e.version}</Badge></div>
              <div><p className="text-muted-foreground text-xs">Uptime 30j</p><p className="font-semibold">{e.uptime}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
