import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { intranetModules, intranetRpc, resolveIntranetPage } from '@/lib/intranet';
export default function OperationsOverview({ scope }: { scope?: string }) {
 const { pathname } = useLocation(); const module = resolveIntranetPage(pathname); const key = scope || module?.scope || '';
 const { canViewPage } = usePermissions(); const { user } = useAuth();
 const summary = useQuery({ queryKey: ['intranet-overview', user?.id, key], enabled: !!user && !!key, queryFn: () => intranetRpc<{ page_id: string; total: number; pending: number; late: number }[]>('intranet_module_summary', { p_scope: key }) });
 const pages = intranetModules.filter(p => p.scope === key && !p.id.endsWith('.overview') && canViewPage(p.id));
 return <div className="space-y-5"><h1 className="text-2xl font-semibold">{module?.label || 'Pilotage du pôle'}</h1><p className="text-sm text-muted-foreground">Accédez aux registres et aux dossiers de suivi de votre équipe.</p>{summary.isError && <p role="alert">Les indicateurs de suivi sont indisponibles. <button onClick={() => void summary.refetch()}>Réessayer</button></p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pages.map(p => { const count = summary.data?.find(s => s.page_id === p.id); return <Link key={p.id} to={p.path}><Card className="h-full hover:border-primary"><CardContent className="space-y-3 p-5"><h2 className="font-semibold">{p.label}</h2>{count && <p className="text-sm text-muted-foreground">{count.total} dossiers de suivi · {count.pending} à valider · {count.late} en retard</p>}<span className="text-sm text-primary">Ouvrir →</span></CardContent></Card></Link>; })}</div></div>;
}
