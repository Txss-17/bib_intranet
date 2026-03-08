import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit, BarChart, Loader2 } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import CampaignForm from '@/components/forms/CampaignForm';
import { useCampaigns, useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';

export default function Campaigns() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(undefined);

  const { data: campaigns = [], isLoading } = useCampaigns(search || undefined);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const handleSubmit = (data: any) => {
    if (editingCampaign) {
      updateCampaign.mutate({ id: editingCampaign.id, ...data }, { onSuccess: () => toast.success('Campagne modifiée') });
    } else {
      const num = `CMP-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
      createCampaign.mutate({ campaign_number: num, spent: '0 €', ...data }, { onSuccess: () => toast.success('Campagne créée') });
    }
    setEditingCampaign(undefined);
  };

  const handleEdit = (c: any) => { setEditingCampaign({ ...c, startDate: c.start_date, endDate: c.end_date }); setFormOpen(true); };
  const handleNew = () => { setEditingCampaign(undefined); setFormOpen(true); };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Campagnes</h1><p className="text-muted-foreground">Gestion des campagnes marketing</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="campagnes-marketing" title="Liste des campagnes marketing" columns={[
            { header: 'N°', accessor: 'campaign_number' }, { header: 'Nom', accessor: 'name' },
            { header: 'Type', accessor: 'type' }, { header: 'Début', accessor: 'start_date' },
            { header: 'Fin', accessor: 'end_date' }, { header: 'Budget', accessor: 'budget' },
            { header: 'Dépensé', accessor: 'spent' }, { header: 'Statut', accessor: 'status' },
          ]} data={campaigns} />
          <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Nouvelle campagne</Button>
        </div>
      </div>
      <Card><CardHeader><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher une campagne..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Période</TableHead><TableHead>Budget</TableHead><TableHead>Dépensé</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{campaigns.map((c) => (
            <TableRow key={c.id}><TableCell className="font-mono">{c.campaign_number}</TableCell><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.type}</TableCell><TableCell className="text-sm">{c.start_date} → {c.end_date}</TableCell><TableCell>{c.budget || '-'}</TableCell><TableCell>{c.spent || '-'}</TableCell>
              <TableCell><Badge variant={c.status === 'active' ? 'default' : c.status === 'completed' ? 'secondary' : 'outline'}>{c.status === 'active' ? 'Actif' : c.status === 'completed' ? 'Terminé' : 'Planifié'}</Badge></TableCell>
              <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}{campaigns.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune campagne trouvée</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      <CampaignForm open={formOpen} onOpenChange={setFormOpen} campaign={editingCampaign} onSubmit={handleSubmit} />
    </div>
  );
}
