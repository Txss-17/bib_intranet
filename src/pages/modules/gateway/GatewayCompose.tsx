import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, Mail, Users, EyeOff, X, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';
import { useBibContacts, useCurrentBibContact, BibContact } from '@/hooks/useBibContacts';

const splitEmails = (s: string) =>
  s.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);

interface ContactAutocompleteProps {
  value: string;
  onChange: (email: string, name?: string) => void;
  contacts: BibContact[];
  placeholder?: string;
  type?: string;
}

const ContactAutocomplete = ({ value, onChange, contacts, placeholder, type = 'email' }: ContactAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const v = value.trim().toLowerCase();
    if (!v || v.length < 1) return [];
    return contacts
      .filter(c =>
        c.email.toLowerCase().includes(v) ||
        c.fullName.toLowerCase().includes(v) ||
        c.positionLabel.toLowerCase().includes(v)
      )
      .slice(0, 6);
  }, [value, contacts]);

  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-72 overflow-y-auto">
          {matches.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(c.email, c.fullName); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-start gap-2 transition-colors border-b border-border last:border-0"
            >
              <UserCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{c.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                {c.positionLabel && <p className="text-xs text-primary truncate">{c.positionLabel}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function GatewayCompose() {
  const { sendOutbound } = useGatewayMessages();
  const { data: contacts = [] } = useBibContacts();
  const { data: me } = useCurrentBibContact();

  const [to, setTo] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Composer & envoyer</h1>
        <p className="text-muted-foreground">
          Envoi sortant via <code className="bg-muted px-1.5 py-0.5 rounded text-xs">notify.brand-in-a-box.space</code>
        </p>
      </div>

      {me && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Expéditeur : {me.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {me.positionLabel || 'Poste non défini'} · {me.email}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">Signature automatique</Badge>
          </CardContent>
        </Card>
      )}

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
              <ContactAutocomplete
                value={to}
                onChange={(email, name) => { setTo(email); if (name) setRecipientName(name); }}
                contacts={contacts}
                placeholder="contact@exemple.com ou nom B.I.B…"
              />
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
                <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Cc (visible par tous)</Label>
                <button type="button" onClick={() => { setShowCc(false); setCcInput(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
              <Input value={ccInput} onChange={e => setCcInput(e.target.value)} placeholder="email1@x.com, email2@x.com" />
              {cc.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {cc.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                </div>
              )}
            </div>
          )}

          {showBcc && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Cci (copie cachée)</Label>
                <button type="button" onClick={() => { setShowBcc(false); setBccInput(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
              <Input value={bccInput} onChange={e => setBccInput(e.target.value)} placeholder="caché1@x.com, caché2@x.com" />
              {bcc.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {bcc.map(e => <Badge key={e} variant="secondary" className="text-xs">{e} <EyeOff className="h-2.5 w-2.5 ml-1" /></Badge>)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Les Cci ne sont visibles ni par le destinataire principal ni par les Cc.
              </p>
            </div>
          )}

          <div>
            <Label>Objet *</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          <div>
            <Label>Message *</Label>
            <Textarea rows={10} value={message} onChange={e => setMessage(e.target.value)} placeholder="Rédigez votre message…" />
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-md border border-border">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Conformité RGPD automatique :</strong></p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Signature avec votre nom et poste B.I.B</li>
                <li>Pied de page légal (Art. 6.1.b/f RGPD, conservation 36 mois, hébergement UE)</li>
                <li>Lien de désinscription RFC 8058 et contact DPO</li>
                <li>Chaque envoi est tracé dans le journal de traçabilité</li>
                <li>Statut de livraison réel suivi (envoyé / bounce / supprimé)</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setTo(''); setSubject(''); setMessage(''); setCcInput(''); setBccInput(''); setRecipientName(''); }}>
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
    </div>
  );
}
