import { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  Globe,
  HelpCircle,
  Volume2,
  CheckCircle,
  Laptop,
  FileText,
  Lock,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { usePermissionRules } from '@/hooks/usePermissionRules';
import { logSensitiveAccess } from '@/lib/sensitiveAudit';

function SensitiveProfileSection() {
  useEffect(() => {
    logSensitiveAccess({
      section: 'settings.sensitive_profile',
      action: 'view_sensitive_profile',
      allowed: true,
    });
  }, []);
  return (
    <div className="enterprise-card p-6 border-l-4 border-l-amber-500">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-500" /> Données sensibles (RH/Direction)
        </h3>
        <Badge variant="outline" className="text-amber-600 border-amber-500/40">Consultation journalisée</Badge>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm py-1 border-b border-border/40">
          <span className="text-muted-foreground">Rémunération brute annuelle</span>
          <span className="font-medium">— (à intégrer SIRH)</span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-border/40">
          <span className="text-muted-foreground">Bonus / variable</span>
          <span className="font-medium">— (à intégrer SIRH)</span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-border/40">
          <span className="text-muted-foreground">Plafond budgétaire</span>
          <span className="font-medium">— (à intégrer Finance)</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Évaluation dernière revue</span>
          <span className="font-medium">— (à intégrer SIRH)</span>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const rights = usePermissionRules();

  const handleViewAuditLog = async () => {
    await logSensitiveAccess({
      section: 'settings.audit_log',
      action: 'view_full_audit_log',
      allowed: rights.can_view_audit_log,
      reason: rights.can_view_audit_log ? 'authorized' : 'denied_by_rule',
    });
    if (!rights.can_view_audit_log) {
      toast({
        title: 'Accès restreint',
        description: 'Le journal complet est réservé aux RH et à la Direction. Votre tentative a été enregistrée.',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Accès enregistré', description: 'Consultation du journal d\'audit journalisée.' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Mot de passe mis à jour avec succès.' });
      setShowChangeForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  return (
    <>
      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Paramètres de sécurité</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Double authentification (2FA)</p>
              <p className="text-xs text-muted-foreground">Ajouter une couche de sécurité supplémentaire</p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Changer le mot de passe</p>
              <p className="text-xs text-muted-foreground">Mettre à jour vos identifiants</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowChangeForm(!showChangeForm)}>
              <Key className="h-4 w-4 mr-2" />Modifier
            </Button>
          </div>
          {showChangeForm && (
            <form onSubmit={handleChangePassword} className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                <Input id="confirmNewPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={changingPassword}>
                  {changingPassword ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowChangeForm(false)}>Annuler</Button>
              </div>
            </form>
          )}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Sessions actives</p>
              <p className="text-xs text-muted-foreground">Gérer vos connexions actives</p>
            </div>
            <Button variant="outline" size="sm">Voir les sessions</Button>
          </div>
        </div>
      </div>

      <div className="enterprise-card p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-medium text-foreground">Journal d'audit</h3>
          <Badge variant={rights.can_view_audit_log ? 'default' : 'outline'} className="gap-1">
            {rights.can_view_audit_log ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {rights.can_view_audit_log ? 'Accès complet' : 'Accès restreint'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {rights.can_view_audit_log
            ? "Vous pouvez consulter l'ensemble des journaux d'audit. Chaque consultation est elle-même enregistrée."
            : "Votre activité personnelle est journalisée. Le journal complet est réservé aux RH et à la Direction."}
        </p>
        <Button variant="outline" onClick={handleViewAuditLog}>Voir le journal complet</Button>
      </div>
    </>
  );
}

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const { soundEnabled, setSoundEnabled } = useAlertSoundSetting();
  const { profile } = useAuth();
  const rights = usePermissionRules();

  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const email = profile?.email || '';
  const position = profile?.position as EmployeePosition | null;
  const posInfo = position ? positionInfos[position] : null;
  const poles = profile?.poles || [];
  const seniority = profile?.seniority || '';

  // Log a single audit entry on Settings load summarising the visibility decisions
  useEffect(() => {
    if (!profile) return;
    logSensitiveAccess({
      section: 'settings.load',
      action: 'open_settings',
      allowed: true,
      details: {
        poles,
        seniority,
        can_view_sensitive: rights.can_view_sensitive,
        can_view_audit_log: rights.can_view_audit_log,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.email]);

  const visibilityCount =
    (rights.can_view_sensitive ? 1 : 0) +
    (rights.can_view_audit_log ? 1 : 0) +
    (rights.can_configure_permissions ? 1 : 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez vos préférences et paramètres de sécurité
          </p>
        </div>
        {/* Visibility status */}
        <div className="enterprise-card p-3 flex items-center gap-3 self-start">
          {rights.can_view_sensitive ? (
            <Eye className="h-4 w-4 text-emerald-500" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="text-xs">
            <p className="font-medium text-foreground">Visibilité</p>
            <p className="text-muted-foreground">
              {visibilityCount === 0
                ? 'Vue standard employé'
                : `${visibilityCount} droit${visibilityCount > 1 ? 's' : ''} étendu${visibilityCount > 1 ? 's' : ''} actif${visibilityCount > 1 ? 's' : ''}`}
            </p>
          </div>
          {rights.can_configure_permissions && (
            <Button asChild size="sm" variant="outline" className="ml-2">
              <Link to="/permissions"><ShieldCheck className="h-3.5 w-3.5 mr-1" />Configurer</Link>
            </Button>
          )}
        </div>
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

          {/* Équipement attribué */}
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <Laptop className="h-4 w-4" /> Équipement & outils
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Ordinateur attribué</p>
                  <p className="text-xs text-muted-foreground">Matériel professionnel</p>
                </div>
                <span className="text-sm text-muted-foreground">Non renseigné</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Licence Microsoft / Google</p>
                  <p className="text-xs text-muted-foreground">Suite bureautique</p>
                </div>
                <span className="text-sm text-muted-foreground">Non renseigné</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Carte professionnelle</p>
                  <p className="text-xs text-muted-foreground">Transport · Hébergement · Repas professionnels</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
          </div>

          {/* Documents employé */}
          <div className="enterprise-card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Mes documents
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Contrat de travail', type: 'Contrat' },
                { name: 'Charte informatique', type: 'Politique' },
                { name: 'Politique de frais', type: 'Politique' },
                { name: 'Procédures internes', type: 'Procédure' },
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.type}</p>
                  </div>
                  <Button variant="outline" size="sm">Consulter</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Sensitive section — visible only if rule allows */}
          {rights.can_view_sensitive && (
            <SensitiveProfileSection />
          )}

          {/* Note confidentialité — adapts to current rights */}
          <div className="enterprise-card p-4 border-dashed">
            <div className="flex gap-3">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" /> Informations réservées
                </p>
                <p>
                  {rights.can_view_sensitive
                    ? "Vous avez accès aux données sensibles (rémunération, évaluations, budgets détaillés) en tant que membre RH/Direction. Toute consultation est journalisée."
                    : "Les éléments salariaux (rémunération, primes, plafonds budgétaires détaillés), les évaluations de performance et les journaux d'audit complets sont accessibles uniquement à votre manager, aux RH et à la Direction."}
                </p>
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
