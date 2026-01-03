import { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  Send, 
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSubmissionCode, encryptContent } from '@/lib/encryption';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'fraud', label: 'Fraud / Financial Misconduct' },
  { value: 'safety', label: 'Safety Violation' },
  { value: 'corruption', label: 'Corruption / Bribery' },
  { value: 'data_breach', label: 'Data Privacy Breach' },
  { value: 'conflict_interest', label: 'Conflict of Interest' },
  { value: 'other', label: 'Other Ethical Concern' },
];

const severityLevels = [
  { value: 'low', label: 'Low', color: 'bg-muted' },
  { value: 'medium', label: 'Medium', color: 'bg-warning' },
  { value: 'high', label: 'High', color: 'bg-destructive' },
  { value: 'critical', label: 'Critical', color: 'bg-destructive animate-pulse-subtle' },
];

export default function EthicsModule() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('submit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Form state
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const code = generateSubmissionCode();
      const contentToEncrypt = JSON.stringify({
        description,
        evidence,
        timestamp: new Date().toISOString(),
      });
      const encryptedContent = encryptContent(contentToEncrypt);

      const { error } = await supabase
        .from('whistleblower_submissions')
        .insert({
          submission_code: code,
          encrypted_content: encryptedContent,
          category,
          severity,
        });

      if (error) throw error;

      setSubmittedCode(code);
      setCategory('');
      setSeverity('medium');
      setDescription('');
      setEvidence('');

      toast({
        title: 'Submission Received',
        description: 'Your report has been securely submitted.',
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Submission Failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (submittedCode) {
      navigator.clipboard.writeText(submittedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTrackSubmission = async () => {
    if (!trackingCode.trim()) {
      toast({
        title: 'Enter Tracking Code',
        description: 'Please enter your submission code to track.',
        variant: 'destructive',
      });
      return;
    }

    setIsTracking(true);

    try {
      const { data, error } = await supabase
        .from('whistleblower_submissions')
        .select('submission_code, category, severity, status, created_at, updated_at')
        .eq('submission_code', trackingCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: 'Not Found',
          description: 'No submission found with this code.',
          variant: 'destructive',
        });
        setSubmissionStatus(null);
      } else {
        setSubmissionStatus(data);
      }
    } catch (error) {
      console.error('Error tracking submission:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-warning" />;
      case 'investigating':
        return <Search className="h-4 w-4 text-accent" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header */}
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-accent" />
            Ethics & Whistleblowing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure, anonymous reporting system for ethical concerns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Encrypted
          </Badge>
          <Badge variant="outline" className="gap-1">
            <EyeOff className="h-3 w-3" />
            Anonymous
          </Badge>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">Your Privacy is Protected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All submissions are encrypted and anonymous. Your identity is never stored or logged. 
                Only authorized auditors can view submission content. Save your tracking code to monitor progress.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="submit" className="gap-2">
            <Send className="h-4 w-4" />
            Submit Report
          </TabsTrigger>
          <TabsTrigger value="track" className="gap-2">
            <Search className="h-4 w-4" />
            Track Submission
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="mt-6">
          {submittedCode ? (
            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle className="text-success flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Submission Successful
                </CardTitle>
                <CardDescription>
                  Your report has been securely submitted. Save your tracking code below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <Label className="text-xs text-muted-foreground">Your Tracking Code</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xl font-mono font-bold text-foreground">
                      {submittedCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
                  <p>
                    Save this code securely. It's the only way to track your submission. 
                    We cannot recover it if lost.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSubmittedCode(null)}
                  className="w-full"
                >
                  Submit Another Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle>Submit Anonymous Report</CardTitle>
                <CardDescription>
                  All fields are encrypted. Your identity is not collected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity Level</Label>
                    <div className="flex gap-2">
                      {severityLevels.map((level) => (
                        <Button
                          key={level.value}
                          type="button"
                          variant={severity === level.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSeverity(level.value)}
                          className={cn(
                            severity === level.value && level.color
                          )}
                        >
                          {level.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the concern in detail. Include dates, locations, and people involved if possible."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evidence">Supporting Evidence (Optional)</Label>
                    <Textarea
                      id="evidence"
                      placeholder="Describe any documents, communications, or other evidence that supports your report."
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Lock className="h-4 w-4 mr-2 animate-pulse" />
                        Encrypting & Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Securely
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="track" className="mt-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Track Your Submission</CardTitle>
              <CardDescription>
                Enter your tracking code to check the status of your report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tracking code (e.g., WB-ABC12345)"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button onClick={handleTrackSubmission} disabled={isTracking}>
                  {isTracking ? 'Searching...' : 'Track'}
                </Button>
              </div>

              {submissionStatus && (
                <div className="p-4 bg-secondary rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Code</span>
                    <code className="font-mono font-medium">
                      {submissionStatus.submission_code}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="font-medium capitalize">
                      {submissionStatus.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Severity</span>
                    <Badge 
                      variant={submissionStatus.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {submissionStatus.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submissionStatus.status)}
                      <span className="font-medium">
                        {getStatusLabel(submissionStatus.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submitted</span>
                    <span className="text-sm">
                      {new Date(submissionStatus.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">
                      {new Date(submissionStatus.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
