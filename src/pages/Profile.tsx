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
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';

const profileData = {
  ...currentUser,
  phone: '+33 6 12 34 56 78',
  location: 'Paris, France',
  department: 'Direction Générale',
  position: 'CEO & Co-Founder',
  bio: 'Fondateur de Linksy Group. Passionné par la distribution durable et l\'innovation dans le commerce B2B.',
  skills: ['Leadership', 'Stratégie', 'Finance', 'Tech', 'ESG'],
  recentActivity: [
    { action: 'Validation du rapport Q4 Finance', date: '2026-03-28', pole: 'finance' },
    { action: 'Approbation de 3 nouveaux fournisseurs', date: '2026-03-27', pole: 'supplier' },
    { action: 'Revue des incidents critiques', date: '2026-03-26', pole: 'risk' },
    { action: 'Mise à jour de la roadmap Vision', date: '2026-03-25', pole: 'direction' },
    { action: 'Audit de conformité RGPD terminé', date: '2026-03-24', pole: 'compliance' },
  ],
  stats: {
    daysActive: 1168,
    decisionsThisMonth: 24,
    polesManaged: 3,
    documentsReviewed: 156,
  },
};

const poleColors: Record<string, string> = {
  finance: 'bg-pole-finance/20 text-pole-finance',
  supplier: 'bg-pole-supplier/20 text-pole-supplier',
  risk: 'bg-destructive/20 text-destructive',
  direction: 'bg-accent/20 text-accent',
  compliance: 'bg-pole-compliance/20 text-pole-compliance',
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profileData.phone);
  const [bio, setBio] = useState(profileData.bio);
  const { toast } = useToast();

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
              {profileData.firstName[0]}{profileData.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <Badge variant="outline" className="text-accent border-accent">
                <Shield className="h-3 w-3 mr-1" />
                {profileData.role === 'executive' ? 'Executive' : profileData.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{profileData.position}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profileData.email}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profileData.location}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Depuis {new Date(profileData.joinedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <Button
            variant={isEditing ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
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
                  <p className="text-sm font-medium text-foreground mt-1">{profileData.firstName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{profileData.lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{profileData.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Téléphone</Label>
                  {isEditing ? (
                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 h-8" />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{phone}</p>
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
                  />
                ) : (
                  <p className="text-sm text-foreground mt-1">{bio}</p>
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

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profileData.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className={cn('h-2 w-2 rounded-full', poleColors[activity.pole]?.split(' ')[0] || 'bg-muted')} />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px]', poleColors[activity.pole])}>
                      {activity.pole}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-2xl font-semibold text-foreground">{profileData.stats.daysActive}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Jours actifs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-2xl font-semibold text-foreground">{profileData.stats.decisionsThisMonth}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Décisions/mois</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-2xl font-semibold text-foreground">{profileData.stats.polesManaged}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Pôles gérés</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-2xl font-semibold text-foreground">{profileData.stats.documentsReviewed}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Docs traités</p>
              </div>
            </CardContent>
          </Card>

          {/* Pôles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Pôles rattachés
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profileData.poles.map(pole => (
                <Badge key={pole} variant="secondary" className="capitalize">{pole}</Badge>
              ))}
            </CardContent>
          </Card>

          {/* Compétences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compétences</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profileData.skills.map(skill => (
                <Badge key={skill} variant="outline">{skill}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
