import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ShipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: any;
  onSubmit: (data: any) => void;
}

export default function ShipmentForm({ open, onOpenChange, shipment, onSubmit }: ShipmentFormProps) {
  const [formData, setFormData] = useState({
    tracking_number: '',
    carrier: '',
    status: 'preparing',
    destination_address: '',
    origin_address: '',
    weight_kg: '',
    estimated_delivery: '',
    shipping_cost: '',
    notes: '',
  });

  useEffect(() => {
    if (shipment) {
      setFormData({
        tracking_number: shipment.tracking_number || '',
        carrier: shipment.carrier || '',
        status: shipment.status || 'preparing',
        destination_address: shipment.destination_address || '',
        origin_address: shipment.origin_address || '',
        weight_kg: shipment.weight_kg?.toString() || '',
        estimated_delivery: shipment.estimated_delivery?.split('T')[0] || '',
        shipping_cost: shipment.shipping_cost?.toString() || '',
        notes: shipment.notes || '',
      });
    } else {
      setFormData({ tracking_number: '', carrier: '', status: 'preparing', destination_address: '', origin_address: '', weight_kg: '', estimated_delivery: '', shipping_cost: '', notes: '' });
    }
  }, [shipment, open]);

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null,
      estimated_delivery: formData.estimated_delivery || null,
      order_id: null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{shipment ? 'Modifier l\'expédition' : 'Nouvelle expédition'}</DialogTitle>
          <DialogDescription>Renseignez les informations de l'expédition</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>N° Suivi</Label>
              <Input value={formData.tracking_number} onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Transporteur</Label>
              <Select value={formData.carrier} onValueChange={(v) => setFormData({ ...formData, carrier: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="Colissimo">Colissimo</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="Chronopost">Chronopost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Adresse de destination</Label>
            <Input value={formData.destination_address} onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Poids (kg)</Label>
              <Input type="number" step="0.1" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Coût (€)</Label>
              <Input type="number" step="0.01" value={formData.shipping_cost} onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparing">Préparation</SelectItem>
                  <SelectItem value="picked_up">Collecté</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="out_for_delivery">En livraison</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="returned">Retourné</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Livraison prévue</Label>
            <Input type="date" value={formData.estimated_delivery} onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!formData.carrier}>{shipment ? 'Modifier' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
