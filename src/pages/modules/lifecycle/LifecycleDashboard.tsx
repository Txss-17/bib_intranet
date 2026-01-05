import React, { useState } from 'react';
import { 
  Users, AlertTriangle, TrendingUp, TrendingDown, Star,
  CreditCard, Package, Mail, MessageSquare, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const dashboardStats = {
  totalUsers: 1247,
  atRiskUsers: 23,
  pendingPayments: 8,
  trustpilotScore: 4.6,
  openTickets: 12,
  avgResponseTime: '2.4h'
};

const atRiskUsers = [
  { id: '1', company: 'BeautyBox Pro', issue: 'Impayé 45 jours', amount: 2400, severity: 'high' },
  { id: '2', company: 'CosmetiCare', issue: 'Stock non écoulé', amount: 0, severity: 'medium' },
  { id: '3', company: 'Natural Glow', issue: 'Inactivité 60 jours', amount: 0, severity: 'low' },
];

const recentTickets = [
  { id: '1', subject: 'Problème livraison', company: 'SkinCare Plus', status: 'open', priority: 'high' },
  { id: '2', subject: 'Question facturation', company: 'Bio Beauty', status: 'pending', priority: 'medium' },
  { id: '3', subject: 'Demande catalogue', company: 'Fresh Face', status: 'open', priority: 'low' },
];

const LifecycleDashboard = () => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

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
            <p className="text-2xl font-bold">{dashboardStats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
          </CardContent>
        </Card>
        <Card className="border-destructive">
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
            <p className="text-2xl font-bold text-destructive">{dashboardStats.atRiskUsers}</p>
            <p className="text-xs text-muted-foreground">À risque</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CreditCard className="h-5 w-5 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{dashboardStats.pendingPayments}</p>
            <p className="text-xs text-muted-foreground">Paiements en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Star className="h-5 w-5 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{dashboardStats.trustpilotScore}</p>
            <p className="text-xs text-muted-foreground">Trustpilot</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <MessageSquare className="h-5 w-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{dashboardStats.openTickets}</p>
            <p className="text-xs text-muted-foreground">Tickets ouverts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Clock className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">{dashboardStats.avgResponseTime}</p>
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
              {atRiskUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.company}</p>
                    <p className="text-sm text-muted-foreground">{user.issue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.amount > 0 && (
                      <span className="text-sm font-medium">€{user.amount}</span>
                    )}
                    <Badge className={getSeverityColor(user.severity)}>{user.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">Voir tous les risques</Button>
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
              {recentTickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">{ticket.company}</p>
                  </div>
                  <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">Voir tous les tickets</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LifecycleDashboard;
