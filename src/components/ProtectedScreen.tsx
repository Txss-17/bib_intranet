import React from 'react';
import { usePosition } from '@/hooks/usePosition';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProtectedScreenProps {
  screenId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessDenied = () => {
  const navigate = useNavigate();
  const { positionInfo } = usePosition();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-destructive/10 p-4 rounded-full mb-6">
        <Lock className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Accès restreint</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Vous n'avez pas les permissions nécessaires pour accéder à cet écran.
        {positionInfo && (
          <span className="block mt-2">
            Votre poste : <strong>{positionInfo.titleFr}</strong>
          </span>
        )}
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Button onClick={() => navigate('/')}>
          Tableau de bord
        </Button>
      </div>
    </div>
  );
};

export const ProtectedScreen: React.FC<ProtectedScreenProps> = ({
  screenId,
  children,
  fallback
}) => {
  const { canAccessScreen, isLoading } = usePosition();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Shield className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (!canAccessScreen(screenId)) {
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  return <>{children}</>;
};

export default ProtectedScreen;
