import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Crown, Shield, FolderOpen } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  categories: string[];
  supplierCount: number;
  performance: number;
}

const orgData = {
  poleLeader: { name: 'Amira Belhaj', role: 'Directrice Pôle Fournisseurs', performance: 94 },
  teams: [
    {
      name: 'Équipe Mode',
      lead: 'Sophie Martin',
      members: [
        { name: 'Sophie Martin', role: 'Responsable Sourcing', categories: ['Mode Femme'], supplierCount: 8, performance: 92 },
        { name: 'Marc Leroy', role: 'Chargé Qualité', categories: ['Mode Homme'], supplierCount: 6, performance: 88 },
      ],
    },
    {
      name: 'Équipe Accessoires & Maison',
      lead: 'Léa Dubois',
      members: [
        { name: 'Léa Dubois', role: 'Responsable Accessoires', categories: ['Accessoires'], supplierCount: 7, performance: 85 },
        { name: 'Thomas Petit', role: 'Chargé Fournisseurs', categories: ['Maison & Déco'], supplierCount: 5, performance: 80 },
      ],
    },
    {
      name: 'Équipe Bien-être',
      lead: 'Claire Bernard',
      members: [
        { name: 'Claire Bernard', role: 'Responsable Bio/Bien-être', categories: ['Hygiène & Bien-être'], supplierCount: 5, performance: 95 },
      ],
    },
  ],
};

export function SupplierOrgChart() {
  return (
    <div className="space-y-6">
      {/* Pole leader */}
      <div className="flex justify-center">
        <Card className="w-full max-w-md border-primary border-2">
          <CardContent className="p-4 text-center">
            <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="font-bold text-lg">{orgData.poleLeader.name}</p>
            <p className="text-sm text-muted-foreground">{orgData.poleLeader.role}</p>
            <Badge variant="outline" className="mt-2 text-emerald-500">Performance: {orgData.poleLeader.performance}%</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Connector line */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Teams */}
      <div className="grid gap-4 md:grid-cols-3">
        {orgData.teams.map(team => (
          <Card key={team.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {team.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Lead: {team.lead}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.members.map(member => (
                <div key={member.name} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    {member.name === team.lead && <Shield className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.categories.map(c => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        <FolderOpen className="h-3 w-3 mr-1" />{c}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{member.supplierCount} fournisseurs</span>
                    <span className={member.performance >= 90 ? 'text-emerald-500' : member.performance >= 80 ? 'text-yellow-500' : 'text-destructive'}>
                      Perf: {member.performance}%
                    </span>
                  </div>
                  <Progress value={member.performance} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
