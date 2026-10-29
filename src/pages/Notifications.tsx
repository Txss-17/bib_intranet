import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
export default function Notifications() {
 const { user } = useAuth(); const qc = useQueryClient(); const navigate = useNavigate(); const [unread, setUnread] = useState(false);
 const query = useQuery({ queryKey: ['notifications', user?.id, 'all', unread], queryFn: async () => { let q = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200); if (unread) q = q.eq('read', false); const { data, error } = await q; if (error) throw error; return data; }, refetchInterval: 30000 });
 const mark = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id).select('id').single(); if (error) throw error; }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); void qc.invalidateQueries({ queryKey: ['critical_notifications'] }); }, onError: () => toast.error('La notification n’a pas pu être marquée comme lue.') });
 return <div className="space-y-5"><div className="flex justify-between gap-3"><h1 className="text-2xl font-semibold">Notifications</h1><Button variant="outline" onClick={() => setUnread(!unread)}>{unread ? 'Afficher toutes' : 'Non lues'}</Button></div>{query.isLoading && <p>Chargement…</p>}{query.isError && <p role="alert">Notifications indisponibles. <button onClick={() => void query.refetch()}>Réessayer</button></p>}{query.data?.length === 0 && <p className="text-muted-foreground">Aucune notification dans cette vue.</p>}<ul className="divide-y rounded border">{query.data?.map(n => <li key={n.id} className="flex flex-wrap justify-between gap-3 p-4"><div><p className="font-medium">{n.title} {!n.read && <Badge variant="secondary">Non lue</Badge>}</p><p className="whitespace-pre-wrap text-sm">{n.message}</p><p className="text-xs text-muted-foreground">{n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : ''}</p></div><div className="flex gap-2">{!n.read && <Button variant="outline" size="sm" disabled={mark.isPending} onClick={() => mark.mutate(n.id)}>Marquer comme lue</Button>}{n.action_url?.startsWith('/') && !n.action_url.startsWith('//') && !n.action_url.includes('\\') && <Button size="sm" onClick={() => { mark.mutate(n.id); navigate(n.action_url!); }}>Ouvrir</Button>}</div></li>)}</ul></div>;
}
