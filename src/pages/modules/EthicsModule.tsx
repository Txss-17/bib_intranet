import { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Report {
  id: string;
  caseNumber: string;
  category: string;
  status: 'submitted' | 'under_review' | 'investigating' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  submittedAt: string;
  lastUpdate: string;
  hasEvidence: boolean;
}

const reports: Report[] = [
  { id: 'rep_1', caseNumber: 'ETH-2026-001', category: 'Workplace harassment', status: 'investigating', severity: 'high', submittedAt: '2026-01-01', lastUpdate: '2026-01-02', hasEvidence: true },
  { id: 'rep_2', caseNumber: 'ETH-2025-089', category: 'Financial misconduct', status: 'under_review', severity: 'critical', submittedAt: '2025-12-28', lastUpdate: '2026-01-02', hasEvidence: true },
  { id: 'rep_3', caseNumber: 'ETH-2025-088', category: 'Policy violation', status: 'resolved', severity: 'medium', submittedAt: '2025-12-20', lastUpdate: '2025-12-30', hasEvidence: false },
  { id: 'rep_4', caseNumber: 'ETH-2025-085', category: 'Data privacy concern', status: 'closed', severity: 'low', submittedAt: '2025-12-15', lastUpdate: '2025-12-22', hasEvidence: true },
];

const committeeDecisions = [
  { id: 'dec_1', caseNumber: 'ETH-2025-088', decision: 'Formal warning issued', decidedBy: 'Ethics Committee', date: '2025-12-30', rationale: 'Policy violation confirmed but mitigating circumstances acknowledged.' },
  { id: 'dec_2', caseNumber: 'ETH-2025-085', decision: 'No further action', decidedBy: 'Ethics Committee', date: '2025-12-22', rationale: 'Investigation found no intentional wrongdoing. Training recommended.' },
];

const reportCategories = [
  'Workplace harassment',
  'Discrimination',
  'Financial misconduct',
  'Policy violation',
  'Data privacy concern',
  'Conflict of interest',
  'Safety violation',
  'Other ethical concern',
];

export default function EthicsModule() {
  const [activeTab, setActiveTab] = useState('reports');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Under Review</Badge>;
      case 'investigating':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">Investigating</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      case 'high':
        return <Badge className="bg-amber-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Medium</Badge>;
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
              <Shield className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ethics & Whistleblowing</h1>
              <p className="text-sm text-muted-foreground">Confidential reporting • Protected anonymity</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Ethics Committee Only
          </Badge>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-violet-500 mt-0.5" />
            <div>
              <p className="font-medium">Reporter Anonymity Protected</p>
              <p className="text-sm text-muted-foreground mt-1">
                All reports are encrypted and anonymized. Reporter identity is protected under LINKSY ethics policy and applicable whistleblower protection laws.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-2xl font-bold">{reports.filter(r => ['submitted', 'under_review', 'investigating'].includes(r.status)).length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under Investigation</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'investigating').length}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'resolved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Evidence</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.hasEvidence).length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="reports">Anonymous Reports</TabsTrigger>
          <TabsTrigger value="submit">Submit Report</TabsTrigger>
          <TabsTrigger value="decisions">Committee Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Anonymous Reports
              </CardTitle>
              <CardDescription>All reports are confidential and protected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{report.caseNumber}</p>
                          {getStatusBadge(report.status)}
                          {getSeverityBadge(report.severity)}
                        </div>
                        <p className="font-medium mt-1">{report.category}</p>
                      </div>
                      {report.hasEvidence && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Evidence attached
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Submitted: {report.submittedAt}</span>
                      <span>Last update: {report.lastUpdate}</span>
                    </div>
                    {['under_review', 'investigating'].includes(report.status) && (
                      <div className="pt-2 border-t">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Submit Anonymous Report
              </CardTitle>
              <CardDescription>Your identity is fully protected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <EyeOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Anonymous Reporting Portal</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Submit concerns about ethics violations, harassment, discrimination, or other workplace issues. 
                  Your identity will be protected and encrypted.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {reportCategories.map((cat) => (
                    <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-muted">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <Button className="bg-violet-500 hover:bg-violet-600">
                  <Shield className="h-4 w-4 mr-2" />
                  Start Anonymous Report
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 text-center">
                    <Lock className="h-8 w-8 mx-auto text-violet-500 mb-2" />
                    <p className="font-medium text-sm">Encrypted</p>
                    <p className="text-xs text-muted-foreground">End-to-end encryption</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 text-center">
                    <EyeOff className="h-8 w-8 mx-auto text-violet-500 mb-2" />
                    <p className="font-medium text-sm">Anonymous</p>
                    <p className="text-xs text-muted-foreground">No personal data stored</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 text-center">
                    <Shield className="h-8 w-8 mx-auto text-violet-500 mb-2" />
                    <p className="font-medium text-sm">Protected</p>
                    <p className="text-xs text-muted-foreground">Whistleblower laws apply</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ethics Committee Decisions
              </CardTitle>
              <CardDescription>Final determinations on closed cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {committeeDecisions.map((decision) => (
                  <div key={decision.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{decision.caseNumber}</p>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Decided
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{decision.date}</span>
                    </div>
                    <div>
                      <p className="font-medium">{decision.decision}</p>
                      <p className="text-sm text-muted-foreground mt-1">{decision.rationale}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Decided by: {decision.decidedBy}</p>
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
