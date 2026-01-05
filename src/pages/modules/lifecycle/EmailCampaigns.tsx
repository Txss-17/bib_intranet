import React, { useState } from 'react';
import { 
  Mail, Send, Clock, CheckCircle2, FileText,
  Plus, Users, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const templates = [
  { id: '1', name: 'Relance impayé J+15', category: 'payment', usageCount: 45 },
  { id: '2', name: 'Relance impayé J+30', category: 'payment', usageCount: 28 },
  { id: '3', name: 'Bienvenue nouveau client', category: 'onboarding', usageCount: 156 },
  { id: '4', name: 'Réactivation inactif', category: 'reactivation', usageCount: 34 },
  { id: '5', name: 'Suivi commande', category: 'follow-up', usageCount: 89 },
];

const scheduledEmails = [
  { id: '1', template: 'Relance impayé J+30', recipient: 'CosmetiCare', scheduledFor: '2026-01-08', status: 'scheduled' },
  { id: '2', template: 'Réactivation inactif', recipient: 'Fresh Face', scheduledFor: '2026-01-10', status: 'scheduled' },
];

const sentEmails = [
  { id: '1', template: 'Relance impayé J+15', recipient: 'SkinCare Plus', sentAt: '2026-01-04', opened: true },
  { id: '2', template: 'Suivi commande', recipient: 'Bio Beauty', sentAt: '2026-01-03', opened: true },
  { id: '3', template: 'Bienvenue nouveau client', recipient: 'GlowUp Pro', sentAt: '2026-01-02', opened: false },
];

const EmailCampaigns = () => {
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            Emails & Accompagnement
          </h1>
          <p className="text-muted-foreground mt-1">Templates personnalisés, envoi manuel / planifié</p>
        </div>
        <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un template</DialogTitle>
              <DialogDescription>Créez un nouveau template d'email personnalisé</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Nom du template" />
              <Input placeholder="Objet de l'email" />
              <Textarea placeholder="Contenu de l'email..." rows={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTemplate(false)}>Annuler</Button>
              <Button>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-sm text-muted-foreground">Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{scheduledEmails.length}</p>
              <p className="text-sm text-muted-foreground">Planifiés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Send className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{sentEmails.length}</p>
              <p className="text-sm text-muted-foreground">Envoyés (7j)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{Math.round(sentEmails.filter(e => e.opened).length / sentEmails.length * 100)}%</p>
              <p className="text-sm text-muted-foreground">Taux ouverture</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
          <TabsTrigger value="sent">Envoyés</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">Utilisé {template.usageCount} fois</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">Modifier</Button>
                    <Button size="sm" className="flex-1">Envoyer</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4 space-y-4">
          {scheduledEmails.map(email => (
            <Card key={email.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">{email.template}</p>
                    <p className="text-sm text-muted-foreground">À: {email.recipient}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{email.scheduledFor}</p>
                    <Badge variant="outline">Planifié</Badge>
                  </div>
                  <Button variant="outline" size="sm">Annuler</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-4">
          {sentEmails.map(email => (
            <Card key={email.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className={`h-5 w-5 ${email.opened ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium">{email.template}</p>
                    <p className="text-sm text-muted-foreground">À: {email.recipient}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{email.sentAt}</p>
                  <Badge variant={email.opened ? 'default' : 'secondary'}>
                    {email.opened ? 'Ouvert' : 'Non ouvert'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailCampaigns;
