import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { LogIn, Eye, EyeOff, Shield, ArrowLeft, Mail } from 'lucide-react';
import { EmployeePosition } from '@/types/positions';

const positionDefaultRoute: Record<EmployeePosition, string> = {
  ceo: '/pole/direction',
  supplier_manager: '/pole/supplier',
  user_success_manager: '/pole/lifecycle',
  ops_logistics_manager: '/pole/ops',
  finance_manager: '/pole/finance',
  audit_compliance_lead: '/pole/audit',
  rse_packaging_manager: '/pole/rse',
  tech_platform_manager: '/pole/tech',
  marketing_manager: '/pole/marketing',
  rh_manager: '/pole/rh',
  risk_manager: '/pole/risk',
  rd_manager: '/pole/rd',
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: 'Erreur de connexion',
        description: error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('position')
          .eq('id', user.id)
          .single();
        const position = profile?.position as EmployeePosition | null;
        const route = position ? positionDefaultRoute[position] || '/' : '/';
        navigate(route);
      } else {
        navigate('/');
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Erreur', description: 'Veuillez saisir votre adresse email.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            <div className="bg-primary text-primary-foreground font-bold text-2xl px-3 py-1 rounded-lg">L</div>
            <span className="text-2xl font-bold text-foreground tracking-tight">inksy</span>
          </div>
          <p className="text-muted-foreground text-sm">Intranet — Espace collaborateur</p>
        </div>

        <div className="border border-border rounded-xl bg-card p-8 shadow-sm space-y-6">
          {forgotMode ? (
            <>
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Mot de passe oublié</h1>
              </div>

              {resetSent ? (
                <div className="space-y-4 text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-success/20">
                    <Mail className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-sm text-foreground">Un email de réinitialisation a été envoyé à <strong>{email}</strong></p>
                  <p className="text-xs text-muted-foreground">Vérifiez votre boîte de réception et suivez le lien.</p>
                  <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />Retour à la connexion
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground">Saisissez votre adresse email pour recevoir un lien de réinitialisation.</p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Adresse email</Label>
                    <Input id="reset-email" type="email" placeholder="prenom@linksy-group.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </Button>
                  <Button variant="ghost" className="w-full" type="button" onClick={() => setForgotMode(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />Retour
                  </Button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Connexion sécurisée</h1>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input id="email" type="email" placeholder="prenom@linksy-group.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <button type="button" className="text-xs text-accent hover:underline" onClick={() => setForgotMode(true)}>
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Connexion...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><LogIn className="h-4 w-4" />Se connecter</span>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Accès réservé aux collaborateurs LINKSY Group.
          <br />Toute connexion est journalisée.
        </p>
      </div>
    </div>
  );
};

export default Login;
