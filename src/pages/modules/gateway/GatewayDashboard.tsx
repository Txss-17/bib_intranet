import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Mail, Send, CheckCheck, ArrowRight } from 'lucide-react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';
import { Link } from 'react-router-dom';

export default function GatewayDashboard() {
  const { data: messages = [], isLoading } = useGatewayMessages();

  const pending = messages.filter(m => m.status === 'pending').length;
  const validated = messages.filter(m => m.status === 'validated').length;
  const routed = messages.filter(m => m.status === 'routed').length;
  const responded = messages.filter(m => m.status === 'responded').length;

  const kpis = [
    { label: 'À valider', value: pending, icon: Mail, color: 'text-destructive', bg: 'bg-destructive/10', to: '/modules/gateway/validation' },
    { label: 'À router', value: validated, icon: ArrowRight, color: 'text-yellow-600', bg: 'bg-yellow-500/10', to: '/modules/gateway/routing' },
    { label: 'À répondre', value: routed, icon: Send, color: 'text-primary', bg: 'bg-primary/10', to: '/modules/gateway/responses' },
    { label: 'Répondus', value: responded, icon: CheckCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10', to: '/modules/gateway/responses' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Gateways & Messages</h1>
        <p className="text-muted-foreground">Réception, validation, routage et réponse — connecté à notify.brand-in-a-box.space</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Link key={k.label} to={k.to}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${k.color}`}>{isLoading ? '…' : k.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <h2 className="font-semibold">Flux Gateway</h2>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li><strong>Réception</strong> — Saisir un message entrant ou recevoir via webhook public. Un accusé de réception est envoyé automatiquement.</li>
            <li><strong>Validation</strong> — Approuver ou rejeter, avec notes.</li>
            <li><strong>Routage</strong> — Attribuer à un pôle.</li>
            <li><strong>Réponse</strong> — Rédiger et envoyer la réponse par email au destinataire.</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-2">
            Webhook entrant : <code className="bg-muted px-1.5 py-0.5 rounded">POST /functions/v1/gateway-inbound-email</code> — JSON {`{ sender_email, sender_name, subject, content }`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold mb-3">Derniers messages</h2>
          {messages.slice(0, 8).map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{m.subject}</p>
                <p className="text-xs text-muted-foreground">{m.sender_email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
