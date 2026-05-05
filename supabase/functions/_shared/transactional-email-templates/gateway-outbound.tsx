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
  sentBy?: string
  ccList?: string[]
}

const BRAND_NAVY = '#0a1024'
const BRAND_TEXT = '#1a1f2e'
const BRAND_MUTED = '#6b7280'

const GatewayOutbound = ({ senderName = '', subject = '', message = '', messageRef = '', sentBy = '', ccList = [] }: Props) => (
  <Html>
    <Head />
    <Preview>{subject || 'Message — B.I.B Intranet'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0 }}>
      <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0' }}>
        <Section style={{ background: BRAND_NAVY, padding: '28px 32px', textAlign: 'center' as const }}>
          <table style={{ margin: '0 auto' }}><tbody><tr>
            <td style={{ background: '#ffffff', color: BRAND_NAVY, fontWeight: 700, fontSize: '16px', padding: '6px 12px', borderRadius: '6px', letterSpacing: '0.5px' }}>B.I.B</td>
            <td style={{ paddingLeft: '10px', color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>Intranet — Brand in a Box</td>
          </tr></tbody></table>
        </Section>

        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: BRAND_TEXT, fontSize: '20px', margin: '0 0 12px' }}>{subject}</Heading>
          <Text style={{ color: BRAND_TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
            Bonjour{senderName ? ` ${senderName}` : ''},
          </Text>

          <Section style={{ padding: '16px 18px', background: '#f4f5f9', borderRadius: '8px', borderLeft: `3px solid ${BRAND_NAVY}` }}>
            <Text style={{ color: BRAND_TEXT, fontSize: '14px', lineHeight: '22px', whiteSpace: 'pre-wrap', margin: 0 }}>{message}</Text>
          </Section>

          {ccList.length > 0 && (
            <Text style={{ color: BRAND_MUTED, fontSize: '11px', margin: '16px 0 0' }}>
              <strong>Cc :</strong> {ccList.join(', ')}
            </Text>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
          <Text style={{ margin: 0, fontSize: '13px', color: BRAND_TEXT }}>
            Cordialement,<br />
            <strong>{sentBy || "L'équipe B.I.B"}</strong><br />
            <span style={{ color: BRAND_MUTED, fontSize: '12px' }}>Brand in a Box · B.I.B Intranet</span>
          </Text>
          <Text style={{ color: BRAND_MUTED, fontSize: '11px', marginTop: '20px', fontFamily: 'monospace' }}>Réf : {messageRef}</Text>
        </Section>

        <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />
        <Section style={{ padding: '20px 32px 28px' }}>
          <Text style={{ color: BRAND_MUTED, fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            <strong style={{ color: BRAND_TEXT }}>Confidentialité & RGPD</strong><br />
            Email émis par Brand in a Box dans le cadre de nos relations professionnelles
            (base légale : Art. 6.1.b / 6.1.f RGPD). Données conservées 36 mois maximum, hébergées dans l'UE,
            jamais cédées à des tiers. Droits d'accès, rectification, effacement, limitation, opposition et portabilité
            (Art. 15 à 21 RGPD) — <a href="mailto:dpo@brand-in-a-box.space" style={{ color: BRAND_NAVY }}>dpo@brand-in-a-box.space</a>.
            Réclamation : CNIL (www.cnil.fr).
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
  component: GatewayOutbound,
  displayName: 'Gateway — Envoi sortant',
  subject: (d: Props) => d.subject || 'Message B.I.B Intranet',
  previewData: { senderName: 'Marie', subject: 'Information importante', message: 'Bonjour…', messageRef: 'GW-OUT-101', sentBy: 'Pierre Moreau', ccList: ['team@example.com'] },
} satisfies TemplateEntry
