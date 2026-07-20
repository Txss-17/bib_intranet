import { useEffect, useState } from 'react';
import { Briefcase, Building2, UserCog, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { positionInfos, EmployeePosition } from '@/types/positions';

const WORK_MODES = [
  { value: 'onsite', label: 'Sur site' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'remote', label: 'Télétravail' },
];

const SUBSIDIARIES = [
  'Linksy Group',
  'Brand-in-a-Box FR',
  'Brand-in-a-Box MA',
  'Brand-in-a-Box EU',
];

export function ProfessionalTab() {
  const { profile, refreshProfile } = useAuth() as any;
  const [workMode, setWorkMode] = useState<string>(profile?.work_mode || 'onsite');
  const [subsidiary, setSubsidiary] = useState<string>(profile?.subsidiary || '');
  const [managerEmail, setManagerEmail] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const position = profile?.position as EmployeePosition | null;
  const posInfo = position ? positionInfos[position] : null;

  useEffect(() => {
    if (profile?.work_mode) setWorkMode(profile.work_mode);
    if (profile?.subsidiary) setSubsidiary(profile.subsidiary);
  }, [profile?.work_mode, profile?.subsidiary]);

  useEffect(() => {
    const loadManager = async () => {
      if (!profile?.manager_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', profile.manager_id)
        .maybeSingle();
      if (data) {
        setManagerEmail(data.email);
        setManagerName(`${data.first_name} ${data.last_name}`);
      }
    };
    loadManager();
  }, [profile?.manager_id]);

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ work_mode: workMode, subsidiary: subsidiary || null })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Enregistré', description: 'Profil professionnel mis à jour.' });
    if (typeof refreshProfile === 'function') refreshProfile();
  };

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Poste & organisation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Poste actuel</Label>
            <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/30">
              <Badge variant="outline" className="text-accent border-accent">
                {posInfo?.titleFr || 'Non défini'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Modifiable par les RH uniquement</p>
          </div>
          <div className="space-y-2">
            <Label>Module principal</Label>
            <Input value={posInfo?.module || '—'} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subsidiary" className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> Filiale
            </Label>
            <Select value={subsidiary} onValueChange={setSubsidiary}>
              <SelectTrigger id="subsidiary">
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {SUBSIDIARIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workmode" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" /> Mode de travail
            </Label>
            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger id="workmode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <UserCog className="h-4 w-4" /> Manager direct
        </h3>
        {profile?.manager_id ? (
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{managerName || '—'}</p>
              <p className="text-xs text-muted-foreground">{managerEmail}</p>
            </div>
            <Badge variant="secondary">N+1</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun manager assigné. Contactez les RH pour rattacher votre fiche.
          </p>
        )}
      </div>
    </div>
  );
}
