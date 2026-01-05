import React from 'react';
import { 
  Target, Calendar, CheckCircle2, Clock, ArrowRight, 
  Milestone, TrendingUp, Users, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const roadmapItems = [
  {
    id: '1',
    phase: 'Q1 2026',
    title: 'Consolidation Phase 1',
    status: 'in_progress',
    progress: 65,
    objectives: [
      { name: 'Équipe 8 postes opérationnelle', completed: true },
      { name: 'Intranet V1 déployé', completed: true },
      { name: '1000+ utilisateurs actifs', completed: false },
      { name: 'Certification ISO 14001', completed: false },
    ]
  },
  {
    id: '2',
    phase: 'Q2 2026',
    title: 'Expansion Européenne',
    status: 'planned',
    progress: 0,
    objectives: [
      { name: 'Lancement Allemagne', completed: false },
      { name: 'Partenariat logistique EU', completed: false },
      { name: 'Équipe +4 postes', completed: false },
    ]
  },
  {
    id: '3',
    phase: 'Q3-Q4 2026',
    title: 'Série A',
    status: 'planned',
    progress: 0,
    objectives: [
      { name: 'Levée 5-8M€', completed: false },
      { name: '5000 utilisateurs', completed: false },
      { name: 'Breakeven opérationnel', completed: false },
    ]
  },
];

const strategicPriorities = [
  { id: '1', title: 'Acquisition utilisateurs', weight: 35, status: 'on_track' },
  { id: '2', title: 'Excellence opérationnelle', weight: 25, status: 'on_track' },
  { id: '3', title: 'Conformité RSE', weight: 20, status: 'at_risk' },
  { id: '4', title: 'Expansion produit', weight: 20, status: 'on_track' },
];

const VisionRoadmap = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500">Terminé</Badge>;
      case 'planned':
        return <Badge variant="outline">Planifié</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Vision & Roadmap
          </h1>
          <p className="text-muted-foreground mt-1">Stratégie et objectifs LINKSY 2026</p>
        </div>
      </div>

      {/* Strategic Priorities */}
      <Card>
        <CardHeader>
          <CardTitle>Priorités Stratégiques 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {strategicPriorities.map(priority => (
              <div key={priority.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{priority.title}</span>
                  <Badge variant={priority.status === 'on_track' ? 'default' : 'destructive'}>
                    {priority.status === 'on_track' ? 'On track' : 'At risk'}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{priority.weight}%</div>
                <Progress value={priority.weight} className="mt-2 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Milestone className="h-5 w-5" />
          Roadmap
        </h2>
        
        {roadmapItems.map((item, index) => (
          <Card key={item.id} className={item.status === 'in_progress' ? 'border-primary' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.status === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    {index < roadmapItems.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{item.phase}</p>
                    
                    {item.status === 'in_progress' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span className="font-medium">{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {item.objectives.map((obj, objIndex) => (
                        <div key={objIndex} className="flex items-center gap-2">
                          {obj.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={obj.completed ? 'line-through text-muted-foreground' : ''}>
                            {obj.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VisionRoadmap;
