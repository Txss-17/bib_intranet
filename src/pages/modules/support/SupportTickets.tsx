import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Plus,
  Loader2,
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

import { ExportButtons } from '@/components/ExportButtons';
import SupportTicketForm from '@/components/forms/SupportTicketForm';
import { ProductRequestButton } from '@/components/product/ProductRequestButton';

import {
  useSupportTickets,
  useSupportTicketStats,
  useCreateSupportTicket,
  useUpdateSupportTicket,
} from '@/hooks/useLifecycle';

import type { Database } from '@/integrations/supabase/types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];

interface SupportTicketWithAccount extends SupportTicket {
  user_account?: {
    id: string;
    company_name: string | null;
    contact_email: string | null;
  } | null;
}

const SupportTickets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] =
    useState<SupportTicketWithAccount | null>(null);

  const {
    data: tickets = [],
    isLoading,
  } = useSupportTickets({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: stats } = useSupportTicketStats();
  const createTicket = useCreateSupportTicket();
  const updateTicket = useUpdateSupportTicket();

  const typedTickets = tickets as SupportTicketWithAccount[];

  const filteredTickets = typedTickets.filter((ticket) => {
    const companyName =
      ticket.user_account?.company_name?.toLowerCase() ?? '';

    return (
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyName.includes(searchQuery.toLowerCase())
    );
  });

  const handleSubmit = (
    data: Database['public']['Tables']['support_tickets']['Insert'],
  ) => {
    if (editingTicket) {
      updateTicket.mutate(
        {
          id: editingTicket.id,
          ...data,
        },
        {
          onSuccess: () => {
            toast.success('Ticket mis à jour');
            setEditingTicket(null);
            setFormOpen(false);
          },
        },
      );

      return;
    }

    createTicket.mutate(data, {
      onSuccess: () => {
        toast.success('Ticket créé');
        setEditingTicket(null);
        setFormOpen(false);
      },
    });
  };

  const handleEdit = (ticket: SupportTicketWithAccount) => {
    setEditingTicket(ticket);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingTicket(null);
    setFormOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500">Ouvert</Badge>;

      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;

      case 'resolved':
        return <Badge className="bg-emerald-500">Résolu</Badge>;

      case 'closed':
        return <Badge variant="secondary">Fermé</Badge>;

      default:
        return (
          <Badge variant="outline">
            {status || 'N/A'}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return (
          <Badge
            variant="outline"
            className="border-destructive text-destructive"
          >
            Urgent
          </Badge>
        );

      case 'medium':
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-500"
          >
            Moyen
          </Badge>
        );

      case 'low':
        return <Badge variant="outline">Bas</Badge>;

      default:
        return (
          <Badge variant="outline">
            {priority || 'N/A'}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
            <MessageSquare className="h-8 w-8 text-primary" />
            Support client
          </h1>

          <p className="mt-1 text-muted-foreground">
            Tickets, demandes clients et suivi des échanges.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButtons
            filename="tickets-support"
            title="Tickets Support"
            columns={[
              { header: 'ID', accessor: 'id' },
              { header: 'Sujet', accessor: 'subject' },
              { header: 'Statut', accessor: 'status' },
              { header: 'Priorité', accessor: 'priority' },
              { header: 'Date création', accessor: 'created_at' },
            ]}
            data={filteredTickets}
          />

          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-8 w-8 text-blue-500" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.openTickets ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Ouverts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-yellow-500" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.pendingTickets ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                En attente
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.resolvedTickets ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Résolus
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-purple-500" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.avgResponseTime ?? '0h'}
              </p>
              <p className="text-sm text-muted-foreground">
                Temps moyen
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Rechercher un ticket ou un client..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="closed">Fermés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredTickets.map((ticket) => {
          const companyName =
            ticket.user_account?.company_name || 'Client non renseigné';

          return (
            <Card
              key={ticket.id}
              className="cursor-pointer transition-colors hover:border-primary"
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.id.substring(0, 8)}
                      </span>

                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>

                    <h3 className="font-semibold">
                      {ticket.subject}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{companyName}</span>

                      <span>•</span>

                      <span>
                        {ticket.created_at?.split('T')[0] || 'N/A'}
                      </span>

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

                  <div className="flex flex-wrap gap-2">
                    <ProductRequestButton
                      pole="support"
                      category="bug"
                      defaultTitle={`Ticket support ${ticket.id.substring(
                        0,
                        8,
                      )} — ${ticket.subject}`}
                      defaultDescription={`Ticket : ${ticket.id}
Client : ${companyName}
Priorité : ${ticket.priority || 'N/A'}

Problème constaté :
Attendu :`}
                      defaultPriority={
                        ticket.priority === 'critical' ||
                        ticket.priority === 'high'
                          ? 'high'
                          : 'medium'
                      }
                      label="Transmettre au Product"
                      variant="ghost"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ticket)}
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTickets.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucun ticket trouvé.
            </CardContent>
          </Card>
        )}
      </div>

      <SupportTicketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        ticket={editingTicket}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default SupportTickets;