```tsx
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ShipmentRecord } from '@/hooks/useShipments';

interface ShipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: ShipmentRecord | null;
  onSubmit: (
    data: Omit<
      ShipmentRecord,
      'id' | 'created_at' | 'updated_at'
    >,
  ) => void;
}

type FormState = {
  order_id: string;
  tracking_number: string;
  carrier: string;
  status: ShipmentRecord['status'];
  destination_address: string;
  origin_address: string;
  weight_kg: string;
  estimated_delivery: string;
  shipping_cost: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  order_id: '',
  tracking_number: '',
  carrier: '',
  status: 'preparing',
  destination_address: '',
  origin_address: '',
  weight_kg: '',
  estimated_delivery: '',
  shipping_cost: '',
  notes: '',
};

const ShipmentForm = ({
  open,
  onOpenChange,
  shipment,
  onSubmit,
}: ShipmentFormProps) => {
  const [formData, setFormData] =
    useState<FormState>(EMPTY_FORM);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSubmitError(null);

    if (shipment) {
      setFormData({
        order_id: shipment.order_id ?? '',
        tracking_number:
          shipment.tracking_number ?? '',
        carrier: shipment.carrier ?? '',
        status:
          shipment.status ?? 'preparing',
        destination_address:
          shipment.destination_address ?? '',
        origin_address:
          shipment.origin_address ?? '',
        weight_kg:
          shipment.weight_kg !== null &&
          shipment.weight_kg !== undefined
            ? String(shipment.weight_kg)
            : '',
        estimated_delivery:
          shipment.estimated_delivery
            ? shipment.estimated_delivery.split(
                'T',
              )[0]
            : '',
        shipping_cost:
          shipment.shipping_cost !== null &&
          shipment.shipping_cost !== undefined
            ? String(shipment.shipping_cost)
            : '',
        notes: shipment.notes ?? '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [shipment, open]);

  const updateField = <
    K extends keyof FormState,
  >(
    field: K,
    value: FormState[K],
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    setSubmitError(null);

    const carrier =
      formData.carrier.trim();

    const destination =
      formData.destination_address.trim();

    const origin =
      formData.origin_address.trim();

    if (!carrier) {
      setSubmitError(
        'Le transporteur est obligatoire.',
      );
      return;
    }

    if (!destination) {
      setSubmitError(
        'L’adresse de destination est obligatoire.',
      );
      return;
    }

    const weight = formData.weight_kg
      ? Number(formData.weight_kg)
      : null;

    if (
      weight !== null &&
      (!Number.isFinite(weight) ||
        weight < 0)
    ) {
      setSubmitError(
        'Le poids doit être un nombre positif.',
      );
      return;
    }

    const shippingCost =
      formData.shipping_cost
        ? Number(formData.shipping_cost)
        : null;

    if (
      shippingCost !== null &&
      (!Number.isFinite(
        shippingCost,
      ) || shippingCost < 0)
    ) {
      setSubmitError(
        'Le coût de transport doit être un nombre positif.',
      );
      return;
    }

    onSubmit({
      order_id:
        formData.order_id.trim() || null,

      tracking_number:
        formData.tracking_number.trim() ||
        null,

      carrier,

      status: formData.status,

      destination_address: destination,

      origin_address:
        origin || null,

      weight_kg: weight,

      estimated_delivery:
        formData.estimated_delivery ||
        null,

      actual_delivery:
        shipment?.actual_delivery ??
        null,

      shipping_cost: shippingCost,

      notes:
        formData.notes.trim() || null,
    });
  };

  const isEditing = Boolean(shipment);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Modifier l'expédition"
              : 'Nouvelle expédition'}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Modifier les informations opérationnelles de l'expédition."
              : "Créer un enregistrement d'expédition dans le suivi logistique BIB."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Commande */}
          <div className="grid gap-2">
            <Label htmlFor="shipment-order">
              ID commande
            </Label>

            <Input
              id="shipment-order"
              placeholder="UUID de la commande"
              value={formData.order_id}
              onChange={(event) =>
                updateField(
                  'order_id',
                  event.target.value,
                )
              }
            />

            <p className="text-xs text-muted-foreground">
              Facultatif. À renseigner lorsqu'une
              expédition est directement rattachée à
              une commande BIB.
            </p>
          </div>

          {/* Suivi / transporteur */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="shipment-tracking">
                N° de suivi
              </Label>

              <Input
                id="shipment-tracking"
                placeholder="Ex. DHL-FR-123456"
                value={
                  formData.tracking_number
                }
                onChange={(event) =>
                  updateField(
                    'tracking_number',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shipment-carrier">
                Transporteur
              </Label>

              <Input
                id="shipment-carrier"
                placeholder="Nom du transporteur"
                value={formData.carrier}
                onChange={(event) =>
                  updateField(
                    'carrier',
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {/* Origine / destination */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="shipment-origin">
                Adresse d'origine
              </Label>

              <Input
                id="shipment-origin"
                placeholder="Hub / entrepôt / point d'expédition"
                value={
                  formData.origin_address
                }
                onChange={(event) =>
                  updateField(
                    'origin_address',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shipment-destination">
                Adresse de destination
              </Label>

              <Input
                id="shipment-destination"
                placeholder="Adresse de livraison"
                value={
                  formData.destination_address
                }
                onChange={(event) =>
                  updateField(
                    'destination_address',
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {/* Données opérationnelles */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="shipment-weight">
                Poids (kg)
              </Label>

              <Input
                id="shipment-weight"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.weight_kg}
                onChange={(event) =>
                  updateField(
                    'weight_kg',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shipment-cost">
                Coût (€)
              </Label>

              <Input
                id="shipment-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={
                  formData.shipping_cost
                }
                onChange={(event) =>
                  updateField(
                    'shipping_cost',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shipment-status">
                Statut
              </Label>

              <Select
                value={formData.status}
                onValueChange={(value) =>
                  updateField(
                    'status',
                    value as ShipmentRecord['status'],
                  )
                }
              >
                <SelectTrigger id="shipment-status">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="preparing">
                    Préparation
                  </SelectItem>

                  <SelectItem value="picked_up">
                    Collecté
                  </SelectItem>

                  <SelectItem value="in_transit">
                    En transit
                  </SelectItem>

                  <SelectItem value="out_for_delivery">
                    En livraison
                  </SelectItem>

                  <SelectItem value="delivered">
                    Livré
                  </SelectItem>

                  <SelectItem value="returned">
                    Retourné
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="grid gap-2 md:max-w-xs">
            <Label htmlFor="shipment-estimated">
              Livraison prévue
            </Label>

            <Input
              id="shipment-estimated"
              type="date"
              value={
                formData.estimated_delivery
              }
              onChange={(event) =>
                updateField(
                  'estimated_delivery',
                  event.target.value,
                )
              }
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="shipment-notes">
              Notes opérationnelles
            </Label>

            <Textarea
              id="shipment-notes"
              placeholder="Informations complémentaires concernant l'expédition…"
              value={formData.notes}
              onChange={(event) =>
                updateField(
                  'notes',
                  event.target.value,
                )
              }
              rows={4}
            />
          </div>

          {submitError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Annuler
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              !formData.carrier.trim() ||
              !formData.destination_address.trim()
            }
          >
            {isEditing
              ? 'Enregistrer les modifications'
              : "Créer l'expédition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentForm;
```
