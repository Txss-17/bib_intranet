import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { openManagedDocument } from '@/lib/driveDocuments';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const TYPE_LABELS: Record<string, string> = {
  contract: 'Contrat',
  charter: 'Charte',
  policy: 'Politique interne',
  payroll: 'Paie',
  regulatory: 'Réglementaire',
  identity: "Pièce d'identité",
  diploma: 'Diplôme',
  administrative: 'Administratif',
  training: 'Formation',
  evaluation: 'Évaluation',
  other: 'Autre',
};

type Doc = {
  id: string;
  name: string;
  document_type: string;
  document_url: string | null;
  document_date: string | null;
  expires_at: string | null;
  status: string;
};

/** Documents rattachés au compte par le pôle RH (lecture seule pour le collaborateur). */
export function HrDocumentsCard() {
  const { profile } = useAuth();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['my_rh_documents', profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Doc[]> => {
      const { data, error } = await (supabase as any)
        .from('rh_employee_documents')
        .select('id,name,document_type,document_url,document_date,expires_at,status')
        .eq('employee_id', profile!.id)
        .order('document_type');
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="enterprise-card p-6">
      <h3 className="text-lg font-medium text-foreground mb-1 flex items-center gap-2">
        <FileText className="h-4 w-4" /> Documents RH
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Contrats, chartes et politiques rattachés à votre compte par le pôle RH.
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : error ? (
        <p className="text-sm text-destructive">Impossible de charger vos documents.</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun document n'a encore été rattaché à votre compte par le pôle RH.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((d) => {
            const expired = d.expires_at && d.expires_at < today;
            return (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[d.document_type] ?? d.document_type}
                    {d.document_date ? ` · ${new Date(d.document_date).toLocaleDateString('fr-FR')}` : ''}
                    {d.expires_at ? ` · expire le ${new Date(d.expires_at).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {expired ? (
                    <Badge variant="destructive">Expiré</Badge>
                  ) : d.status === 'pending' ? (
                    <Badge variant="outline">En attente</Badge>
                  ) : (
                    <Badge variant="secondary">Valide</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!d.document_url}
                    onClick={() => { try { openManagedDocument(d.document_url); } catch (e) { toast.error((e as Error).message); } }}
                  >
                    Consulter
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
