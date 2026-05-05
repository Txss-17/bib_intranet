import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'valid' | 'invalid' | 'done' | 'already'>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_KEY },
    })
      .then(r => r.json())
      .then(d => {
        if (d.valid) setState('valid');
        else if (d.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ token }),
    });
    const d = await res.json();
    setSubmitting(false);
    setState(d.success ? 'done' : 'already');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-primary text-primary-foreground font-bold text-lg px-3 py-1.5 rounded-lg">B.I.B</div>
            <span className="text-xl font-bold tracking-tight">Intranet</span>
          </div>
          {state === 'loading' && (<><Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /><p>Vérification du lien…</p></>)}
          {state === 'valid' && (
            <>
              <h1 className="text-lg font-semibold">Confirmer la désinscription</h1>
              <p className="text-sm text-muted-foreground">Vous ne recevrez plus d'emails de la part de B.I.B Intranet.</p>
              <Button onClick={confirm} disabled={submitting}>{submitting ? 'En cours…' : 'Confirmer la désinscription'}</Button>
            </>
          )}
          {state === 'done' && (<><CheckCircle className="h-10 w-10 mx-auto text-green-500" /><h1 className="text-lg font-semibold">Désinscription confirmée</h1><p className="text-sm text-muted-foreground">Vous avez été retiré de notre liste.</p></>)}
          {state === 'already' && (<><CheckCircle className="h-10 w-10 mx-auto text-muted-foreground" /><p>Cette adresse est déjà désinscrite.</p></>)}
          {state === 'invalid' && (<><XCircle className="h-10 w-10 mx-auto text-destructive" /><p>Lien invalide ou expiré.</p></>)}
        </CardContent>
      </Card>
    </div>
  );
}
