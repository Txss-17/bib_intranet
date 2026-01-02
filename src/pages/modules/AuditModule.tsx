import { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Lock,
  Image,
  Video,
  Flag,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AuditMission {
  id: string;
  title: string;
  scope: string;
  status: 'planned' | 'ongoing' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate?: string;
  auditor: string;
  findings?: number;
}

const missions: AuditMission[] = [
  { id: 'aud_1', title: 'Supplier Certification Review', scope: 'Supplier certification', status: 'ongoing', priority: 'high', startDate: '2026-01-02', auditor: 'Marc Dubois', findings: 3 },
  { id: 'aud_2', title: 'Ops Process Efficiency', scope: 'Ops processes', status: 'planned', priority: 'medium', startDate: '2026-01-15', auditor: 'Claire Martin' },
  { id: 'aud_3', title: 'ESG Claims Verification', scope: 'ESG claims', status: 'completed', priority: 'high', startDate: '2025-12-01', endDate: '2025-12-20', auditor: 'Pierre Laurent', findings: 5 },
  { id: 'aud_4', title: 'Q4 Financial Integrity Check', scope: 'Financial integrity', status: 'completed', priority: 'critical', startDate: '2025-12-10', endDate: '2025-12-28', auditor: 'Jean-Claude Petit', findings: 2 },
];

const evidenceItems = [
  { id: 'ev_1', type: 'document', name: 'Supplier_Contract_SUP445.pdf', mission: 'Supplier Certification Review', uploadedBy: 'Marc Dubois', date: '2026-01-02' },
  { id: 'ev_2', type: 'photo', name: 'Warehouse_Inspection_001.jpg', mission: 'Ops Process Efficiency', uploadedBy: 'Claire Martin', date: '2025-12-28' },
  { id: 'ev_3', type: 'video', name: 'Quality_Control_Recording.mp4', mission: 'ESG Claims Verification', uploadedBy: 'Pierre Laurent', date: '2025-12-15' },
  { id: 'ev_4', type: 'document', name: 'Financial_Reconciliation_Q4.xlsx', mission: 'Q4 Financial Integrity Check', uploadedBy: 'Jean-Claude Petit', date: '2025-12-25' },
];

const entityRiskScores = [
  { entity: 'Supplier #SUP-445', type: 'Supplier', score: 72, trend: 'improving', flags: 2 },
  { entity: 'Warehouse Paris-Est', type: 'Operations', score: 45, trend: 'stable', flags: 0 },
  { entity: 'Marketing Campaign Q1', type: 'Finance', score: 28, trend: 'declining', flags: 3 },
  { entity: 'Tech Infrastructure', type: 'Compliance', score: 85, trend: 'improving', flags: 1 },
];

const redFlags = [
  { id: 'rf_1', title: 'Missing certification documents', entity: 'Supplier #SUP-445', severity: 'high', status: 'escalated', date: '2026-01-02' },
  { id: 'rf_2', title: 'Delayed compliance training', entity: 'Operations Team', severity: 'medium', status: 'pending', date: '2026-01-01' },
  { id: 'rf_3', title: 'Budget overrun detection', entity: 'Marketing Campaign Q1', severity: 'critical', status: 'under_review', date: '2025-12-30' },
];

export default function AuditModule() {
  const [activeTab, setActiveTab] = useState('missions');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Planned</Badge>;
      case 'ongoing':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Ongoing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
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

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'photo':
        return <Image className="h-4 w-4 text-emerald-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <ClipboardCheck className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit</h1>
              <p className="text-sm text-muted-foreground">Internal & field audits • Independent oversight</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Read-Only Access
          </Badge>
          <Button size="sm">
            <Search className="h-4 w-4 mr-2" />
            New Investigation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Missions</p>
                <p className="text-2xl font-bold">{missions.filter(m => m.status === 'ongoing').length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{missions.filter(m => m.status === 'completed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Findings</p>
                <p className="text-2xl font-bold">{missions.reduce((sum, m) => sum + (m.findings || 0), 0)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Red Flags</p>
                <p className="text-2xl font-bold">{redFlags.length}</p>
              </div>
              <Flag className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="missions">Audit Missions</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Repository</TabsTrigger>
          <TabsTrigger value="risk">Risk Scoring</TabsTrigger>
          <TabsTrigger value="flags">Red Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Audit Missions
              </CardTitle>
              <CardDescription>Planned, ongoing, and completed audits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missions.map((mission) => (
                  <div key={mission.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mission.title}</span>
                          {getPriorityBadge(mission.priority)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{mission.scope}</span>
                          <span>•</span>
                          <span>Auditor: {mission.auditor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {mission.findings !== undefined && (
                        <span className="text-sm text-muted-foreground">{mission.findings} findings</span>
                      )}
                      {getStatusBadge(mission.status)}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evidence Repository
              </CardTitle>
              <CardDescription>Documents, photos, and videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evidenceItems.map((item) => (
                  <div key={item.id} className="data-row">
                    <div className="flex items-center gap-3">
                      {getEvidenceIcon(item.type)}
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.mission}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{item.uploadedBy}</div>
                      <div className="text-xs">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Entity Risk Scoring
              </CardTitle>
              <CardDescription>Risk assessment per entity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entityRiskScores.map((entity) => (
                  <div key={entity.entity} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entity.entity}</span>
                        <Badge variant="outline" className="text-xs">{entity.type}</Badge>
                        {entity.flags > 0 && (
                          <Badge className="bg-red-500 text-xs">{entity.flags} flags</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-bold', getRiskColor(entity.score))}>{entity.score}/100</span>
                        <span className="text-xs text-muted-foreground capitalize">({entity.trend})</span>
                      </div>
                    </div>
                    <Progress value={entity.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="h-4 w-4 text-red-500" />
                Red Flags & Escalations
              </CardTitle>
              <CardDescription>Issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4',
                      flag.severity === 'critical' && 'border-red-500/30 bg-red-500/5',
                      flag.severity === 'high' && 'border-amber-500/30 bg-amber-500/5',
                      flag.severity === 'medium' && 'border-blue-500/30 bg-blue-500/5'
                    )}
                  >
                    <Flag className={cn(
                      'h-4 w-4 mt-0.5',
                      flag.severity === 'critical' && 'text-red-500',
                      flag.severity === 'high' && 'text-amber-500',
                      flag.severity === 'medium' && 'text-blue-500'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{flag.title}</p>
                        <Badge variant="outline" className="capitalize">{flag.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{flag.entity}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
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
