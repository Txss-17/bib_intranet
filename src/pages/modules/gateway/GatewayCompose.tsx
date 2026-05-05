import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, Mail, Users, EyeOff, X, Inbox as InboxIcon } from 'lucide-react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';

type Mode = 'outbound' | 'inbound';

const splitEmails = (s: string) =>
  s.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);

export default function GatewayCompose() {
  const { sendOutbound, createMessage } = useGatewayMessages();
  const [mode, setMode] = useState<Mode>('outbound');

  // Outbound state
  const [to, setTo] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Inbound (manual entry) state
  const [iSender, setISender] = useState('');
  const [iSenderName, setISenderName] = useState('');
  const [iSubject, setISubject] = useState('');
  const [iContent, setIContent] = useState('');

  const cc = splitEmails(ccInput);
  const bcc = splitEmails(bccInput);
  const totalRecipients = (to ? 1 : 0) + cc.length + bcc.length;

  const handleSend = async () => {
    await sendOutbound.mutateAsync({
      to: to.trim(),
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      recipientName: recipientName || undefined,
      subject,
      message,
    });
    setTo(''); setRecipientName(''); setCcInput(''); setBccInput('');
    setSubject(''); setMessage(''); setShowCc(false); setShowBcc(false);
  };

  const handleSaveInbound = async () => {
    await createMessage.mutateAsync({
      sender_email: iSender,
      sender_name: iSenderName || undefined,
      subject: iSubject,
      content: iContent,
    });
    setISender(''); setISenderName(''); setISubject(''); setIContent('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Composer & envoyer</h1>
        <p className="text-muted-foreground">
          Envoi sortant via <code className="bg-muted px-1.5 py-0.5 rounded text-xs">notify.brand-in-a-box.space</code> — ou saisie manuelle d'un message entrant
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={mode === 'outbound' ? 'default' : 'outline'} onClick={() => setMode('outbound')} className="gap-2">
          <Send className="h-4 w-4" /> Envoi sortant
        </Button>
        <Button variant={mode === 'inbound' ? 'default' : 'outline'} onClick={() => setMode('inbound')} className="gap-2">
          <InboxIcon className="h-4 w-4" /> Saisir un message entrant
        </Button>
      </div>

      {mode === 'outbound' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Nouveau message sortant</CardTitle>
            {totalRecipients > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" /> {totalRecipients} destinataire{totalRecipients > 1 ? 's' : ''}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Destinataire (À) *</Label>
                <Input type="email" placeholder="contact@exemple.com" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div>
                <Label>Nom du destinataire</Label>
                <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Marie Dupont" />
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              {!showCc && <button type="button" className="text-primary hover:underline" onClick={() => setShowCc(true)}>+ Ajouter Cc</button>}
              {!showBcc && <button type="button" className="text-primary hover:underline" onClick={() => setShowBcc(true)}>+ Ajouter Cci</button>}
            </div>

            {showCc && (
              <div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Cc (visible)</Label>
                  <button type="button" onClick={() => { setShowCc(false); setCcInput(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
                <Input value={ccInput} onChange={e => setCcInput(e.target.value)} placeholder="email1@x.com, email2@x.com" />
                {cc.length > 0 && <p className="text-xs text-muted-foreground mt-1">{cc.length} adresse(s) en copie</p>}
              </div>
            )}

            {showBcc && (
              <div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Cci (copie cachée)</Label>
                  <button type="button" onClick={() => { setShowBcc(false); setBccInput(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
                <Input value={bccInput} onChange={e => setBccInput(e.target.value)} placeholder="caché1@x.com, caché2@x.com" />
                {bcc.length > 0 && <p className="text-xs text-muted-foreground mt-1">{bcc.length} adresse(s) en copie cachée</p>}
              </div>
            )}

            <div>
              <Label>Objet *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea rows={10} value={message} onChange={e => setMessage(e.target.value)} placeholder="Rédigez votre message…" />
              <p className="text-xs text-muted-foreground mt-1">
                Le pied de page RGPD et le lien de désinscription sont ajoutés automatiquement.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setTo(''); setSubject(''); setMessage(''); setCcInput(''); setBccInput(''); }}>
                Vider
              </Button>
              <Button
                onClick={handleSend}
                disabled={!to || !subject || !message || sendOutbound.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {sendOutbound.isPending ? 'Envoi…' : `Envoyer${totalRecipients > 1 ? ` à ${totalRecipients}` : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Saisir un message entrant</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Email expéditeur *</Label><Input type="email" value={iSender} onChange={e => setISender(e.target.value)} /></div>
              <div><Label>Nom expéditeur</Label><Input value={iSenderName} onChange={e => setISenderName(e.target.value)} /></div>
            </div>
            <div><Label>Objet *</Label><Input value={iSubject} onChange={e => setISubject(e.target.value)} /></div>
            <div><Label>Contenu *</Label><Textarea rows={8} value={iContent} onChange={e => setIContent(e.target.value)} /></div>
            <div className="flex justify-end">
              <Button onClick={handleSaveInbound} disabled={!iSender || !iSubject || !iContent || createMessage.isPending} className="gap-2">
                <Plus className="h-4 w-4" />
                {createMessage.isPending ? 'Enregistrement…' : 'Enregistrer & accuser réception'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
