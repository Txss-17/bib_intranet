/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  senderName?: string
  subject?: string
  message?: string
  messageRef?: string
  respondedBy?: string
}

const BRAND_NAVY = '#0a1024'
const BRAND_TEXT = '#1a1f2e'
const BRAND_MUTED = '#6b7280'

const GatewayReply = ({ senderName = '', subject = '', message = '', messageRef = '', respondedBy = '' }: Props) => (
  <Html>
    <Head />
    <Preview>Réponse à votre message — B.I.B Intranet</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0 }}>
      <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0' }}>
        {/* Header */}
        <Section style={{ background: BRAND_NAVY, padding: '28px 32px', textAlign: 'center' as const }}>
          <table style={{ margin: '0 auto' }}><tbody><tr>
            <td style={{
              background: '#ffffff', color: BRAND_NAVY, fontWeight: 700, fontSize: '16px',
              padding: '6px 12px', borderRadius: '6px', letterSpacing: '0.5px',
            }}>B.I.B</td>
            <td style={{ paddingLeft: '10px', color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>
              Intranet — Brand in a Box
            </td>
          </tr></tbody></table>
        </Section>

        {/* Body */}
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: BRAND_TEXT, fontSize: '20px', margin: '0 0 12px' }}>
            Réponse à votre message
          </Heading>
          <Text style={{ color: BRAND_TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 6px' }}>
            Bonjour{senderName ? ` ${senderName}` : ''},
          </Text>
          <Text style={{ color: BRAND_MUTED, fontSize: '13px', fontStyle: 'italic', margin: '0 0 16px' }}>
            En réponse à : « {subject} »
          </Text>

          <Section style={{ padding: '16px 18px', background: '#f4f5f9', borderRadius: '8px', borderLeft: `3px solid ${BRAND_NAVY}` }}>
            <Text style={{ color: BRAND_TEXT, fontSize: '14px', lineHeight: '22px', whiteSpace: 'pre-wrap', margin: 0 }}>
              {message}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ margin: 0, fontSize: '13px', color: BRAND_TEXT }}>
            Cordialement,<br />
            <strong>{respondedBy || "L'équipe B.I.B"}</strong><br />
            <span style={{ color: BRAND_MUTED, fontSize: '12px' }}>Brand in a Box · B.I.B Intranet</span>
          </Text>

          <Text style={{ color: BRAND_MUTED, fontSize: '11px', marginTop: '20px', fontFamily: 'monospace' }}>
            Réf : {messageRef}
          </Text>
        </Section>

        {/* RGPD Footer */}
        <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />
        <Section style={{ padding: '20px 32px 28px' }}>
          <Text style={{ color: BRAND_MUTED, fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            <strong style={{ color: BRAND_TEXT }}>Confidentialité & RGPD</strong><br />
            Cet échange est traité par Brand in a Box uniquement pour répondre à votre demande
            (base légale : Art. 6.1.a / 6.1.b RGPD). Données conservées 36 mois maximum, hébergées dans l'UE.
            Vous disposez d'un droit d'accès, rectification, effacement, limitation, opposition et portabilité
            (Art. 15 à 21 RGPD) — contactez <a href="mailto:dpo@brand-in-a-box.space" style={{ color: BRAND_NAVY }}>dpo@brand-in-a-box.space</a>.
            Réclamation possible auprès de la CNIL (www.cnil.fr).
          </Text>
          <Text style={{ color: BRAND_MUTED, fontSize: '11px', margin: '12px 0 0' }}>
            B.I.B Intranet · notify.brand-in-a-box.space
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
