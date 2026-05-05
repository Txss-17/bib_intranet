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
  respondedBy?: string
}

const NAVY = '#0a1024'
const GOLD = '#c9a961'
const TEXT = '#1a1f2e'
const MUTED = '#6b7280'
const LOGO_URL = 'https://workspace.brand-in-a-box.space/brand/bib-logo.jpg'

const GatewayReply = ({ senderName = '', subject = '', message = '', messageRef = '', respondedBy = '' }: Props) => (
  <Html>
    <Head />
    <Preview>Réponse à votre message — {subject}</Preview>
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
          <Heading style={{ color: TEXT, fontSize: '22px', margin: '0 0 12px', fontWeight: 700 }}>
            Réponse à votre message
          </Heading>
          <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 4px' }}>
            Bonjour{senderName ? ` ${senderName}` : ''},
          </Text>
          <Text style={{ color: MUTED, fontSize: '13px', fontStyle: 'italic', margin: '0 0 18px' }}>
            En réponse à : « {subject} »
          </Text>

          <Section style={{ padding: '18px 20px', background: '#fafaf7', borderRadius: '6px', borderLeft: `3px solid ${GOLD}` }}>
            <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '23px', whiteSpace: 'pre-wrap', margin: 0 }}>
              {message}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0 14px' }} />
          <Text style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: '20px' }}>
            Cordialement,<br />
            <strong>{respondedBy || "L'équipe B.I.B"}</strong><br />
            <span style={{ color: MUTED, fontSize: '12px' }}>Brand in a Box · B.I.B Intranet</span>
          </Text>

          <Text style={{ color: MUTED, fontSize: '11px', marginTop: '20px', fontFamily: 'monospace' }}>
            Réf : {messageRef}
          </Text>
        </Section>

        <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />
        <Section style={{ padding: '20px 32px 28px' }}>
          <Text style={{ color: MUTED, fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            <strong style={{ color: TEXT }}>Confidentialité & RGPD.</strong>{' '}
            Cet échange est traité par <strong>Brand in a Box</strong> aux fins de réponse à votre demande
            (Art. 6.1.a / 6.1.b RGPD). Conservation 36 mois maximum, hébergement UE, aucun transfert tiers.
            Droits d'accès, rectification, effacement, limitation, opposition et portabilité (Art. 15 à 21 RGPD) :{' '}
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
  component: GatewayReply,
  displayName: 'Gateway — Réponse',
  subject: (d: Props) => `Re: ${d.subject || ''}`,
  previewData: {
    senderName: 'Marie', subject: 'Demande de partenariat',
    message: 'Bonjour, merci pour votre message...', messageRef: 'GW-2025-101', respondedBy: 'Pierre Moreau',
  },
} satisfies TemplateEntry
