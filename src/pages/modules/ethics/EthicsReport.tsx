import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Lock, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const categories = [
  'Harcèlement moral',
  'Harcèlement sexuel',
  'Discrimination',
  'Conflit d\'intérêts',
  'Fraude',
  'Corruption',
  'Violation de données',
  'Non-conformité',
  'Abus de pouvoir',
  'Autre',
];

const priorities = [
  { value: 'critique', label: 'Critique — Danger immédiat' },
  { value: 'haute', label: 'Haute — Risque sérieux' },
  { value: 'moyenne', label: 'Moyenne — À traiter' },
  { value: 'basse', label: 'Basse — Information' },
];

export default function EthicsReport() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [mode, setMode] = useState<'anonyme' | 'identifie'>('anonyme');
  const [form, setForm] = useState({
    category: '',
    priority: 'moyenne',
    title: '',
    description: '',
    when: '',
    where: '',
    persons: '',
    witnesses: '',
    evidence: '',
    name: '',
    email: '',
    phone: '',
    consent: false,
  });

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.consent) {
      toast({ title: 'Champs requis', description: 'Catégorie, description et consentement sont obligatoires.', variant: 'destructive' });
      return;
    }
    if (mode === 'identifie' && (!form.name || !form.email)) {
      toast({ title: 'Identité requise', description: 'Nom et email sont nécessaires en mode identifié.', variant: 'destructive' });
      return;
    }
    const ref = `ETH-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setSubmitted(ref);
    toast({ title: 'Signalement enregistré', description: `Référence : ${ref}` });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <CardTitle>Signalement transmis</CardTitle>
            <CardDescription>Votre référence : <span className="font-mono font-semibold">{submitted}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Confidentialité garantie</AlertTitle>
              <AlertDescription>
                Votre signalement est chiffré et accessible uniquement aux référents Éthique & RH habilités.
                Conservez votre référence pour suivre le traitement de votre dossier.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setSubmitted(null); setForm({ ...form, category: '', title: '', description: '' }); }}>
                Nouveau signalement
              </Button>
              <Button asChild variant="ghost">
                <Link to="/pole/rh">Retour RH</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Signalement éthique & alerte
        </h1>
        <p className="text-muted-foreground">Canal sécurisé pour signaler un comportement contraire à nos valeurs ou à la loi.</p>
      </div>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Protection du lanceur d'alerte</AlertTitle>
        <AlertDescription>
          Conformément à la loi Sapin II et à la directive européenne 2019/1937, votre signalement est protégé.
          Vous pouvez rester totalement anonyme.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Mode de signalement</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/30">
                <RadioGroupItem value="anonyme" />
                <div>
                  <p className="font-medium">Anonyme</p>
                  <p className="text-xs text-muted-foreground">Aucune information personnelle n'est enregistrée.</p>
                </div>
              </Label>
              <Label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/30">
                <RadioGroupItem value="identifie" />
                <div>
                  <p className="font-medium">Identifié</p>
                  <p className="text-xs text-muted-foreground">Permet un suivi personnalisé du dossier.</p>
                </div>
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Nature du signalement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau de gravité *</Label>
                <Select value={form.priority} onValueChange={v => update('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Titre court</Label>
              <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Résumé en une phrase" />
            </div>
            <div className="space-y-2">
              <Label>Description détaillée *</Label>
              <Textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Décrivez les faits de manière factuelle (qui, quoi, comment)…"
                rows={6}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date / période</Label>
                <Input value={form.when} onChange={e => update('when', e.target.value)} placeholder="Ex : depuis mars 2026" />
              </div>
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input value={form.where} onChange={e => update('where', e.target.value)} placeholder="Bureau, entrepôt, en ligne…" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Personnes concernées</Label>
              <Textarea value={form.persons} onChange={e => update('persons', e.target.value)} placeholder="Sans nommer si vous préférez" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Témoins éventuels</Label>
              <Input value={form.witnesses} onChange={e => update('witnesses', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Éléments de preuve disponibles</Label>
              <Textarea value={form.evidence} onChange={e => update('evidence', e.target.value)} placeholder="Documents, emails, captures… (à transmettre après contact)" rows={2} />
            </div>
          </CardContent>
        </Card>

        {mode === 'identifie' && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Vos coordonnées</CardTitle>
              <CardDescription>Strictement confidentielles, accessibles uniquement aux référents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-4">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="consent" checked={form.consent} onCheckedChange={v => update('consent', !!v)} />
              <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
                Je certifie que les informations communiquées sont sincères et de bonne foi. J'ai compris
                que les fausses déclarations peuvent engager ma responsabilité.
              </Label>
            </div>
            <Alert variant="default" className="bg-muted/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                En cas de danger immédiat (sécurité physique, santé), contactez d'abord les services d'urgence (112).
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="submit" className="gap-2">
                <Send className="h-4 w-4" /> Transmettre le signalement
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
