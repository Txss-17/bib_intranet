import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && profile && profile.app_origin && profile.app_origin !== 'connect') {
      toast({
        title: 'Accès refusé',
        description: 'Ce compte n\'est pas autorisé sur LINKSY Connect.',
        variant: 'destructive',
      });
      signOut();
    }
  }, [loading, profile, signOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile && profile.app_origin && profile.app_origin !== 'connect') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
