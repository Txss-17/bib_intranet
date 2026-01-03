import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Check, 
  X, 
  ArrowRight, 
  Filter, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Archive,
  AlertCircle,
  Eye,
  Reply
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { poles } from '@/data/poles';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ExternalMessage {
  id: string;
  sender_email: string;
  sender_name: string | null;
  subject: string;
  content: string;
  status: 'pending' | 'validated' | 'routed' | 'responded' | 'archived';
  routed_to_pole: string | null;
  validation_notes: string | null;
  response_content: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/20 text-warning' },
  validated: { label: 'Validated', icon: Check, color: 'bg-success/20 text-success' },
  routed: { label: 'Routed', icon: ArrowRight, color: 'bg-accent/20 text-accent' },
  responded: { label: 'Responded', icon: MessageSquare, color: 'bg-success/20 text-success' },
  archived: { label: 'Archived', icon: Archive, color: 'bg-muted-foreground/20 text-muted-foreground' },
};

export default function GatewayModule() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ExternalMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ExternalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ExternalMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const [selectedPole, setSelectedPole] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  const [responseContent, setResponseContent] = useState('');

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('external-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'external_messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = messages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.subject.toLowerCase().includes(query) ||
          m.sender_email.toLowerCase().includes(query) ||
          m.content.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    setFilteredMessages(filtered);
  }, [messages, searchQuery, statusFilter]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('external_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data as ExternalMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (messageId: string, isValid: boolean) => {
    try {
      const { error } = await supabase
        .from('external_messages')
        .update({
          status: isValid ? 'validated' : 'archived',
          validation_notes: isValid ? 'Validated for routing' : 'Rejected - Invalid content',
        })
        .eq('id', messageId);

      if (error) throw error;

      // Log the action
      await supabase.from('message_routing_log').insert({
        message_id: messageId,
        action: isValid ? 'validated' : 'rejected',
        from_status: 'pending',
        to_status: isValid ? 'validated' : 'archived',
      });

      toast({
        title: isValid ? 'Message Validated' : 'Message Rejected',
        description: isValid 
          ? 'The message has been validated for routing.' 
          : 'The message has been archived.',
      });

      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message status.',
        variant: 'destructive',
      });
    }
  };

  const handleRoute = async () => {
    if (!selectedMessage || !selectedPole) return;

    try {
      const { error } = await supabase
        .from('external_messages')
        .update({
          status: 'routed' as const,
          routed_to_pole: selectedPole as 'direction' | 'finance' | 'ops' | 'tech' | 'rh' | 'supplier' | 'audit' | 'compliance' | 'rse' | 'marketing' | 'risk' | 'lifecycle',
          validation_notes: validationNotes || null,
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      // Log the routing action
      await supabase.from('message_routing_log').insert({
        message_id: selectedMessage.id,
        action: 'routed',
        from_status: selectedMessage.status,
        to_status: 'routed',
        notes: `Routed to ${selectedPole}. ${validationNotes}`,
      });

      toast({
        title: 'Message Routed',
        description: `Message has been routed to ${poles.find(p => p.id === selectedPole)?.name}.`,
      });

      setIsRouteDialogOpen(false);
      setSelectedPole('');
      setValidationNotes('');
      fetchMessages();
    } catch (error) {
      console.error('Error routing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to route message.',
        variant: 'destructive',
      });
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage || !responseContent.trim()) return;

    try {
      const { error } = await supabase
        .from('external_messages')
        .update({
          status: 'responded',
          response_content: responseContent,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      // Log the response action
      await supabase.from('message_routing_log').insert({
        message_id: selectedMessage.id,
        action: 'responded',
        from_status: selectedMessage.status,
        to_status: 'responded',
        notes: 'Response sent to sender',
      });

      toast({
        title: 'Response Logged',
        description: 'The response has been logged. Email will be sent via external system.',
      });

      setIsRespondDialogOpen(false);
      setResponseContent('');
      fetchMessages();
    } catch (error) {
      console.error('Error responding to message:', error);
      toast({
        title: 'Error',
        description: 'Failed to log response.',
        variant: 'destructive',
      });
    }
  };

  const openMessageDetail = (message: ExternalMessage) => {
    setSelectedMessage(message);
    setIsDetailOpen(true);
  };

  const MessageCard = ({ message }: { message: ExternalMessage }) => {
    const status = statusConfig[message.status];
    const StatusIcon = status.icon;
    const pole = message.routed_to_pole 
      ? poles.find(p => p.id === message.routed_to_pole)
      : null;

    return (
      <Card 
        className="enterprise-card cursor-pointer"
        onClick={() => openMessageDetail(message)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground truncate">
                  {message.sender_name || message.sender_email}
                </span>
                <Badge className={cn('shrink-0 gap-1', status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {message.subject}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {message.content}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{format(new Date(message.created_at), 'MMM d, HH:mm')}</span>
                {pole && (
                  <span className="flex items-center gap-1">
                    <span className={cn('h-2 w-2 rounded-full', pole.color)} />
                    {pole.shortName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {message.status === 'pending' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-success hover:text-success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValidate(message.id, true);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValidate(message.id, false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const stats = {
    pending: messages.filter(m => m.status === 'pending').length,
    validated: messages.filter(m => m.status === 'validated').length,
    routed: messages.filter(m => m.status === 'routed').length,
    responded: messages.filter(m => m.status === 'responded').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header */}
      <div className="module-header">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-accent" />
            Gateways & Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            External email reception, validation, and pole routing
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.validated}</p>
              <p className="text-xs text-muted-foreground">Validated</p>
            </div>
          </div>
        </Card>
        <Card className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <ArrowRight className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.routed}</p>
              <p className="text-xs text-muted-foreground">Routed</p>
            </div>
          </div>
        </Card>
        <Card className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <MessageSquare className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.responded}</p>
              <p className="text-xs text-muted-foreground">Responded</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="routed">Routed</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card className="py-12">
            <div className="text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages found</p>
            </div>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
                <DialogDescription>
                  From: {selectedMessage.sender_name || selectedMessage.sender_email}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[selectedMessage.status].color}>
                      {statusConfig[selectedMessage.status].label}
                    </Badge>
                    {selectedMessage.routed_to_pole && (
                      <Badge variant="outline">
                        Routed to: {poles.find(p => p.id === selectedMessage.routed_to_pole)?.name}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                  {selectedMessage.response_content && (
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <Label className="text-xs text-muted-foreground">Response Sent</Label>
                      <p className="text-sm mt-2 whitespace-pre-wrap">
                        {selectedMessage.response_content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Sent: {selectedMessage.responded_at && format(new Date(selectedMessage.responded_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="gap-2">
                {selectedMessage.status === 'validated' && (
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsRouteDialogOpen(true);
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Route to Pole
                  </Button>
                )}
                {(selectedMessage.status === 'routed' || selectedMessage.status === 'validated') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsRespondDialogOpen(true);
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Log Response
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Route Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Route Message to Pole</DialogTitle>
            <DialogDescription>
              Select the appropriate pole to handle this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Pole</Label>
              <Select value={selectedPole} onValueChange={setSelectedPole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pole" />
                </SelectTrigger>
                <SelectContent>
                  {poles.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', pole.color)} />
                        {pole.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Routing Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes for the receiving pole..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRouteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoute} disabled={!selectedPole}>
              Route Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={isRespondDialogOpen} onOpenChange={setIsRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Response</DialogTitle>
            <DialogDescription>
              Record the response sent to the external party.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Response Content</Label>
              <Textarea
                placeholder="Enter the response that was or will be sent..."
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRespondDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={!responseContent.trim()}>
              Log Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
