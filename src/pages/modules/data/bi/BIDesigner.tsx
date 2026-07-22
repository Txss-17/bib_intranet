import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import RGL, { Responsive } from 'react-grid-layout';
const WidthProvider = (RGL as any).WidthProvider;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ArrowLeft, Save, Send, Eye, Monitor, Tablet, Smartphone, Trash2, Plus,
  Square, BarChart3, LineChart, PieChart, Table as TableIcon, Gauge, Map,
  Clock, Type, Image as ImageIcon, Minus, Filter, MousePointerClick,
  AlertTriangle, Target, Grid3x3,
} from 'lucide-react';
import {
  useDashboard, useDashboardWidgets, useCreateDashboard, useUpdateDashboard,
  useUpsertWidget, useDeleteWidget, usePublishDashboard, useSaveVersion,
} from '@/hooks/useBI';
import { useKpiCatalog } from '@/hooks/useDataQueries';
import { toast } from '@/hooks/use-toast';
import { poles } from '@/data/poles';

const ResponsiveGrid = WidthProvider(Responsive);

const COMPONENTS = [
  { type: 'kpi_card', label: 'KPI Card', icon: Square, w: 3, h: 3 },
  { type: 'line_chart', label: 'Courbe', icon: LineChart, w: 6, h: 4 },
  { type: 'bar_chart', label: 'Histogramme', icon: BarChart3, w: 6, h: 4 },
  { type: 'donut_chart', label: 'Donut', icon: PieChart, w: 4, h: 4 },
  { type: 'pie_chart', label: 'Camembert', icon: PieChart, w: 4, h: 4 },
  { type: 'table', label: 'Tableau', icon: TableIcon, w: 6, h: 4 },
  { type: 'gauge', label: 'Jauge', icon: Gauge, w: 3, h: 3 },
  { type: 'map', label: 'Carte', icon: Map, w: 6, h: 5 },
  { type: 'heatmap', label: 'Heatmap', icon: Grid3x3, w: 6, h: 4 },
  { type: 'timeline', label: 'Timeline', icon: Clock, w: 8, h: 3 },
  { type: 'text', label: 'Texte', icon: Type, w: 6, h: 2 },
  { type: 'image', label: 'Image', icon: ImageIcon, w: 4, h: 3 },
  { type: 'separator', label: 'Séparateur', icon: Minus, w: 12, h: 1 },
  { type: 'filter', label: 'Filtre', icon: Filter, w: 3, h: 1 },
  { type: 'button', label: 'Bouton', icon: MousePointerClick, w: 2, h: 1 },
  { type: 'alerts', label: 'Alertes', icon: AlertTriangle, w: 4, h: 3 },
  { type: 'objective', label: 'Objectif', icon: Target, w: 4, h: 3 },
  { type: 'scorecard', label: 'Scorecard', icon: Gauge, w: 4, h: 3 },
];

const DEVICE_COLS: Record<string, number> = { desktop: 12, tablet: 8, mobile: 4 };
const DEVICE_WIDTH: Record<string, string> = { desktop: '100%', tablet: '780px', mobile: '420px' };

function WidgetRenderer({ type, title }: { type: string; title: string | null }) {
  const spec = COMPONENTS.find(c => c.type === type);
  const Icon = spec?.icon ?? Square;
  return (
    <div className="h-full w-full flex flex-col p-3 select-none">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="uppercase tracking-wider">{spec?.label ?? type}</span>
      </div>
      <div className="text-sm font-medium mb-2">{title || 'Sans titre'}</div>
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded border border-dashed border-border/50">
        <div className="text-center">
          <Icon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
          <div className="text-xs text-muted-foreground">Aperçu {spec?.label}</div>
        </div>
      </div>
    </div>
  );
}

export default function BIDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const { data: dashboard } = useDashboard(!isNew ? id : undefined);
  const { data: widgets = [] } = useDashboardWidgets(!isNew ? id : undefined);
  const { data: kpis = [] } = useKpiCatalog();
  const createDash = useCreateDashboard();
  const updateDash = useUpdateDashboard();
  const upsertWidget = useUpsertWidget();
  const deleteWidget = useDeleteWidget();
  const publish = usePublishDashboard();
  const saveVersion = useSaveVersion();

  const [name, setName] = useState('Nouveau tableau de bord');
  const [description, setDescription] = useState('');
  const [poleId, setPoleId] = useState<string>('data');

  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name);
      setDescription(dashboard.description ?? '');
      setPoleId(dashboard.pole_id ?? 'data');
    }
  }, [dashboard]);

  const selected = useMemo(() => widgets.find(w => w.id === selectedWidgetId) ?? null, [widgets, selectedWidgetId]);

  const handleCreate = async () => {
    const d = await createDash.mutateAsync({ name, description, pole_id: poleId, status: 'draft' });
    if (d?.id) navigate(`/pole/data/bi/designer/${d.id}`);
  };

  const handleSave = async () => {
    if (isNew) { await handleCreate(); return; }
    if (!id) return;
    await updateDash.mutateAsync({ id, patch: { name, description, pole_id: poleId } });
    toast({ title: 'Tableau enregistré' });
  };

  const addWidget = async (type: string) => {
    if (isNew || !id) { toast({ title: 'Enregistrez d\'abord le tableau', variant: 'destructive' }); return; }
    const spec = COMPONENTS.find(c => c.type === type);
    await upsertWidget.mutateAsync({
      dashboard_id: id,
      page_id: 'p1',
      type,
      title: spec?.label ?? type,
      config: {},
      x: 0, y: 0, w: spec?.w ?? 4, h: spec?.h ?? 3,
    });
  };

  const onLayoutChange = async (layout: any[]) => {
    if (isNew || !id) return;
    for (const l of layout) {
      const w = widgets.find(x => x.id === l.i);
      if (!w) continue;
      if (w.x !== l.x || w.y !== l.y || w.w !== l.w || w.h !== l.h) {
        await upsertWidget.mutateAsync({ id: w.id, dashboard_id: id, x: l.x, y: l.y, w: l.w, h: l.h });
      }
    }
  };

  const updateSelected = async (patch: any) => {
    if (!selected || !id) return;
    await upsertWidget.mutateAsync({ id: selected.id, dashboard_id: id, ...patch });
  };

  const handleSubmit = async () => {
    if (!id || isNew) { toast({ title: 'Enregistrez d\'abord' }); return; }
    await saveVersion.mutateAsync({
      dashboard_id: id, version: dashboard?.version ?? 'v1.0',
      snapshot: { widgets, meta: { name, description, poleId } },
      note: 'Envoi en validation',
    });
    await publish.mutateAsync({ id, action: 'submit' });
    navigate('/pole/data/bi/dashboards');
  };

  const layouts = {
    lg: widgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h })),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top toolbar */}
      <div className="border-b bg-card px-4 py-2 flex items-center gap-3 flex-wrap">
        <Button size="sm" variant="ghost" asChild><Link to="/pole/data/bi/dashboards"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <Input value={name} onChange={e => setName(e.target.value)} className="max-w-xs h-8" />
        <Badge variant="outline">{dashboard?.status ?? 'draft'}</Badge>
        <Badge variant="outline" className="text-xs">{dashboard?.version ?? 'v1.0'}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Tabs value={device} onValueChange={(v) => setDevice(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="desktop" className="h-7 px-2"><Monitor className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="tablet" className="h-7 px-2"><Tablet className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="mobile" className="h-7 px-2"><Smartphone className="h-3.5 w-3.5" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" onClick={() => setPreview(p => !p)}><Eye className="h-3.5 w-3.5 mr-1" /> {preview ? 'Éditer' : 'Aperçu'}</Button>
          <Button size="sm" variant="outline" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> Enregistrer</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isNew}><Send className="h-3.5 w-3.5 mr-1" /> Envoyer en publication</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - components */}
        {!preview && (
          <aside className="w-64 border-r bg-card/40 overflow-y-auto p-3 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Composants</div>
              <div className="grid grid-cols-2 gap-2">
                {COMPONENTS.map(c => {
                  const Icon = c.icon;
                  return (
                    <button key={c.type} onClick={() => addWidget(c.type)} className="border rounded-md p-2 text-left hover:bg-accent transition text-xs flex flex-col gap-1 items-start">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Sources de données</div>
              <div className="space-y-1 text-xs">
                <Link to="/pole/data/bi/sources" className="block px-2 py-1.5 rounded hover:bg-accent">📊 Catalogue KPI</Link>
                <Link to="/pole/data/bi/sources" className="block px-2 py-1.5 rounded hover:bg-accent">🗃️ Vues SQL</Link>
                <Link to="/pole/data/bi/sources" className="block px-2 py-1.5 rounded hover:bg-accent">🔌 API</Link>
                <Link to="/pole/data/bi/sources" className="block px-2 py-1.5 rounded hover:bg-accent">📦 Datasets</Link>
                <Link to="/pole/data/bi/sources" className="block px-2 py-1.5 rounded hover:bg-accent">ƒx Calcul personnalisé</Link>
              </div>
            </div>
          </aside>
        )}

        {/* Center canvas */}
        <main className="flex-1 overflow-auto bg-muted/20 p-6">
          {isNew ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Créer un tableau de bord</h2>
                <div><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
                <div><Label>Pôle</Label>
                  <Select value={poleId} onValueChange={setPoleId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{poles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createDash.isPending}>Créer et ouvrir le Designer</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mx-auto transition-all" style={{ maxWidth: DEVICE_WIDTH[device] }}>
              {widgets.length === 0 ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">
                  Canevas vide. Ajoutez des composants depuis la bibliothèque à gauche.
                </CardContent></Card>
              ) : (
                <ResponsiveGrid
                  className="layout"
                  layouts={layouts as any}
                  breakpoints={{ lg: 0 }}
                  cols={{ lg: DEVICE_COLS[device] }}
                  rowHeight={60}
                  isDraggable={!preview}
                  isResizable={!preview}
                  onLayoutChange={onLayoutChange}
                >
                  {widgets.map(w => (
                    <div key={w.id} onClick={() => setSelectedWidgetId(w.id)} className={`rounded-lg border bg-card shadow-sm ${selectedWidgetId === w.id ? 'ring-2 ring-primary' : ''}`}>
                      <WidgetRenderer type={w.type} title={w.title} />
                    </div>
                  ))}
                </ResponsiveGrid>
              )}
            </div>
          )}
        </main>

        {/* Right - properties */}
        {!preview && selected && (
          <aside className="w-72 border-l bg-card/40 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Propriétés</div>
              <Button size="icon" variant="ghost" onClick={() => deleteWidget.mutate({ id: selected.id, dashboard_id: id! })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div><Label>Type</Label><Badge variant="outline" className="mt-1">{selected.type}</Badge></div>
            <div><Label>Titre</Label><Input value={selected.title ?? ''} onChange={e => updateSelected({ title: e.target.value })} /></div>
            <div><Label>KPI source</Label>
              <Select value={selected.kpi_id ?? ''} onValueChange={(v) => updateSelected({ kpi_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  {kpis.map(k => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Largeur</Label><Input type="number" value={selected.w} onChange={e => updateSelected({ w: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Hauteur</Label><Input type="number" value={selected.h} onChange={e => updateSelected({ h: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Couleur</Label>
              <Select value={selected.config?.color ?? 'primary'} onValueChange={(v) => updateSelected({ config: { ...selected.config, color: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="emerald">Emerald</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="rose">Rose</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Format</Label>
              <Select value={selected.config?.format ?? 'number'} onValueChange={(v) => updateSelected({ config: { ...selected.config, format: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Nombre</SelectItem>
                  <SelectItem value="percent">Pourcentage</SelectItem>
                  <SelectItem value="currency">Devise</SelectItem>
                  <SelectItem value="duration">Durée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom stepper */}
      {!isNew && (
        <div className="border-t bg-card px-6 py-2 flex items-center gap-4 text-xs overflow-x-auto">
          {['Brouillon', 'Validation Data', 'En dev', 'Test', 'Planifié', 'Publié'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 whitespace-nowrap">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${i === 0 && dashboard?.status === 'draft' ? 'bg-primary text-primary-foreground' : i === 1 && dashboard?.status === 'validation' ? 'bg-primary text-primary-foreground' : i === 5 && dashboard?.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
              <span className="text-muted-foreground">{step}</span>
              {i < 5 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
