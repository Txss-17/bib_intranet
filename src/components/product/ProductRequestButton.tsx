import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  PRIORITIES,
  PRODUCT_REQUEST_CATEGORIES,
  useProductRequestActions,
} from '@/hooks/useTechRequests';

interface ProductRequestButtonProps {
  /** Pôle à l'origine de la demande. */
  pole: string;

  /** Catégorie de demande par défaut. */
  category?: string;

  /** Objet pré-rempli. */
  defaultTitle?: string;

  /** Description pré-remplie. */
  defaultDescription?: string;

  /** Priorité pré-remplie. */
  defaultPriority?: string;

  /** Libellé du bouton. */
  label?: string;

  /** Titre de la fenêtre de demande. */
  dialogTitle?: string;

  /** Description de la fenêtre de demande. */
  dialogDescription?: string;

  /** Variante visuelle du bouton. */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';

  /** Taille du bouton. */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /** Classe CSS complémentaire. */
  className?: string;
}

export function ProductRequestButton({
  pole,
  category = 'evolution',
  defaultTitle = '',
  defaultDescription = '',
  defaultPriority = 'medium',
  label = 'Demander au Product & Engineering',
  dialogTitle = 'Demande au Product & Engineering',
  dialogDescription =
    "Transmettez votre besoin au pôle Product & Engineering. La demande sera évaluée, priorisée et suivie jusqu'à sa résolution ou sa clôture.",
  variant = 'outline',
  size = 'sm',
  className,
}: ProductRequestButtonProps) {
  const [open, setOpen] = useState(false);

  const { create } = useProductRequestActions();

  const [form, setForm] = useState({
    title: defaultTitle,
    description: defaultDescription,
    category,
    priority: defaultPriority,
    target_date: '',
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      title: defaultTitle,
      description: defaultDescription,
      category,
      priority: defaultPriority,
      target_date: '',
    });
  }, [
    open,
    defaultTitle,
    defaultDescription,
    category,
    defaultPriority,
  ]);

  const submit = async () => {
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description) return;

    await create.mutateAsync({
      title,
      description,
      requester_pole: pole,
      category: form.category,
      priority: form.priority,
      target_date: form.target_date || null,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-request-title">
              Objet
            </Label>

            <Input
              id="product-request-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Décrivez brièvement le besoin"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-request-description">
              Description du besoin
            </Label>

            <Textarea
              id="product-request-description"
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Décrivez le contexte, le problème rencontré ou le résultat attendu."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>

              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    category: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>

                <SelectContent>
                  {PRODUCT_REQUEST_CATEGORIES.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priorité</Label>

              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    priority: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>

                <SelectContent>
                  {PRIORITIES.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-request-date">
              Échéance souhaitée
              <span className="ml-1 text-muted-foreground">
                (optionnel)
              </span>
            </Label>

            <Input
              id="product-request-date"
              type="date"
              value={form.target_date}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  target_date: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>

          <Button
            onClick={submit}
            disabled={
              create.isPending ||
              !form.title.trim() ||
              !form.description.trim()
            }
          >
            {create.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}

            Transmettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductRequestButton;