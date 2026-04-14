import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Zap, Users, Star, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Candidate {
  id: string;
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

function useCandidates(category: string) {
  return useQuery({
    queryKey: ['assignment_candidates', category],
    queryFn: async () => {
      // Get profiles with supplier-related positions
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, position, poles')
        .or('position.eq.supplier_manager,position.eq.ceo');
      if (pErr) throw pErr;

      // Get assignment counts per person
      const { data: assignments, error: aErr } = await (supabase as any)
        .from('portfolio_assignments')
        .select('assigned_to_id, assigned_to_name');
      if (aErr) throw aErr;

      // Get portfolios for specialization info
      const { data: portfolios, error: ptErr } = await (supabase as any)
        .from('supplier_portfolios')
        .select('id, category, responsible_id');
      if (ptErr) throw ptErr;

      const assignmentCounts: Record<string, number> = {};
      (assignments || []).forEach((a: any) => {
        const key = a.assigned_to_id || a.assigned_to_name;
        assignmentCounts[key] = (assignmentCounts[key] || 0) + 1;
      });

      const portfoliosByPerson: Record<string, string[]> = {};
      (portfolios || []).forEach((p: any) => {
        if (p.responsible_id) {
          if (!portfoliosByPerson[p.responsible_id]) portfoliosByPerson[p.responsible_id] = [];
          portfoliosByPerson[p.responsible_id].push(p.category);
        }
      });

      const MAX_CAPACITY = 10;
      const candidates: Candidate[] = (profiles || [])
        .filter((p: any) => p.position !== 'ceo')
        .map((p: any) => {
          const name = `${p.first_name} ${p.last_name}`;
          const supplierCount = assignmentCounts[p.id] || 0;
          const specs = portfoliosByPerson[p.id] || [];
          const performance = 80 + Math.floor(Math.random() * 15); // placeholder until perf table exists

          // Score: specialization match (40%) + available capacity (30%) + performance (30%)
          const specMatch = specs.some(s => category.toLowerCase().includes(s.toLowerCase().split(' ')[0])) ? 40 : 0;
          const capacityScore = ((MAX_CAPACITY - supplierCount) / MAX_CAPACITY) * 30;
          const perfScore = (performance / 100) * 30;
          const score = Math.round(specMatch + capacityScore + perfScore);

          let reason = '';
          if (specMatch > 0 && supplierCount < MAX_CAPACITY * 0.7) reason = 'Spécialisation exacte + capacité disponible';
          else if (specMatch > 0) reason = 'Spécialisation exacte mais charge élevée';
          else if (supplierCount < MAX_CAPACITY * 0.5) reason = 'Capacité disponible mais pas spécialisé';
          else reason = 'Charge élevée, pas de spécialisation';

          return {
            id: p.id,
            name,
            role: p.position || 'supplier_manager',
            supplierCount,
            maxCapacity: MAX_CAPACITY,
            specialization: specs,
            performance,
            score,
            reason,
          };
        })
        .sort((a: Candidate, b: Candidate) => b.score - a.score);

      return candidates;
    },
    enabled: category.length > 0,
  });
}

export function AssignmentSuggestion({ open, onOpenChange, supplierName, supplierCategory, onAssign }: AssignmentSuggestionProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const { data: suggestions = [], isLoading } = useCandidates(supplierCategory);
  const recommended = suggestions[0];

  const handleAssign = () => {
    const employee = selectedEmployee || recommended?.name || '';
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucun candidat disponible</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {suggestions.map((emp, i) => {
              const isRecommended = i === 0;
              const isSelected = selectedEmployee === emp.name || (!selectedEmployee && isRecommended);
              const loadPct = Math.round((emp.supplierCount / emp.maxCapacity) * 100);

              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedEmployee(emp.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isRecommended && <Badge className="bg-yellow-500 text-white"><Zap className="h-3 w-3 mr-1" />Recommandé</Badge>}
                      <span className="font-medium">{emp.name}</span>
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
                  {emp.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {emp.specialization.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleAssign} disabled={isLoading || suggestions.length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider l'assignation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
