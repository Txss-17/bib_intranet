import { useState } from 'react';
import {
  Scale,
  FileText,
  AlertTriangle,
  Globe,
  Gavel,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  History,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const legalDocuments = [
  { id: 'doc_1', name: 'CGU - Conditions Générales d\'Utilisation', version: '4.2', status: 'active', lastUpdate: '2025-12-15', nextReview: '2026-06-15' },
  { id: 'doc_2', name: 'CGV - Conditions Générales de Vente', version: '3.8', status: 'active', lastUpdate: '2025-11-20', nextReview: '2026-05-20' },
  { id: 'doc_3', name: 'Politique de Confidentialité', version: '5.0', status: 'active', lastUpdate: '2026-01-01', nextReview: '2026-07-01' },
  { id: 'doc_4', name: 'Charte Éthique', version: '2.1', status: 'under_review', lastUpdate: '2025-10-10', nextReview: '2026-04-10' },
];

const marketRequirements = [
  { market: 'France', regulations: ['GDPR', 'Loi Informatique et Libertés', 'Code de la Consommation'], status: 'compliant' },
  { market: 'Germany', regulations: ['GDPR', 'TMG', 'UWG'], status: 'compliant' },
  { market: 'Spain', regulations: ['GDPR', 'LOPDGDD', 'LSSI'], status: 'compliant' },
  { market: 'United Kingdom', regulations: ['UK GDPR', 'Consumer Rights Act'], status: 'pending_review' },
  { market: 'Belgium', regulations: ['GDPR', 'Code of Economic Law'], status: 'compliant' },
];

const legalIncidents = [
  { id: 'inc_1', title: 'Customer complaint - Refund policy dispute', severity: 'low', status: 'investigating', market: 'France', createdAt: '2026-01-02' },
  { id: 'inc_2', title: 'Data access request - GDPR Article 15', severity: 'medium', status: 'in_progress', market: 'Germany', createdAt: '2026-01-01' },
  { id: 'inc_3', title: 'Supplier contract breach allegation', severity: 'high', status: 'escalated', market: 'Spain', createdAt: '2025-12-28' },
];

const litigationTracking = [
  { id: 'lit_1', case: 'LIT-2025-042', description: 'Trademark dispute - Product naming', status: 'active', riskLevel: 'medium', counsel: 'External - Firm A', nextHearing: '2026-02-15' },
  { id: 'lit_2', case: 'LIT-2025-038', description: 'Consumer class action - Shipping delays', status: 'settled', riskLevel: 'low', counsel: 'Internal', nextHearing: null },
];

const sanctionWorkflows = [
  { id: 'san_1', type: 'Warning Letter', target: 'Supplier #SUP-445', reason: 'Compliance violation', status: 'pending_approval', createdBy: 'Legal Team', createdAt: '2026-01-02' },
  { id: 'san_2', type: 'Contract Suspension', target: 'Partner #PRT-221', reason: 'Quality standards breach', status: 'approved', createdBy: 'Compliance Officer', createdAt: '2025-12-30' },
];

export default function ComplianceModule() {
  const [activeTab, setActiveTab] = useState('documents');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'compliant':
      case 'settled':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Active</Badge>;
      case 'under_review':
      case 'pending_review':
      case 'investigating':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Under Review</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">In Progress</Badge>;
      case 'escalated':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Escalated</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
              <Scale className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Compliance & Legal</h1>
              <p className="text-sm text-muted-foreground">Zero judicial surprises • Immutable archives</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Legal-Only Write Access
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Documents</p>
                <p className="text-2xl font-bold">{legalDocuments.filter(d => d.status === 'active').length}</p>
              </div>
              <FileText className="h-8 w-8 text-indigo-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Markets Covered</p>
                <p className="text-2xl font-bold">{marketRequirements.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
                <p className="text-2xl font-bold">{legalIncidents.filter(i => i.status !== 'resolved').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Litigation</p>
                <p className="text-2xl font-bold">{litigationTracking.filter(l => l.status === 'active').length}</p>
              </div>
              <Gavel className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="documents">Legal Documents</TabsTrigger>
          <TabsTrigger value="markets">Market Requirements</TabsTrigger>
          <TabsTrigger value="incidents">Legal Incidents</TabsTrigger>
          <TabsTrigger value="litigation">Litigation</TabsTrigger>
          <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CGU / CGV Versions
              </CardTitle>
              <CardDescription>Legal document management with version control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {legalDocuments.map((doc) => (
                  <div key={doc.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.name}</p>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Version {doc.version} • Last updated: {doc.lastUpdate} • Next review: {doc.nextReview}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markets" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Regulatory Requirements per Market
              </CardTitle>
              <CardDescription>Compliance status by operating region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketRequirements.map((market) => (
                  <div key={market.market} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{market.market}</p>
                        {market.status === 'compliant' ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Compliant
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Review
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {market.regulations.map((reg) => (
                        <Badge key={reg} variant="secondary" className="text-xs">
                          {reg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Legal Incidents
              </CardTitle>
              <CardDescription>Complaints, disputes, and regulatory issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {legalIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4',
                      incident.status === 'escalated' && 'border-red-500/30 bg-red-500/5'
                    )}
                  >
                    <AlertTriangle className={cn(
                      'h-4 w-4 mt-0.5',
                      incident.severity === 'high' && 'text-red-500',
                      incident.severity === 'medium' && 'text-amber-500',
                      incident.severity === 'low' && 'text-blue-500'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{incident.title}</p>
                          {getSeverityBadge(incident.severity)}
                        </div>
                        {getStatusBadge(incident.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Market: {incident.market} • Opened: {incident.createdAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="litigation" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Litigation Tracking
              </CardTitle>
              <CardDescription>Active and settled legal cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {litigationTracking.map((lit) => (
                  <div key={lit.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{lit.case}</p>
                        {getStatusBadge(lit.status)}
                        {getSeverityBadge(lit.riskLevel)}
                      </div>
                    </div>
                    <p className="font-medium">{lit.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Counsel: {lit.counsel}</span>
                      {lit.nextHearing && <span>Next hearing: {lit.nextHearing}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sanctions" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sanction Workflows
              </CardTitle>
              <CardDescription>Enforcement actions and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sanctionWorkflows.map((sanction) => (
                  <div key={sanction.id} className="data-row">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sanction.type}</p>
                        {getStatusBadge(sanction.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Target: {sanction.target} • Reason: {sanction.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {sanction.createdBy} on {sanction.createdAt}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
