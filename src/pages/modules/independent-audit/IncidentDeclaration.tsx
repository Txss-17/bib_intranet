import { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeclareIncident } from '@/hooks/useNewModules';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ProtectedScreen from '@/components/ProtectedScreen';

type IncidentPole =
  | 'direction'
  | 'finance'
  | 'ops'
  | 'supplier'
  | 'marketplace'
  | 'support'
  | 'marketing'
  | 'rh'
  | 'audit'
  | 'compliance'
  | 'rse'
  | 'product'
  | 'data'
  | 'security';

type IncidentForm = {
  title: string;
  description: string;
  category: string;
  severity: string;
  pole_id: IncidentPole | '';
};

const POLES: Array<{
  value: IncidentPole;
  label: string;
}> = [
  {
    value: 'direction',
    label: 'Direction',
  },
  {
    value: 'finance',
    label: 'Finance',
  },
  {
    value: 'ops',
    label: 'Opérations & Logistique',
  },
  {
    value: 'supplier',
    label: 'Fournisseurs & Produits',
  },
  {
    value: 'marketplace',
    label: 'Marketplace & Customer',
  },
  {
    value: 'support',
    label: 'Support & Customer Success',
  },
  {
    value: 'marketing',
    label: 'Marketing & Communication',
  },
  {
    value: 'rh',
    label: 'RH',
  },
  {
    value: 'audit',
    label: 'Qualité & Audit',
  },
  {
    value: 'compliance',
    label: 'Conformité & Juridique',
  },
  {
    value: 'rse',
    label: 'RSE & Impact',
  },
  {
    value: 'product',
    label: 'Produit & Engineering',
  },
  {
    value: 'data',
    label: 'Data & BI',
  },
  {
    value: 'security',
    label: 'Security & IT',
  },
];

const Page = () => {
  const declare = useDeclareIncident();
  const navigate = useNavigate();

  const [form, setForm] =
    useState<IncidentForm>({
      title: '',
      description: '',
      category: 'general',
      severity: 'medium',
      pole_id: '',
    });

  const updateForm = <
    K extends keyof IncidentForm,
  >(
    field: K,
    value: IncidentForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async () => {
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        severity: form.severity,
        ...(form.pole_id
          ? { pole_id: form.pole_id }
          : {}),
      };

      await declare.mutateAsync(payload);

      toast.success(
        "Incident déclaré — l'équipe Audit a été notifiée",
      );

      navigate('/modules/independent-audit');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la déclaration.';

      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          Déclarer un incident
        </h1>

        <p className="mt-1 text-muted-foreground">
          Toute déclaration est tracée et
          confidentielle vis-à-vis du pôle concerné.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Formulaire de déclaration
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-title">
              Titre *
            </Label>

            <Input
              id="incident-title"
              value={form.title}
              onChange={(event) =>
                updateForm(
                  'title',
                  event.target.value,
                )
              }
              placeholder="Décrire brièvement l'incident"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident-description">
              Description détaillée *
            </Label>

            <Textarea
              id="incident-description"
              rows={5}
              value={form.description}
              onChange={(event) =>
                updateForm(
                  'description',
                  event.target.value,
                )
              }
              placeholder="Décrire les faits, le contexte et les éléments connus."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>

              <Select
                value={form.category}
                onValueChange={(value) =>
                  updateForm(
                    'category',
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="general">
                    Général
                  </SelectItem>

                  <SelectItem value="ethics">
                    Éthique
                  </SelectItem>

                  <SelectItem value="security">
                    Sécurité
                  </SelectItem>

                  <SelectItem value="quality">
                    Qualité
                  </SelectItem>

                  <SelectItem value="financial">
                    Financier
                  </SelectItem>

                  <SelectItem value="operational">
                    Opérationnel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sévérité</Label>

              <Select
                value={form.severity}
                onValueChange={(value) =>
                  updateForm(
                    'severity',
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="low">
                    Basse
                  </SelectItem>

                  <SelectItem value="medium">
                    Moyenne
                  </SelectItem>

                  <SelectItem value="high">
                    Haute
                  </SelectItem>

                  <SelectItem value="critical">
                    Critique
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pôle concerné (optionnel)</Label>

            <Select
              value={
                form.pole_id || 'none'
              }
              onValueChange={(value) => {
                if (value === 'none') {
                  updateForm(
                    'pole_id',
                    '',
                  );
                  return;
                }

                const selectedPole =
                  POLES.find(
                    (pole) =>
                      pole.value === value,
                  );

                if (selectedPole) {
                  updateForm(
                    'pole_id',
                    selectedPole.value,
                  );
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">
                  Aucun
                </SelectItem>

                {POLES.map((pole) => (
                  <SelectItem
                    key={pole.value}
                    value={pole.value}
                  >
                    {pole.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={submit}
            disabled={
              !form.title.trim() ||
              !form.description.trim() ||
              declare.isPending
            }
          >
            <Send className="mr-2 h-4 w-4" />

            {declare.isPending
              ? 'Envoi en cours...'
              : 'Soumettre la déclaration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function IncidentDeclaration() {
  return (
    <ProtectedScreen screenId="audit.declare">
      <Page />
    </ProtectedScreen>
  );
}
