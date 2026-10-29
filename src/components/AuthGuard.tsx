import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { session, user, profile, loading, profileError, signOut, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" role="status">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de votre accès BIB Intranet…</p>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;

  // A session alone is insufficient. Missing, stale and foreign profiles never
  // render protected children, including while a failed request is retried.
  if (profileError || !profile || profile.id !== user?.id || profile.app_origin !== 'connect' || profile.hr_status !== 'active') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6" role="alert">
        <Shield className="h-10 w-10 text-destructive" />
        <h1 className="text-xl font-semibold">Accès BIB Intranet indisponible</h1>
        <p className="text-sm text-muted-foreground">{profileError || 'Ce compte ne dispose pas d’un profil BIB Intranet autorisé.'}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refreshProfile()}>Réessayer</Button>
          <Button onClick={() => void signOut().catch(() => undefined)}>Se déconnecter</Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
