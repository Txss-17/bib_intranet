import React, { useState } from 'react';
import { 
  Users, AlertTriangle, TrendingUp, Star,
  CreditCard, MessageSquare, Clock, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useUserAccountStats, useAtRiskUsers, useSupportTicketStats, useSupportTickets } from '@/hooks/useLifecycle';

const LifecycleDashboard = () => {
  const { data: userStats, isLoading: userStatsLoading } = useUserAccountStats();
  const { data: atRiskUsers, isLoading: atRiskLoading } = useAtRiskUsers();
  const { data: ticketStats } = useSupportTicketStats();
  const { data: recentTickets } = useSupportTickets({ limit: 3 });

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'high':
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const isLoading = userStatsLoading || atRiskLoading;

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
            <Users className="h-8 w-8 text-primary" />
            User Success & Risk
          </h1>
          <p className="text-muted-foreground mt-1">Gestion utilisateurs, prévention risques, support</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{userStats?.totalUsers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
          </CardContent>
        </Card>
        <Card className={userStats?.atRiskUsers ? "border-destructive" : ""}>
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
            <p className="text-2xl font-bold text-destructive">{userStats?.atRiskUsers ?? 0}</p>
            <p className="text-xs text-muted-foreground">À risque</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CreditCard className="h-5 w-5 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{userStats?.unpaidUsers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Paiements en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Star className="h-5 w-5 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{userStats?.averageRating ?? 0}</p>
            <p className="text-xs text-muted-foreground">Note moyenne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <MessageSquare className="h-5 w-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{ticketStats?.openTickets ?? 0}</p>
            <p className="text-xs text-muted-foreground">Tickets ouverts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Clock className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">{ticketStats?.avgResponseTime ?? '0h'}</p>
            <p className="text-xs text-muted-foreground">Temps réponse</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At Risk Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Utilisateurs à Risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskUsers?.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.payment_status === 'overdue' ? 'Paiement en retard' : 
                       user.risk_level === 'critical' ? 'Risque critique' : 'À surveiller'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.revenue && user.revenue > 0 && (
                      <span className="text-sm font-medium">€{user.revenue.toLocaleString()}</span>
                    )}
                    <Badge className={getSeverityColor(user.risk_level)}>{user.risk_level}</Badge>
                  </div>
                </div>
              ))}
              {(!atRiskUsers || atRiskUsers.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Aucun utilisateur à risque</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/pole/lifecycle/risk-alerts">Voir tous les risques</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Tickets Récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets?.slice(0, 5).map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {(ticket.user_account as any)?.company_name || 'N/A'}
                    </p>
                  </div>
                  <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
              {(!recentTickets || recentTickets.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Aucun ticket récent</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/pole/lifecycle/support">Voir tous les tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LifecycleDashboard;
