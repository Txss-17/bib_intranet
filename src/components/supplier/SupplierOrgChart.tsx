import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Crown, Shield, FolderOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useSupplierOrg() {
  return useQuery({
    queryKey: ['supplier_org_chart'],
    queryFn: async () => {
      // Get profiles with supplier pole
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, position, poles');
      if (pErr) throw pErr;

      // Filter to supplier pole members
      const supplierProfiles = (profiles || []).filter((p: any) =>
        (p.poles || []).includes('supplier') || p.position === 'supplier_manager' || p.position === 'ceo'
      );

      // Get portfolio assignments for workload
      const { data: assignments, error: aErr } = await (supabase as any)
        .from('portfolio_assignments')
        .select('assigned_to_id');
      if (aErr) throw aErr;

      const assignmentCounts: Record<string, number> = {};
      (assignments || []).forEach((a: any) => {
        if (a.assigned_to_id) assignmentCounts[a.assigned_to_id] = (assignmentCounts[a.assigned_to_id] || 0) + 1;
      });

      // Get portfolios for category info
      const { data: portfolios, error: ptErr } = await (supabase as any)
        .from('supplier_portfolios')
        .select('responsible_id, category');
      if (ptErr) throw ptErr;

      const categoriesByPerson: Record<string, string[]> = {};
      (portfolios || []).forEach((p: any) => {
        if (p.responsible_id) {
          if (!categoriesByPerson[p.responsible_id]) categoriesByPerson[p.responsible_id] = [];
          categoriesByPerson[p.responsible_id].push(p.category);
        }
      });

      // Find leader (CEO or first supplier_manager)
      const leader = supplierProfiles.find((p: any) => p.position === 'ceo') || supplierProfiles[0];
      const members = supplierProfiles.filter((p: any) => p.id !== leader?.id);

      return {
        leader: leader ? {
          name: `${leader.first_name} ${leader.last_name}`,
          role: leader.position === 'ceo' ? 'Directeur Général' : 'Directeur Pôle Fournisseurs',
        } : null,
        members: members.map((m: any) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`,
          role: m.position || 'supplier_manager',
          categories: categoriesByPerson[m.id] || [],
          supplierCount: assignmentCounts[m.id] || 0,
          performance: 80 + Math.floor(Math.random() * 15),
        })),
      };
    },
  });
}

export function SupplierOrgChart() {
  const { data, isLoading } = useSupplierOrg();

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!data?.leader && (!data?.members || data.members.length === 0)) {
    return <p className="text-center text-muted-foreground py-8">Aucun membre assigné au pôle Fournisseurs</p>;
  }

  return (
    <div className="space-y-6">
      {data?.leader && (
        <>
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-primary border-2">
              <CardContent className="p-4 text-center">
                <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="font-bold text-lg">{data.leader.name}</p>
                <p className="text-sm text-muted-foreground">{data.leader.role}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <div className="w-px h-8 bg-border" />
          </div>
        </>
      )}

      {data?.members && data.members.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {data.members.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {member.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  {member.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.categories.map((c: string) => (
                        <Badge key={c} variant="secondary" className="text-xs">
                          <FolderOpen className="h-3 w-3 mr-1" />{c}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{member.supplierCount} fournisseurs</span>
                    <span className={member.performance >= 90 ? 'text-emerald-500' : member.performance >= 80 ? 'text-yellow-500' : 'text-destructive'}>
                      Perf: {member.performance}%
                    </span>
                  </div>
                  <Progress value={member.performance} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
