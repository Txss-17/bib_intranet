import React, { useState } from 'react';
import { 
  Scale, Clock, CheckCircle2, XCircle, AlertTriangle,
  FileText, Users, DollarSign, Package, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const pendingDecisions = [
  {
    id: '1',
    title: 'Validation fournisseur BioPack Solutions',
    type: 'supplier',
    priority: 'high',
    submittedBy: 'Sophie Martin',
    submittedAt: '2026-01-04',
    description: 'Nouveau fournisseur packaging écologique. Certification ISO 14001 en cours.',
    impact: 'Réduction coûts packaging de 15%, amélioration score ESG',
    recommendation: 'Approuver sous condition certification complète Q1'
  },
  {
    id: '2',
    title: 'Investissement infrastructure Cloud',
    type: 'tech',
    priority: 'medium',
    submittedBy: 'Tech Lead',
    submittedAt: '2026-01-03',
    description: 'Migration vers infrastructure scalable. Budget: €45,000',
    impact: 'Performance +40%, coûts hosting -20% à terme',
    recommendation: 'Approuver avec échelonnement Q1-Q2'
  },
  {
    id: '3',
    title: 'Partenariat Trustpilot Premium',
    type: 'marketing',
    priority: 'low',
    submittedBy: 'User Success Manager',
    submittedAt: '2026-01-02',
    description: 'Upgrade compte Trustpilot. Budget: €800/mois',
    impact: 'Meilleure visibilité avis, outils analytics avancés',
    recommendation: 'Reporter Q2 - prioriser acquisition'
  },
];

const DecisionArbitrage = () => {
  const [selectedDecision, setSelectedDecision] = useState<typeof pendingDecisions[0] | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'supplier': return <Package className="h-5 w-5" />;
      case 'tech': return <Building2 className="h-5 w-5" />;
      case 'finance': return <DollarSign className="h-5 w-5" />;
      case 'marketing': return <Users className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-destructive">Urgent</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Moyen</Badge>;
      case 'low': return <Badge variant="outline">Bas</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            Arbitrage Décisions
          </h1>
          <p className="text-muted-foreground mt-1">Décisions en attente de validation CEO</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {pendingDecisions.length} en attente
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingDecisions.length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{pendingDecisions.filter(d => d.priority === 'high').length}</p>
              <p className="text-sm text-muted-foreground">Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Approuvées (mois)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <XCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Refusées (mois)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Decisions */}
      <div className="space-y-4">
        {pendingDecisions.map(decision => (
          <Card key={decision.id} className="hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    {getTypeIcon(decision.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{decision.title}</h3>
                      {getPriorityBadge(decision.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{decision.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Par {decision.submittedBy}</span>
                      <span>•</span>
                      <span>{decision.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedDecision(decision)}>
                      Examiner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{decision.title}</DialogTitle>
                      <DialogDescription>Décision soumise par {decision.submittedBy}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{decision.description}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Impact</h4>
                        <p className="text-sm text-muted-foreground">{decision.impact}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Recommandation</h4>
                        <p className="text-sm text-muted-foreground">{decision.recommendation}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Notes de décision</h4>
                        <Textarea 
                          placeholder="Ajoutez vos notes ou conditions..."
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline">Reporter</Button>
                      <Button variant="destructive">Refuser</Button>
                      <Button className="bg-emerald-500 hover:bg-emerald-600">Approuver</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DecisionArbitrage;
