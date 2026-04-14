import { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Building2,
  Calendar,
  Clock,
  Edit,
  Save,
  X,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { positionInfos, EmployeePosition } from '@/types/positions';
import { getPoleById } from '@/data/poles';
import { cn } from '@/lib/utils';

const poleColors: Record<string, string> = {
  finance: 'bg-pole-finance/20 text-pole-finance',
  supplier: 'bg-pole-supplier/20 text-pole-supplier',
  risk: 'bg-destructive/20 text-destructive',
  direction: 'bg-accent/20 text-accent',
  compliance: 'bg-pole-compliance/20 text-pole-compliance',
  ops: 'bg-pole-ops/20 text-pole-ops',
  tech: 'bg-pole-tech/20 text-pole-tech',
  rh: 'bg-pole-rh/20 text-pole-rh',
  audit: 'bg-pole-audit/20 text-pole-audit',
  rse: 'bg-pole-rse/20 text-pole-rse',
  marketing: 'bg-pole-marketing/20 text-pole-marketing',
  lifecycle: 'bg-pole-lifecycle/20 text-pole-lifecycle',
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const { toast } = useToast();
  const { profile } = useAuth();

  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const email = profile?.email || '';
  const position = profile?.position as EmployeePosition | null;
  const posInfo = position ? positionInfos[position] : null;
  const poles = profile?.poles || [];
  const seniority = profile?.seniority || '';

  const handleSave = () => {
    setIsEditing(false);
    toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-accent">
            <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-semibold">
              {firstName[0]}{lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">
                {firstName} {lastName}
              </h1>
              <Badge variant="outline" className="text-accent border-accent">
                <Shield className="h-3 w-3 mr-1" />
                {posInfo?.title || position || 'Collaborateur'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{posInfo?.titleFr || 'Collaborateur'}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{email}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Paris, France</span>
            </div>
          </div>
          <Button
            variant={isEditing ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <><X className="h-4 w-4 mr-1" />Annuler</> : <><Edit className="h-4 w-4 mr-1" />Modifier</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Prénom</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{firstName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Téléphone</Label>
                  {isEditing ? (
                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 h-8" placeholder="+33 6 XX XX XX XX" />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{phone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Bio</Label>
                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Décrivez votre rôle..."
                  />
                ) : (
                  <p className="text-sm text-foreground mt-1">{bio || 'Aucune bio renseignée.'}</p>
                )}
              </div>
              {isEditing && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />Enregistrer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rôle & Module */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Rôle & Accès
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Poste</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{posInfo?.titleFr || 'Non défini'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Module principal</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{posInfo?.module || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Description du rôle</Label>
                  <p className="text-sm text-foreground mt-1">{posInfo?.description || 'Aucune description disponible.'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Niveau hiérarchique</Label>
                  <p className="text-sm font-medium text-foreground mt-1 capitalize">{seniority || 'Non défini'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pôles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Pôles rattachés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {poles.length > 0 ? poles.map(pole => {
                const poleInfo = getPoleById(pole as any);
                return (
                  <div key={pole} className="flex items-center gap-2 py-1">
                    <span className={cn('h-2 w-2 rounded-full', poleInfo?.color || 'bg-muted')} />
                    <span className="text-sm font-medium capitalize">{poleInfo?.name || pole}</span>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground">Aucun pôle assigné.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Authentification</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connexions journalisées</span>
                <Badge variant="secondary">Oui</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
