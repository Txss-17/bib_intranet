import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, ShieldCheck, Filter, Lock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMessageRoutingLog } from '@/hooks/useMessageRoutingLog';
import { useUserRole } from '@/hooks/useUserRole';
import { ExportButtons } from '@/components/ExportButtons';
import { supabase } from '@/integrations/supabase/client';

const actionColor = (a: string) => {
  if (a.startsWith('outbound')) return 'bg-primary/10 text-primary';
  if (a.startsWith('reply')) return 'bg-emerald-500/10 text-emerald-600';
  if (a.includes('validated')) return 'bg-yellow-500/10 text-yellow-700';
  if (a.includes('routed')) return 'bg-blue-500/10 text-blue-600';
  if (a.includes('archived')) return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
};

const sanitizeNotes = (notes: string | null) => {
  if (!notes) return notes;
  // Mask Cc/Cci email lists for unauthorized roles
  return notes
    .replace(/Cc:\s*[^|]+/gi, 'Cc: [restreint]')
    .replace(/Cci:\s*[^|]+/gi, 'Cci: [restreint]');
};

export default function GatewayJournal() {
  const { data: entries = [], isLoading } = useMessageRoutingLog();
  const { canViewSensitive, canExportAudit, isLoading: rolesLoading } = useUserRole();
  const [period, setPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff: Record<string, number> = {
      '24h': now - 86400000,
      '7d': now - 7 * 86400000,
      '30d': now - 30 * 86400000,
    };
    return entries.filter(e => {
      if (period !== 'all' && new Date(e.created_at).getTime() < cutoff[period]) return false;
      if (actionFilter !== 'all' && !e.action.startsWith(actionFilter)) return false;
      const performer = (e as any).performer
        ? `${(e as any).performer.first_name ?? ''} ${(e as any).performer.last_name ?? ''} ${(e as any).performer.email ?? ''}`.toLowerCase()
        : '';
      if (sender && !performer.includes(sender.toLowerCase())) return false;
      if (recipient) {
        const haystack = `${(e as any).message?.sender_email ?? ''} ${e.notes ?? ''}`.toLowerCase();
        if (!haystack.includes(recipient.toLowerCase())) return false;
      }
      return true;
    });
  }, [entries, period, actionFilter, sender, recipient]);

  const exportData = filtered.map(e => {
    const performer = (e as any).performer
      ? `${(e as any).performer.first_name ?? ''} ${(e as any).performer.last_name ?? ''}`.trim() || (e as any).performer.email
      : 'Système';
    return {
      date: new Date(e.created_at).toLocaleString('fr-FR'),
      action: e.action,
      from_status: e.from_status ?? '',
      to_status: e.to_status ?? '',
      performer,
      subject: (e as any).message?.subject ?? '',
      target: (e as any).message?.sender_email ?? '',
      notes: canViewSensitive ? (e.notes ?? '') : (sanitizeNotes(e.notes) ?? ''),
    };
  });

  const handleExportTrace = async () => {
    // Log the export access (RGPD audit trail)
    try {
      const { data: u } = await supabase.auth.getUser();
      await (supabase as any).from('audit_logs').insert({
        action: 'export:gateway_journal',
        resource: 'message_routing_log',
        user_id: u.user?.id ?? null,
        user_name: u.user?.email ?? 'unknown',
        details: { count: filtered.length, period, actionFilter, sender, recipient },
      });
    } catch (e) {
      // non-blocking
    }
  };

  if (!rolesLoading && !canViewSensitive) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="enterprise-card p-12 text-center">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Accès restreint</h2>
          <p className="text-sm text-muted-foreground">
            Le journal de traçabilité est réservé aux rôles autorisés (admin, manager).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Journal de traçabilité
          </h1>
          <p className="text-muted-foreground">
            Historique complet — validation, routage, envoi, réponse. Accessible aux rôles autorisés.
          </p>
        </div>
        {canExportAudit && (
          <div onClick={handleExportTrace}>
            <ExportButtons
              filename={`gateway-journal-${new Date().toISOString().slice(0,10)}`}
              title="Journal de traçabilité Gateway"
              poleName="B.I.B Intranet"
              columns={[
                { header: 'Date', accessor: 'date' },
                { header: 'Action', accessor: 'action' },
                { header: 'De', accessor: 'from_status' },
                { header: 'Vers', accessor: 'to_status' },
                { header: 'Acteur', accessor: 'performer' },
                { header: 'Sujet', accessor: 'subject' },
                { header: 'Cible', accessor: 'target' },
                { header: 'Notes', accessor: 'notes' },
              ]}
              data={exportData}
            />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes périodes</SelectItem>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes actions</SelectItem>
              <SelectItem value="status">Validation / Statut</SelectItem>
              <SelectItem value="reply">Réponses</SelectItem>
              <SelectItem value="outbound">Envois sortants</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Expéditeur (acteur interne)" value={sender} onChange={e => setSender(e.target.value)} />
          <Input placeholder="Destinataire (email/sujet)" value={recipient} onChange={e => setRecipient(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> Événements ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement correspondant aux filtres.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(e => {
                const performer = (e as any).performer
                  ? `${(e as any).performer.first_name ?? ''} ${(e as any).performer.last_name ?? ''}`.trim() || (e as any).performer.email
                  : 'Système';
                const msg = (e as any).message;
                const displayedNotes = canViewSensitive ? e.notes : sanitizeNotes(e.notes);
                return (
                  <div key={e.id} className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={actionColor(e.action)} variant="secondary">{e.action}</Badge>
                          {e.from_status && e.to_status && (
                            <span className="text-xs text-muted-foreground">{e.from_status} → {e.to_status}</span>
                          )}
                          {!e.from_status && e.to_status && (
                            <span className="text-xs text-muted-foreground">→ {e.to_status}</span>
                          )}
                          {e.message_id && (
                            <Link to={`/modules/gateway/message/${e.message_id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Détail
                            </Link>
                          )}
                        </div>
                        {msg?.subject && (
                          <p className="text-sm font-medium mt-1.5 truncate">{msg.subject}</p>
                        )}
                        {msg?.sender_email && (
                          <p className="text-xs text-muted-foreground">{msg.sender_email}</p>
                        )}
                        {displayedNotes && <p className="text-xs text-muted-foreground mt-1.5">{displayedNotes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium">{performer}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
