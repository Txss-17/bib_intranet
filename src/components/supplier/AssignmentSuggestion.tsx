import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { UserPlus, Zap, Users, Star, BarChart3, CheckCircle2 } from 'lucide-react';

interface Employee {
  name: string;
  role: string;
  supplierCount: number;
  maxCapacity: number;
  specialization: string[];
  performance: number;
  score: number;
  reason: string;
}

interface AssignmentSuggestionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  supplierCategory: string;
  onAssign?: (employeeName: string) => void;
}

const candidates: Employee[] = [
  { name: 'Claire Bernard', role: 'Responsable Bio/Bien-être', supplierCount: 5, maxCapacity: 8, specialization: ['Hygiène & Bien-être'], performance: 95, score: 94, reason: 'Spécialisation exacte + meilleure performance + capacité disponible' },
  { name: 'Sophie Martin', role: 'Responsable Sourcing', supplierCount: 8, maxCapacity: 10, specialization: ['Mode Femme', 'Mode Homme'], performance: 92, score: 82, reason: 'Haute performance mais charge élevée' },
  { name: 'Léa Dubois', role: 'Responsable Accessoires', supplierCount: 7, maxCapacity: 8, specialization: ['Accessoires', 'Hygiène'], performance: 85, score: 71, reason: 'Compétence partielle, charge quasi-maximale' },
  { name: 'Thomas Petit', role: 'Chargé Fournisseurs', supplierCount: 5, maxCapacity: 8, specialization: ['Maison & Déco'], performance: 80, score: 65, reason: 'Capacité disponible mais pas spécialisé' },
  { name: 'Marc Leroy', role: 'Chargé Qualité', supplierCount: 6, maxCapacity: 8, specialization: ['Mode Homme', 'Maison & Déco'], performance: 88, score: 60, reason: 'Bonne performance, pas de spécialisation pour cette catégorie' },
];

function computeSuggestions(category: string): Employee[] {
  return [...candidates].sort((a, b) => {
    // Score: specialization match (40%) + available capacity (30%) + performance (30%)
    const aSpecMatch = a.specialization.some(s => category.toLowerCase().includes(s.toLowerCase().split(' ')[0])) ? 40 : 0;
    const bSpecMatch = b.specialization.some(s => category.toLowerCase().includes(s.toLowerCase().split(' ')[0])) ? 40 : 0;
    const aCapacity = ((a.maxCapacity - a.supplierCount) / a.maxCapacity) * 30;
    const bCapacity = ((b.maxCapacity - b.supplierCount) / b.maxCapacity) * 30;
    const aPerf = (a.performance / 100) * 30;
    const bPerf = (b.performance / 100) * 30;
    return (bSpecMatch + bCapacity + bPerf) - (aSpecMatch + aCapacity + aPerf);
  });
}

export function AssignmentSuggestion({ open, onOpenChange, supplierName, supplierCategory, onAssign }: AssignmentSuggestionProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const suggestions = computeSuggestions(supplierCategory);
  const recommended = suggestions[0];

  const handleAssign = () => {
    const employee = selectedEmployee || recommended.name;
    toast.success('Fournisseur assigné', { description: `${supplierName} → ${employee}` });
    onAssign?.(employee);
    onOpenChange(false);
    setSelectedEmployee(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Assignation intelligente
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fournisseur: <strong>{supplierName}</strong> • Catégorie: <strong>{supplierCategory}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {suggestions.map((emp, i) => {
            const isRecommended = i === 0;
            const isSelected = selectedEmployee === emp.name || (!selectedEmployee && isRecommended);
            const loadPct = Math.round((emp.supplierCount / emp.maxCapacity) * 100);

            return (
              <div
                key={emp.name}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedEmployee(emp.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isRecommended && <Badge className="bg-yellow-500 text-white"><Zap className="h-3 w-3 mr-1" />Recommandé</Badge>}
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-sm text-muted-foreground">— {emp.role}</span>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">{emp.score}pts</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{emp.supplierCount}/{emp.maxCapacity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>Perf: {emp.performance}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span>Charge: {loadPct}%</span>
                  </div>
                </div>
                <Progress value={loadPct} className="h-1.5 mb-2" />
                <p className="text-xs text-muted-foreground">{emp.reason}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {emp.specialization.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleAssign}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider l'assignation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
