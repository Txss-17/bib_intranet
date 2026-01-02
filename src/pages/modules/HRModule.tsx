import { useState } from 'react';
import {
  Users,
  UserPlus,
  Briefcase,
  FileText,
  Clock,
  GraduationCap,
  ArrowUpRight,
  CheckCircle,
  Calendar,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const recruitmentPipeline = [
  { id: 'rec_1', position: 'Senior Software Engineer', department: 'Tech', stage: 'interview', applicants: 45, shortlisted: 8, deadline: '2026-01-15' },
  { id: 'rec_2', position: 'Finance Analyst', department: 'Finance', stage: 'screening', applicants: 62, shortlisted: 12, deadline: '2026-01-20' },
  { id: 'rec_3', position: 'Operations Manager', department: 'Ops', stage: 'offer', applicants: 28, shortlisted: 3, deadline: '2026-01-10' },
  { id: 'rec_4', position: 'Compliance Officer', department: 'Legal', stage: 'posted', applicants: 15, shortlisted: 0, deadline: '2026-02-01' },
];

const onboardingQueue = [
  { id: 'onb_1', name: 'Sophie Martin', position: 'Data Analyst', startDate: '2026-01-08', progress: 60, mentor: 'Jean Dupont' },
  { id: 'onb_2', name: 'Pierre Bernard', position: 'Sales Executive', startDate: '2026-01-15', progress: 20, mentor: 'Marie Leroy' },
  { id: 'onb_3', name: 'Claire Dubois', position: 'UX Designer', startDate: '2025-12-15', progress: 100, mentor: 'Thomas Petit' },
];

const contracts = [
  { id: 'con_1', employee: 'Employee #EMP-1245', type: 'CDI', status: 'active', startDate: '2024-03-15', endDate: null },
  { id: 'con_2', employee: 'Employee #EMP-1248', type: 'CDD', status: 'expiring', startDate: '2025-07-01', endDate: '2026-01-31' },
  { id: 'con_3', employee: 'Employee #EMP-1250', type: 'CDI', status: 'pending_signature', startDate: '2026-01-08', endDate: null },
];

const trainingRequests = [
  { id: 'trn_1', employee: 'Employee #EMP-892', training: 'Leadership Development', status: 'approved', budget: 2500, date: '2026-02-01' },
  { id: 'trn_2', employee: 'Employee #EMP-1102', training: 'Data Privacy Certification', status: 'pending', budget: 1200, date: '2026-01-20' },
  { id: 'trn_3', employee: 'Employee #EMP-756', training: 'Project Management', status: 'completed', budget: 1800, date: '2025-12-15' },
];

const mobilityRequests = [
  { id: 'mob_1', employee: 'Employee #EMP-445', fromDept: 'Ops', toDept: 'Tech', status: 'under_review', requestDate: '2025-12-20' },
  { id: 'mob_2', employee: 'Employee #EMP-892', fromDept: 'Support', toDept: 'Sales', status: 'approved', requestDate: '2025-12-10' },
];

const hrStats = {
  totalEmployees: 847,
  openPositions: 12,
  avgTenure: '2.4 years',
  trainingBudgetUsed: 68,
};

export default function HRModule() {
  const [activeTab, setActiveTab] = useState('recruitment');

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'posted': return 'bg-blue-500';
      case 'screening': return 'bg-amber-500';
      case 'interview': return 'bg-purple-500';
      case 'offer': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{status}</Badge>;
      case 'expiring':
      case 'pending':
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">{status.replace('_', ' ')}</Badge>;
      case 'pending_signature':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Pending Signature</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Human Resources</h1>
              <p className="text-sm text-muted-foreground">Recruitment, onboarding, and career development</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{hrStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold">{hrStats.openPositions}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Tenure</p>
                <p className="text-2xl font-bold">{hrStats.avgTenure}</p>
              </div>
              <Clock className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Training Budget</p>
                <p className="text-2xl font-bold">{hrStats.trainingBudgetUsed}%</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="mobility">Internal Mobility</TabsTrigger>
        </TabsList>

        <TabsContent value="recruitment" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Recruitment Pipeline
              </CardTitle>
              <CardDescription>Active job openings and candidate progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recruitmentPipeline.map((job) => (
                  <div key={job.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{job.position}</p>
                          <Badge className={getStageColor(job.stage)} >{job.stage}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Department: {job.department}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">Deadline: {job.deadline}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Applicants</p>
                        <p className="text-lg font-semibold">{job.applicants}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Shortlisted</p>
                        <p className="text-lg font-semibold">{job.shortlisted}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-4 w-4" />
                Onboarding Queue
              </CardTitle>
              <CardDescription>New hires and their onboarding progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingQueue.map((employee) => (
                  <div key={employee.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.position} • Start: {employee.startDate} • Mentor: {employee.mentor}
                        </p>
                      </div>
                      {employee.progress === 100 ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium">{employee.progress}%</span>
                      )}
                    </div>
                    <Progress value={employee.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contract Management
              </CardTitle>
              <CardDescription>Employment contracts and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div key={contract.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contract.employee}</p>
                          <Badge variant="outline">{contract.type}</Badge>
                          {getStatusBadge(contract.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Start: {contract.startDate}
                          {contract.endDate && ` • End: ${contract.endDate}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Training Requests
              </CardTitle>
              <CardDescription>Employee development and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trainingRequests.map((training) => (
                  <div key={training.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{training.training}</p>
                          {getStatusBadge(training.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {training.employee} • Date: {training.date} • Budget: €{training.budget}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobility" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Internal Mobility
              </CardTitle>
              <CardDescription>Department transfer requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mobilityRequests.map((request) => (
                  <div key={request.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{request.employee}</p>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.fromDept} → {request.toDept} • Requested: {request.requestDate}
                        </p>
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
