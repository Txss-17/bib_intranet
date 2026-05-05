import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import bibLogo from '@/assets/bib-logo.jpg';

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
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-8 space-y-5">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-primary text-primary-foreground font-bold text-lg px-3 py-1.5 rounded-lg">B.I.B</div>
            <span className="text-xl font-bold tracking-tight">Intranet</span>
          </div>

          <div className="text-center space-y-3">
            {state === 'loading' && (<><Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /><p className="text-sm">Vérification du lien…</p></>)}

            {state === 'valid' && (
              <>
                <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                <h1 className="text-lg font-semibold">Confirmer la désinscription</h1>
                <p className="text-sm text-muted-foreground">
                  En confirmant, votre adresse sera ajoutée à notre liste de suppression.
                  Vous ne recevrez plus aucun email transactionnel ou de suivi de la part de B.I.B Intranet.
                </p>
                <Button onClick={confirm} disabled={submitting} className="mt-2">
                  {submitting ? 'En cours…' : 'Confirmer la désinscription'}
                </Button>
              </>
            )}

            {state === 'done' && (
              <>
                <CheckCircle className="h-10 w-10 mx-auto text-green-600" />
                <h1 className="text-lg font-semibold">Désinscription confirmée</h1>
                <p className="text-sm text-muted-foreground">
                  Votre adresse a été ajoutée à notre liste de suppression. Aucun nouvel email ne vous sera envoyé.
                </p>
              </>
            )}

            {state === 'already' && (
              <>
                <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm">Cette adresse est déjà désinscrite.</p>
              </>
            )}

            {state === 'invalid' && (
              <>
                <XCircle className="h-10 w-10 mx-auto text-destructive" />
                <h1 className="text-lg font-semibold">Lien invalide ou expiré</h1>
                <p className="text-sm text-muted-foreground">
                  Ce lien n'est plus valide. Si vous souhaitez tout de même vous désinscrire,
                  contactez-nous à <a href="mailto:dpo@brand-in-a-box.space" className="underline">dpo@brand-in-a-box.space</a>.
                </p>
              </>
            )}
          </div>

          <div className="border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Confidentialité & RGPD</p>
            <p>
              Conformément au RGPD (Art. 15 à 21), vous disposez d'un droit d'accès, de rectification, d'effacement,
              de limitation, d'opposition et de portabilité de vos données. Brand in a Box conserve vos données 36 mois maximum,
              au sein de l'Union européenne, et ne les cède jamais à des tiers. Pour exercer vos droits :{' '}
              <a href="mailto:dpo@brand-in-a-box.space" className="underline">dpo@brand-in-a-box.space</a>.
              Réclamation possible auprès de la CNIL (www.cnil.fr).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
