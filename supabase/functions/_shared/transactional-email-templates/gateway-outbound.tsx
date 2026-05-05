/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  senderName?: string
  subject?: string
  message?: string
  messageRef?: string
  sentBy?: string
  sentByName?: string
  sentByPosition?: string
  ccList?: string[]
}

const NAVY = '#0a1024'
const GOLD = '#c9a961'
const TEXT = '#1a1f2e'
const MUTED = '#6b7280'
const LOGO_URL = 'https://workspace.brand-in-a-box.space/brand/bib-logo.jpg'

const GatewayOutbound = ({ senderName = '', subject = '', message = '', messageRef = '', sentBy = '', sentByName = '', sentByPosition = '', ccList = [] }: Props) => (
  <Html>
    <Head />
    <Preview>{subject || 'Message — B.I.B Intranet'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0 }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', padding: 0, border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: NAVY, padding: '24px 32px', textAlign: 'center' as const }}>
          <Img src={LOGO_URL} alt="Brand in a Box" width="180" height="auto" style={{ margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} />
          <Text style={{ color: GOLD, fontSize: '11px', letterSpacing: '2px', margin: '8px 0 0', textTransform: 'uppercase' as const, fontWeight: 600 }}>
            Intranet
          </Text>
        </Section>

        <Section style={{ padding: '32px' }}>
          <div style={{ width: '40px', height: '3px', background: GOLD, marginBottom: '20px' }} />
          <Heading style={{ color: TEXT, fontSize: '22px', margin: '0 0 12px', fontWeight: 700 }}>{subject}</Heading>
          <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
            Bonjour{senderName ? ` ${senderName}` : ''},
          </Text>

          <Section style={{ padding: '18px 20px', background: '#fafaf7', borderRadius: '6px', borderLeft: `3px solid ${GOLD}` }}>
            <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '23px', whiteSpace: 'pre-wrap', margin: 0 }}>{message}</Text>
          </Section>

          {ccList.length > 0 && (
            <Text style={{ color: MUTED, fontSize: '11px', margin: '16px 0 0' }}>
              <strong>Cc :</strong> {ccList.join(', ')}
            </Text>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0 14px' }} />
          <Text style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: '20px' }}>
            Cordialement,<br />
            <strong>{sentByName || sentBy || "L'équipe B.I.B"}</strong>
            {sentByPosition ? <><br /><span style={{ color: MUTED, fontSize: '12px' }}>{sentByPosition}</span></> : null}
            <br />
            <span style={{ color: MUTED, fontSize: '12px' }}>Brand in a Box · B.I.B Intranet{sentBy ? ` · ${sentBy}` : ''}</span>
          </Text>
          <Text style={{ color: MUTED, fontSize: '11px', marginTop: '20px', fontFamily: 'monospace' }}>Réf : {messageRef}</Text>
        </Section>

        <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />
        <Section style={{ padding: '20px 32px 28px' }}>
          <Text style={{ color: MUTED, fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            <strong style={{ color: TEXT }}>Confidentialité & RGPD.</strong>{' '}
            Email émis par <strong>Brand in a Box</strong> dans le cadre de nos relations professionnelles
            (Art. 6.1.b / 6.1.f RGPD). Conservation 36 mois maximum, hébergement UE, aucun transfert tiers.
            Droits Art. 15 à 21 RGPD :{' '}
            <a href="mailto:dpo@brand-in-a-box.space" style={{ color: NAVY, fontWeight: 600 }}>dpo@brand-in-a-box.space</a>.
            Réclamation : CNIL (www.cnil.fr).
          </Text>
          <Text style={{ color: MUTED, fontSize: '11px', margin: '12px 0 0', textAlign: 'center' as const }}>
            © Brand in a Box · B.I.B Intranet · notify.brand-in-a-box.space
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GatewayOutbound,
  displayName: 'Gateway — Envoi sortant',
  subject: (d: Props) => d.subject || 'Message B.I.B Intranet',
  previewData: { senderName: 'Marie', subject: 'Information importante', message: 'Bonjour…', messageRef: 'GW-OUT-101', sentBy: 'Pierre Moreau', ccList: ['team@example.com'] },
} satisfies TemplateEntry
