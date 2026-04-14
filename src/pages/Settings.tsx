import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  Globe,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { positionInfos, EmployeePosition } from '@/types/positions';
import { useAlertSoundSetting } from '@/hooks/useAlertSoundSetting';
import { playCriticalAlertSound } from '@/lib/alertSounds';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const { soundEnabled, setSoundEnabled } = useAlertSoundSetting();
  const { profile } = useAuth();

  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const email = profile?.email || '';
  const position = profile?.position as EmployeePosition | null;
  const posInfo = position ? positionInfos[position] : null;
  const poles = profile?.poles || [];
  const seniority = profile?.seniority || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez vos préférences et paramètres de sécurité
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Préférences</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" defaultValue={firstName} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" defaultValue={lastName} disabled />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input id="email" defaultValue={email} disabled />
                <p className="text-xs text-muted-foreground">
                  Contactez l'IT pour modifier votre adresse email
                </p>
              </div>
            </div>
          </div>

          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Rôle & Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Poste</p>
                  <p className="text-xs text-muted-foreground">Votre fonction dans l'organisation</p>
                </div>
                <Badge variant="outline" className="text-accent border-accent">
                  {posInfo?.titleFr || 'Non défini'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Module principal</p>
                  <p className="text-xs text-muted-foreground">Votre espace de travail principal</p>
                </div>
                <span className="text-sm font-medium text-foreground">{posInfo?.module || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Niveau hiérarchique</p>
                  <p className="text-xs text-muted-foreground">Votre position dans la hiérarchie</p>
                </div>
                <span className="text-sm font-medium text-foreground capitalize">{seniority || 'Non défini'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Accès pôles</p>
                  <p className="text-xs text-muted-foreground">Pôles auxquels vous avez accès</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                  {poles.length > 0 ? poles.map(pole => (
                    <Badge key={pole} variant="secondary" className="capitalize text-[10px]">{pole}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">Aucun</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Préférences de notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications email</p>
                  <p className="text-xs text-muted-foreground">Recevoir les mises à jour par email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications push</p>
                  <p className="text-xs text-muted-foreground">Recevoir les notifications navigateur</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Alertes critiques</p>
                  <p className="text-xs text-muted-foreground">Toujours recevoir les alertes critiques</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Sons d'alerte</p>
                  <p className="text-xs text-muted-foreground">Jouer un son lors des alertes critiques</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => playCriticalAlertSound()} title="Tester le son">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <SecuritySettings />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Préférences d'affichage</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Langue</p>
                  <p className="text-xs text-muted-foreground">Sélectionner votre langue préférée</p>
                </div>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Français
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Fuseau horaire</p>
                  <p className="text-xs text-muted-foreground">Votre fuseau horaire local</p>
                </div>
                <span className="text-sm text-muted-foreground">Europe/Paris (UTC+1)</span>
              </div>
            </div>
          </div>

          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Aide & Support</h3>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Consulter la documentation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Contacter le support IT
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
