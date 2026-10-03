import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateProductRecommendation,
  useProductReports,
  type ProductRecommendationTargetPole,
} from '@/hooks/useRD';

interface Props {
  trigger?: React.ReactNode;
  defaultDetail?: string;
  defaultCategory?: string;
  defaultPole?: ProductRecommendationTargetPole;
}

const POLE_LABELS: Record<
  ProductRecommendationTargetPole,
  string
> = {
  product: 'Produit & Engineering',
  ops: 'Opérations & Logistique',
  supplier: 'Fournisseurs & Produits',
  rse: 'RSE & Impact',
};

export default function CreateRecommendationDialog({
  trigger,
  defaultDetail = '',
  defaultCategory = '',
  defaultPole = 'product',
}: Props) {
  const [open, setOpen] = useState(false);

  const [detail, setDetail] =
    useState(defaultDetail);

  const [category, setCategory] =
    useState(defaultCategory);

  const [priority, setPriority] =
    useState<
      'low' | 'medium' | 'high' | 'critical'
    >('medium');

  const [pole, setPole] =
    useState<ProductRecommendationTargetPole>(
      defaultPole,
    );

  const [reportId, setReportId] =
    useState<string>('none');

  const { data: reports } =
    useProductReports();

  const create =
    useCreateProductRecommendation();

  const reset = () => {
    setDetail(defaultDetail);
    setCategory(defaultCategory);
    setPriority('medium');
    setPole(defaultPole);
    setReportId('none');
  };

  const submit = async () => {
    if (!detail.trim()) {
      toast.error('Détail requis');
      return;
    }

    try {
      await create.mutateAsync({
        detail: detail.trim(),
        category: category || null,
        priority,
        target_pole: pole,
        status: 'proposed',
        report_id:
          reportId === 'none'
            ? null
            : reportId,
      });

      toast.success(
        'Recommandation créée',
      );

      setOpen(false);
      reset();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de créer la recommandation';

      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (value) {
          setDetail(defaultDetail);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            variant="outline"
          >
            <Lightbulb className="mr-1 h-4 w-4" />
            Créer une recommandation
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Nouvelle recommandation Produit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Détail</Label>

            <Textarea
              rows={4}
              value={detail}
              onChange={(event) =>
                setDetail(
                  event.target.value,
                )
              }
              placeholder="Décrire la recommandation..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                Catégorie
              </Label>

              <Select
                value={
                  category || 'none'
                }
                onValueChange={(value) =>
                  setCategory(
                    value === 'none'
                      ? ''
                      : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    —
                  </SelectItem>

                  <SelectItem value="product">
                    Produit
                  </SelectItem>

                  <SelectItem value="supplier">
                    Fournisseur
                  </SelectItem>

                  <SelectItem value="ux">
                    UX
                  </SelectItem>

                  <SelectItem value="performance">
                    Performance
                  </SelectItem>

                  <SelectItem value="bug">
                    Bug
                  </SelectItem>

                  <SelectItem value="process">
                    Process
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Priorité
              </Label>

              <Select
                value={priority}
                onValueChange={(value) => {
                  if (
                    value === 'low' ||
                    value === 'medium' ||
                    value === 'high' ||
                    value === 'critical'
                  ) {
                    setPriority(value);
                  }
                }}
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

            <div>
              <Label>
                Pôle cible
              </Label>

              <Select
                value={pole}
                onValueChange={(value) => {
                  if (
                    value === 'product' ||
                    value === 'ops' ||
                    value === 'supplier' ||
                    value === 'rse'
                  ) {
                    setPole(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {(
                    Object.keys(
                      POLE_LABELS,
                    ) as ProductRecommendationTargetPole[]
                  ).map(
                    (poleId) => (
                      <SelectItem
                        key={poleId}
                        value={poleId}
                      >
                        {
                          POLE_LABELS[
                            poleId
                          ]
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Rapport associé
              </Label>

              <Select
                value={reportId}
                onValueChange={
                  setReportId
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    Aucun
                  </SelectItem>

                  {(reports ?? []).map(
                    (report) => (
                      <SelectItem
                        key={report.id}
                        value={report.id}
                      >
                        {report.title}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() =>
              setOpen(false)
            }
          >
            Annuler
          </Button>

          <Button
            onClick={submit}
            disabled={create.isPending}
          >
            {create.isPending
              ? 'Création...'
              : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}