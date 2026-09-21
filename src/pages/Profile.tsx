import { useState } from 'react';
import {
  Briefcase,
  Building2,
  Edit,
  Mail,
  MapPin,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import {
  getPoleById,
  type PoleId,
} from '@/data/poles';

import {
  positionInfos,
  type EmployeePosition,
} from '@/types/positions';

import { cn } from '@/lib/utils';

const TARGET_POLES: readonly PoleId[] = [
  'direction',
  'finance',
  'ops',
  'supplier',
  'marketplace',
  'support',
  'marketing',
  'rh',
  'audit',
  'compliance',
  'rse',
  'product',
  'data',
  'security',
];

const isTargetPole = (value: string): value is PoleId => {
  return TARGET_POLES.includes(value as PoleId);
};

const getInitials = (
  firstName: string,
  lastName: string,
): string => {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const { toast } = useToast();
  const { profile } = useAuth();

  const firstName = profile?.first_name ?? '';
  const lastName = profile?.last_name ?? '';
  const email = profile?.email ?? '';

  const position = profile?.position as EmployeePosition | null;
  const positionInfo = position ? positionInfos[position] : null;

  const seniority = profile?.seniority ?? '';

  const assignedPoles: PoleId[] = Array.isArray(profile?.poles)
    ? profile.poles.filter(isTargetPole)
    : [];

  const handleSave = () => {
    setIsEditing(false);

    toast({
      title: 'Profil mis à jour',
      description:
        'Vos informations ont été enregistrées.',
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* ============================================================
          HEADER
          ============================================================ */}

      <div className="enterprise-card p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border-2 border-accent">
            <AvatarFallback className="bg-accent text-2xl font-semibold text-accent-foreground">
              {getInitials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {firstName} {lastName}
              </h1>

              <Badge
                variant="outline"
                className="border-accent text-accent"
              >
                <Shield className="mr-1 h-3 w-3" />

                {positionInfo?.title ||
                  position ||
                  'Collaborateur'}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {positionInfo?.titleFr || 'Collaborateur'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </span>

              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Paris, France
              </span>
            </div>
          </div>

          <Button
            variant={isEditing ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setIsEditing((value) => !value)}
          >
            {isEditing ? (
              <>
                <X className="mr-1 h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Edit className="mr-1 h-4 w-4" />
                Modifier
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ============================================================
          CONTENT
          ============================================================ */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ==========================================================
            LEFT COLUMN
            ========================================================== */}

        <div className="space-y-6 lg:col-span-2">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Informations personnelles
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Prénom
                  </Label>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {firstName}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Nom
                  </Label>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {lastName}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Email
                  </Label>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {email}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Téléphone
                  </Label>

                  {isEditing ? (
                    <Input
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      className="mt-1 h-8"
                      placeholder="+33 6 XX XX XX XX"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {phone || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">
                  Bio
                </Label>

                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(event) =>
                      setBio(event.target.value)
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Décrivez votre rôle..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground">
                    {bio || 'Aucune bio renseignée.'}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-1 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rôle & accès */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                Rôle & Accès
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Poste
                  </Label>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {positionInfo?.titleFr || 'Non défini'}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Module principal
                  </Label>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {positionInfo?.module || 'N/A'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    Description du rôle
                  </Label>

                  <p className="mt-1 text-sm text-foreground">
                    {positionInfo?.description ||
                      'Aucune description disponible.'}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Niveau hiérarchique
                  </Label>

                  <p className="mt-1 text-sm font-medium capitalize text-foreground">
                    {seniority || 'Non défini'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==========================================================
            RIGHT COLUMN
            ========================================================== */}

        <div className="space-y-6">
          {/* Pôles rattachés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Pôles rattachés
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {assignedPoles.length > 0 ? (
                assignedPoles.map((poleId) => {
                  const poleInfo = getPoleById(poleId);

                  if (!poleInfo) {
                    return null;
                  }

                  return (
                    <div
                      key={poleId}
                      className="flex items-center gap-2 py-1"
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          poleInfo.color,
                        )}
                      />

                      <span className="text-sm font-medium">
                        {poleInfo.name}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun pôle assigné.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Sécurité
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Authentification
                </span>

                <Badge variant="secondary">
                  Active
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Connexions journalisées
                </span>

                <Badge variant="secondary">
                  Oui
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
