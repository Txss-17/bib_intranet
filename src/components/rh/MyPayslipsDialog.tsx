import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Payslip = {
  id: string;
  employee_id: string;
  name: string;
  document_date: string | null;
  document_url: string | null;
  source: string;
  created_at: string;
};

// Document references must be protected by Google Workspace BIB ACLs.
// Never follow arbitrary external URLs or expose public download links here.
function permittedDriveUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null;
    if (!['drive.google.com','docs.google.com'].includes(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Read-only self-service. It is intentionally separate from Finance's salary
 * ledger and the RH administrative employee-file view. RLS is authoritative.
 */
export default function MyPayslipsDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, profile } = useAuth();
  const query = useQuery({
    queryKey: ['my-payslips', user?.id],
    enabled: open && !!user && !!profile,
    queryFn: async (): Promise<Payslip[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('rh_employee_documents')
        .select('id,employee_id,name,document_date,document_url,source,created_at')
        .eq('employee_id', user.id)
        .eq('document_type', 'payroll')
        .order('document_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Payslip[];
    },
  });

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Mes bulletins de paie</DialogTitle>
        <DialogDescription>
          Espace personnel réservé au compte connecté. Les documents demeurent
          soumis aux autorisations de Google Workspace BIB.
        </DialogDescription>
      </DialogHeader>
      {query.isLoading && <p role="status">Chargement des bulletins…</p>}
      {query.isError && <div role="alert" className="space-y-2">
        <p>Bulletins indisponibles. Vérifiez les accès et la migration 0077.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
      </div>}
      {!query.isLoading && !query.isError && (query.data?.length || 0) === 0 &&
        <p className="text-sm text-muted-foreground">Aucun bulletin de paie disponible pour votre compte.</p>}
      <ul className="space-y-2">
        {(query.data || []).map(doc => {
          const driveUrl = permittedDriveUrl(doc.document_url);
          return <li className="rounded-md border p-3 space-y-1" key={doc.id}>
            <p className="font-medium text-sm">{doc.name}</p>
            <p className="text-xs text-muted-foreground">Période : {doc.document_date
              ? new Date(doc.document_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              : 'Non renseignée'}</p>
            {driveUrl && <a href={driveUrl} target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm text-primary underline">Ouvrir dans Google Workspace BIB</a>}
            {!driveUrl && <p className="text-xs text-muted-foreground">
              Document non accessible depuis ce lien. Contacter l'administration de paie.
            </p>}
          </li>;
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Les droits de consultation du fichier doivent aussi être limités à votre
        compte dans Google Drive. Une référence de document ne vaut pas autorisation de partage.
      </p>
    </DialogContent>
  </Dialog>;
}
