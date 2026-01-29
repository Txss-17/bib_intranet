import React, { useState } from 'react';
import { 
  MessageSquare, Search, Clock, CheckCircle2,
  AlertCircle, User, Plus, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupportTickets, useSupportTicketStats } from '@/hooks/useLifecycle';

const SupportTickets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tickets, isLoading } = useSupportTickets({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: stats } = useSupportTicketStats();

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ticket.user_account as any)?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-500">Ouvert</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'resolved': return <Badge className="bg-emerald-500">Résolu</Badge>;
      case 'closed': return <Badge variant="secondary">Fermé</Badge>;
      default: return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high': 
      case 'critical': return <Badge variant="outline" className="text-destructive border-destructive">Urgent</Badge>;
      case 'medium': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Moyen</Badge>;
      case 'low': return <Badge variant="outline">Bas</Badge>;
      default: return <Badge variant="outline">{priority || 'N/A'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Support Client
          </h1>
          <p className="text-muted-foreground mt-1">Tickets, historique des échanges</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.openTickets ?? 0}</p>
              <p className="text-sm text-muted-foreground">Ouverts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.pendingTickets ?? 0}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.resolvedTickets ?? 0}</p>
              <p className="text-sm text-muted-foreground">Résolus (7j)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.avgResponseTime ?? '0h'}</p>
              <p className="text-sm text-muted-foreground">Temps moyen réponse</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map(ticket => (
          <Card key={ticket.id} className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-muted-foreground">{ticket.id.substring(0, 8)}</span>
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <h3 className="font-semibold">{ticket.subject}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{(ticket.user_account as any)?.company_name || 'N/A'}</span>
                    <span>•</span>
                    <span>{ticket.created_at?.split('T')[0] || 'N/A'}</span>
                    {ticket.assigned_to && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Assigné
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredTickets.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun ticket trouvé
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;
