import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
  Send,
  Mail,
  Users,
  EyeOff,
  X,
  ShieldCheck,
  UserCircle2,
  Reply,
  ArrowLeft,
} from 'lucide-react';

import {
  GatewayMessage,
  useGatewayMessages,
} from '@/hooks/useGatewayMessages';

import {
  useBibContacts,
  useCurrentBibContact,
  BibContact,
} from '@/hooks/useBibContacts';

const splitEmails = (s: string) =>
  s
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);

export type GatewayComposePrefill = {
  to?: string;
  recipientName?: string;
  subject?: string;
  message?: string;
};

export type GatewayReplyPrefill = {
  mode: 'reply';
  message: GatewayMessage;
};

type GatewayComposeState =
  | GatewayComposePrefill
  | GatewayReplyPrefill;

interface ContactAutocompleteProps {
  value: string;
  onChange: (email: string, name?: string) => void;
  contacts: BibContact[];
  placeholder?: string;
  type?: string;
}

const ContactAutocomplete = ({
  value,
  onChange,
  contacts,
  placeholder,
  type = 'email',
}: ContactAutocompleteProps) => {
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const v = value.trim().toLowerCase();

    if (!v) {
      return [];
    }

    return contacts
      .filter(
        (c) =>
          c.email.toLowerCase().includes(v) ||
          c.fullName.toLowerCase().includes(v) ||
          c.positionLabel.toLowerCase().includes(v),
      )
      .slice(0, 6);
  }, [value, contacts]);

  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() =>
          setTimeout(() => setOpen(false), 150)
        }
      />

      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(c.email, c.fullName);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 border-b border-border px-3 py-2 text-left transition-colors last:border-0 hover:bg-muted"
            >
              <UserCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {c.fullName}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {c.email}
                </p>

                {c.positionLabel && (
                  <p className="truncate text-xs text-primary">
                    {c.positionLabel}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function GatewayCompose() {
  const location = useLocation();
  const navigate = useNavigate();

  const state =
    (location.state as GatewayComposeState | null) ?? null;

  const isReply =
    state?.mode === 'reply';

  const replyMessage =
    isReply ? state.message : null;

  const normalPrefill =
    !isReply ? (state as GatewayComposePrefill | null) : null;

  const { sendOutbound, sendReply } =
    useGatewayMessages();

  const { data: contacts = [] } =
    useBibContacts();

  const { data: me } =
    useCurrentBibContact();

  const [to, setTo] = useState(
    isReply
      ? replyMessage?.sender_email ?? ''
      : normalPrefill?.to ?? '',
  );

  const [recipientName, setRecipientName] =
    useState(
      isReply
        ? replyMessage?.sender_name ?? ''
        : normalPrefill?.recipientName ?? '',
    );

  const [ccInput, setCcInput] =
    useState('');

  const [bccInput, setBccInput] =
    useState('');

  const [showCc, setShowCc] =
    useState(false);

  const [showBcc, setShowBcc] =
    useState(false);

  const [subject, setSubject] =
    useState(
      isReply
        ? `Re: ${replyMessage?.subject ?? ''}`
        : normalPrefill?.subject ?? '',
    );

  const [message, setMessage] =
    useState(
      isReply
        ? ''
        : normalPrefill?.message ?? '',
    );

  const cc = splitEmails(ccInput);
  const bcc = splitEmails(bccInput);

  const totalRecipients =
    (to ? 1 : 0) +
    cc.length +
    bcc.length;

  const isSending =
    sendOutbound.isPending ||
    sendReply.isPending;

  const handleSend = async () => {
    if (isReply && replyMessage) {
      await sendReply.mutateAsync({
        msg: replyMessage,
        response: message,
      });
    } else {
      await sendOutbound.mutateAsync({
        to: to.trim(),
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        recipientName:
          recipientName.trim() || undefined,
        subject: subject.trim(),
        message,
      });
    }

    if (isReply && replyMessage) {
      navigate(
        `/modules/gateway/message/${replyMessage.id}`,
        {
          replace: true,
        },
      );
      return;
    }

    setTo('');
    setRecipientName('');
    setCcInput('');
    setBccInput('');
    setSubject('');
    setMessage('');
    setShowCc(false);
    setShowBcc(false);
  };

  const handleClear = () => {
    if (isReply && replyMessage) {
      setMessage('');
      return;
    }

    setTo('');
    setRecipientName('');
    setCcInput('');
    setBccInput('');
    setSubject('');
    setMessage('');
    setShowCc(false);
    setShowBcc(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start gap-3">
        {isReply && replyMessage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                `/modules/gateway/message/${replyMessage.id}`,
              )
            }
            className="mt-1 gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {isReply ? (
              <Reply className="h-6 w-6 text-primary" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}

            {isReply
              ? 'Répondre au message'
              : 'Composer & envoyer'}
          </h1>

          <p className="text-muted-foreground">
            Envoi sortant via{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              notify.brand-in-a-box.space
            </code>
          </p>
        </div>
      </div>

      {isReply && replyMessage && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-2 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <Reply className="h-5 w-5 text-primary" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Réponse au message entrant
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {replyMessage.sender_name
                    ? `${replyMessage.sender_name} · `
                    : ''}
                  {replyMessage.sender_email}
                </p>
              </div>

              <Badge
                variant="outline"
                className="shrink-0 text-xs"
              >
                Réponse
              </Badge>
            </div>

            <div className="rounded-md border border-border bg-background/70 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Message original
              </p>

              <p className="mt-1 text-sm font-medium">
                {replyMessage.subject}
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {replyMessage.content}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isReply && normalPrefill?.to && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 pb-4 pt-4">
            <Mail className="h-5 w-5 text-primary" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Contact ouvert depuis le module Marketplace
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {normalPrefill.recipientName
                  ? `${normalPrefill.recipientName} · `
                  : ''}
                {normalPrefill.to}
              </p>
            </div>

            <Badge
              variant="outline"
              className="shrink-0 text-xs"
            >
              Prérempli
            </Badge>
          </CardContent>
        </Card>
      )}

      {me && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 pb-4 pt-4">
            <UserCircle2 className="h-8 w-8 text-primary" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Expéditeur : {me.fullName}
              </p>

              <p className="text-xs text-muted-foreground">
                {me.positionLabel || 'Poste non défini'} ·{' '}
                {me.email}
              </p>
            </div>

            <Badge
              variant="outline"
              className="text-xs"
            >
              Signature automatique
            </Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isReply ? (
              <Reply className="h-5 w-5" />
            ) : (
              <Mail className="h-5 w-5" />
            )}

            {isReply
              ? 'Réponse'
              : 'Nouveau message sortant'}
          </CardTitle>

          {totalRecipients > 0 && (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <Users className="h-3 w-3" />

              {totalRecipients}{' '}
              destinataire
              {totalRecipients > 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Destinataire (À) *</Label>

              <ContactAutocomplete
                value={to}
                onChange={(email, name) => {
                  setTo(email);

                  if (name) {
                    setRecipientName(name);
                  }
                }}
                contacts={contacts}
                placeholder="contact@exemple.com ou nom B.I.B…"
              />
            </div>

            <div>
              <Label>Nom du destinataire</Label>

              <Input
                value={recipientName}
                onChange={(e) =>
                  setRecipientName(e.target.value)
                }
                placeholder="Marie Dupont"
              />
            </div>
          </div>

          {!isReply && (
            <>
              <div className="flex gap-2 text-xs">
                {!showCc && (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowCc(true)}
                  >
                    + Ajouter Cc
                  </button>
                )}

                {!showBcc && (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowBcc(true)}
                  >
                    + Ajouter Cci
                  </button>
                )}
              </div>

              {showCc && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Cc (visible par tous)
                    </Label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCc(false);
                        setCcInput('');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Input
                    value={ccInput}
                    onChange={(e) =>
                      setCcInput(e.target.value)
                    }
                    placeholder="email1@x.com, email2@x.com"
                  />

                  {cc.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cc.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="text-xs"
                        >
                          {email}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showBcc && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5" />
                      Cci (copie cachée)
                    </Label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowBcc(false);
                        setBccInput('');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Input
                    value={bccInput}
                    onChange={(e) =>
                      setBccInput(e.target.value)
                    }
                    placeholder="caché1@x.com, caché2@x.com"
                  />

                  {bcc.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bcc.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="text-xs"
                        >
                          {email}
                          <EyeOff className="ml-1 h-2.5 w-2.5" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    Les Cci ne sont visibles ni par le
                    destinataire principal ni par les Cc.
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <Label>Objet *</Label>

            <Input
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              readOnly={isReply}
              className={
                isReply
                  ? 'bg-muted/40'
                  : undefined
              }
            />
          </div>

          <div>
            <Label>
              {isReply
                ? 'Votre réponse *'
                : 'Message *'}
            </Label>

            <Textarea
              rows={10}
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder={
                isReply
                  ? 'Rédigez votre réponse…'
                  : 'Rédigez votre message…'
              }
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">
                  Conformité RGPD automatique :
                </strong>
              </p>

              <ul className="list-inside list-disc space-y-0.5">
                <li>
                  Signature avec votre nom et poste B.I.B
                </li>
                <li>
                  Pied de page légal (Art. 6.1.b/f RGPD,
                  conservation 36 mois, hébergement UE)
                </li>
                <li>
                  Lien de désinscription RFC 8058 et contact DPO
                </li>
                <li>
                  Chaque envoi est tracé dans le journal de traçabilité
                </li>
                <li>
                  Statut de livraison réel suivi
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClear}
            >
              {isReply ? 'Effacer' : 'Vider'}
            </Button>

            <Button
              onClick={handleSend}
              disabled={
                !to.trim() ||
                !subject.trim() ||
                !message.trim() ||
                isSending
              }
              className="gap-2"
            >
              {isReply ? (
                <Reply className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {isSending
                ? 'Envoi…'
                : isReply
                  ? 'Envoyer la réponse'
                  : `Envoyer${
                      totalRecipients > 1
                        ? ` à ${totalRecipients}`
                        : ''
                    }`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
