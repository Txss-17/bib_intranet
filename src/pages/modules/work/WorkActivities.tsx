import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkActivity } from '@/hooks/useWorkModule';
import { workEventLabel, workStatusLabel } from '@/lib/workModuleLabels';
const kinds: Record<string, string> = { tasks: 'Tâches', projects: 'Projets', processes: 'Processus', validations: 'Validations', escalations: 'Escalades' };
export default function WorkActivities() {
    const [search, setSearch] = useState('');
    const [kind, setKind] = useState('all');
    const [offset, setOffset] = useState(0);
    const query = useWorkActivity(kind, useDeferredValue(search), offset);
    return <div className="space-y-5"><h1 className="flex items-center gap-2 text-2xl font-semibold"><Activity className="h-5 w-5"/>Activités</h1><p className="text-sm text-muted-foreground">Créations, changements, décisions, commentaires et archivages dans votre périmètre.</p><div className="flex flex-wrap gap-3"><Input className="min-w-48 flex-1" aria-label="Rechercher une activité" placeholder="Rechercher…" maxLength={200} value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }}/><Select value={kind} onValueChange={value => { setKind(value); setOffset(0); }}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les activités</SelectItem>{Object.entries(kinds).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>{query.isLoading && <p role="status">Chargement…</p>}{query.isError && <p role="alert">Activités indisponibles. <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></p>}{query.data?.rows.length === 0 && <p className="text-muted-foreground">Aucune activité dans cette vue.</p>}<ul className="divide-y rounded border">{query.data?.rows.map(e => <li key={`${e.kind}-${e.id}`} className="p-4"><Link to={e.url} className="font-medium text-primary hover:underline">{e.title}</Link><p className="text-sm">{kinds[e.kind]} · {workEventLabel(e.action)}{e.before_status !== e.after_status ? ` · ${workStatusLabel(e.kind, e.before_status)} → ${workStatusLabel(e.kind, e.after_status)}` : ''}</p><p className="text-xs text-muted-foreground">{e.actor_name || 'Système'} · {new Date(e.created_at).toLocaleString('fr-FR')}</p>{e.note && <p className="mt-1 whitespace-pre-wrap text-sm">{e.note}</p>}</li>)}</ul><div className="flex justify-end gap-2"><Button variant="outline" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}><ArrowLeft className="mr-1 h-4 w-4"/>Précédent</Button><Button variant="outline" disabled={!query.data?.has_more} onClick={() => setOffset(offset + 50)}>Suivant<ArrowRight className="ml-1 h-4 w-4"/></Button></div></div>;
}
