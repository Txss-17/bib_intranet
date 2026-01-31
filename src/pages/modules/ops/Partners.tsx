import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Loader2, Building2, Truck, Warehouse, Star, Mail, Phone } from "lucide-react";
import { useLogisticsPartners, LogisticsPartner } from "@/hooks/useOps";
import { useState } from "react";

const typeLabels: Record<LogisticsPartner['type'], string> = {
  carrier: 'Transporteur',
  warehouse: 'Entrepôt',
  fulfillment: 'Fulfillment',
  customs: 'Douanes',
};

const typeIcons: Record<LogisticsPartner['type'], React.ReactNode> = {
  carrier: <Truck className="h-4 w-4" />,
  warehouse: <Warehouse className="h-4 w-4" />,
  fulfillment: <Building2 className="h-4 w-4" />,
  customs: <Building2 className="h-4 w-4" />,
};

const statusColors: Record<LogisticsPartner['status'], string> = {
  active: 'bg-green-500/10 text-green-500',
  inactive: 'bg-muted text-muted-foreground',
  suspended: 'bg-destructive/10 text-destructive',
};

const Partners = () => {
  const { data: partners = [], isLoading } = useLogisticsPartners();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPartners = partners.filter(partner => {
    return partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           partner.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCount = partners.filter(p => p.status === 'active').length;
  const avgScore = partners.length > 0 
    ? Math.round(partners.reduce((sum, p) => sum + (p.performance_score || 0), 0) / partners.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partenaires logistiques</h1>
          <p className="text-muted-foreground">Gestion des transporteurs et entrepôts</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Ajouter un partenaire
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-xs text-muted-foreground">Partenaires total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{partners.filter(p => p.type === 'carrier').length}</div>
            <p className="text-xs text-muted-foreground">Transporteurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold">{avgScore}%</div>
            </div>
            <p className="text-xs text-muted-foreground">Score moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des partenaires ({filteredPartners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partenaire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {typeIcons[partner.type]}
                      </div>
                      <span className="font-medium">{partner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[partner.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {partner.contact_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{partner.contact_email}</span>
                        </div>
                      )}
                      {partner.contact_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{partner.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress value={partner.performance_score || 0} className="w-20 h-2" />
                        <span className="text-sm font-medium">{partner.performance_score || 0}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[partner.status]}`}>
                      {partner.status === 'active' ? 'Actif' : 
                       partner.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Voir détails</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPartners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun partenaire trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Partners;
