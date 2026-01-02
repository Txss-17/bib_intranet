import { useState } from 'react';
import {
  Package,
  Video,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  Shield,
  ThumbsUp,
  ThumbsDown,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProductReview {
  id: string;
  productName: string;
  supplier: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  hasVideo: boolean;
  imagesCount: number;
  packagingValidated: boolean;
  complianceScore: number;
}

const productQueue: ProductReview[] = [
  { id: 'prod_1', productName: 'Smart Watch Pro X', supplier: 'Supplier A', submittedAt: '2026-01-02', status: 'pending', hasVideo: true, imagesCount: 12, packagingValidated: false, complianceScore: 85 },
  { id: 'prod_2', productName: 'Wireless Earbuds Elite', supplier: 'Supplier B', submittedAt: '2026-01-01', status: 'pending', hasVideo: true, imagesCount: 8, packagingValidated: true, complianceScore: 92 },
  { id: 'prod_3', productName: 'Fitness Tracker Band', supplier: 'Supplier C', submittedAt: '2025-12-30', status: 'revision', hasVideo: false, imagesCount: 6, packagingValidated: false, complianceScore: 65 },
  { id: 'prod_4', productName: 'Portable Charger 20K', supplier: 'Supplier A', submittedAt: '2025-12-28', status: 'approved', hasVideo: true, imagesCount: 10, packagingValidated: true, complianceScore: 98 },
];

const complianceChecklist = [
  { id: 'chk_1', item: 'Product video (min 30s)', required: true },
  { id: 'chk_2', item: 'Minimum 6 product images', required: true },
  { id: 'chk_3', item: 'Packaging dimensions & weight', required: true },
  { id: 'chk_4', item: 'Material safety certification', required: true },
  { id: 'chk_5', item: 'Country of origin declaration', required: true },
  { id: 'chk_6', item: 'CE/FCC marking (if applicable)', required: false },
  { id: 'chk_7', item: 'Battery certification (if applicable)', required: false },
  { id: 'chk_8', item: 'Environmental impact declaration', required: true },
];

const validationHistory = [
  { id: 'hist_1', productName: 'Smart Watch Pro X', action: 'Submitted for review', user: 'System', timestamp: '2026-01-02 10:30' },
  { id: 'hist_2', productName: 'Wireless Earbuds Elite', action: 'Packaging validated', user: 'Marie Dupont', timestamp: '2026-01-02 09:15' },
  { id: 'hist_3', productName: 'Fitness Tracker Band', action: 'Revision requested - Missing video', user: 'Jean Martin', timestamp: '2026-01-01 16:45' },
  { id: 'hist_4', productName: 'Portable Charger 20K', action: 'Approved for catalog', user: 'Sophie Bernard', timestamp: '2025-12-30 14:20' },
  { id: 'hist_5', productName: 'Bluetooth Speaker Mini', action: 'Rejected - Compliance failure', user: 'Pierre Laurent', timestamp: '2025-12-28 11:00' },
];

export default function SupplierModule() {
  const [activeTab, setActiveTab] = useState('queue');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Rejected</Badge>;
      case 'revision':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Supplier & Product Validation</h1>
              <p className="text-sm text-muted-foreground">Quality barrier • Multi-confirmation required</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Full Traceability
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{productQueue.filter(p => p.status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Revision</p>
                <p className="text-2xl font-bold">{productQueue.filter(p => p.status === 'revision').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold">{productQueue.filter(p => p.status === 'approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Compliance</p>
                <p className="text-2xl font-bold">
                  {Math.round(productQueue.reduce((sum, p) => sum + p.complianceScore, 0) / productQueue.length)}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="queue">Product Queue</TabsTrigger>
          <TabsTrigger value="checklist">Compliance Checklist</TabsTrigger>
          <TabsTrigger value="history">Validation History</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Review Queue
              </CardTitle>
              <CardDescription>Products awaiting validation before catalog entry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productQueue.map((product) => (
                  <div key={product.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.productName}</p>
                          {getStatusBadge(product.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{product.supplier} • Submitted: {product.submittedAt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>

                    {/* Validation indicators */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className={cn(
                        'flex items-center gap-1',
                        product.hasVideo ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        <Video className="h-4 w-4" />
                        <span>{product.hasVideo ? 'Video ✓' : 'No video'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Image className="h-4 w-4" />
                        <span>{product.imagesCount} images</span>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1',
                        product.packagingValidated ? 'text-emerald-500' : 'text-amber-500'
                      )}>
                        <Package className="h-4 w-4" />
                        <span>{product.packagingValidated ? 'Packaging ✓' : 'Packaging pending'}</span>
                      </div>
                      <div className={cn('flex items-center gap-1', getComplianceColor(product.complianceScore))}>
                        <Shield className="h-4 w-4" />
                        <span>Compliance: {product.complianceScore}%</span>
                      </div>
                    </div>

                    {/* Actions for pending items */}
                    {product.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-amber-500 border-amber-500/30">
                          Request Revision
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-500/30">
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Compliance Checklist
              </CardTitle>
              <CardDescription>Required items for product approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceChecklist.map((item) => (
                  <div key={item.id} className="data-row">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full',
                        item.required ? 'bg-red-500/10' : 'bg-muted'
                      )}>
                        <CheckCircle className={cn(
                          'h-4 w-4',
                          item.required ? 'text-red-500' : 'text-muted-foreground'
                        )} />
                      </div>
                      <span className="text-sm">{item.item}</span>
                    </div>
                    <Badge variant={item.required ? 'default' : 'secondary'}>
                      {item.required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" />
                Validation History
              </CardTitle>
              <CardDescription>Complete audit trail of all validation actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationHistory.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {index < validationHistory.length - 1 && (
                      <div className="timeline-connector" />
                    )}
                    <div className="data-row pl-6">
                      <div>
                        <p className="font-medium text-sm">{entry.productName}</p>
                        <p className="text-sm text-muted-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">by {entry.user}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
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
