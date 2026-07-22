import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, ArrowRight } from 'lucide-react';
import { useTemplates, useCreateDashboard } from '@/hooks/useBI';

export default function BITemplates() {
  const { data: templates = [] } = useTemplates();
  const create = useCreateDashboard();
  const navigate = useNavigate();

  const useTemplate = async (tplId: string, name: string, pole_id: string | null, preset: any) => {
    const d = await create.mutateAsync({
      name: name + ' (mon dashboard)',
      pole_id,
      template_id: tplId,
      status: 'draft',
      layout: preset?.widgets ?? [],
    });
    if (d?.id) navigate(`/pole/data/bi/designer/${d.id}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5" /> BI · Templates
        </div>
        <h1 className="text-2xl font-semibold">Modèles de tableaux de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Démarrez plus vite avec un modèle prêt à l'emploi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="text-xs text-muted-foreground">Pôle : {t.pole_id ?? '—'}</div>
              <Button className="w-full" size="sm" onClick={() => useTemplate(t.id, t.name, t.pole_id, t.preset)}>
                Utiliser ce modèle <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
