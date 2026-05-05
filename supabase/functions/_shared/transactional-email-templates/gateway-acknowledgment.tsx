/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  senderName?: string
  subject?: string
  messageRef?: string
}

const BRAND_NAVY = '#0a1024'
const BRAND_TEXT = '#1a1f2e'
const BRAND_MUTED = '#6b7280'

const GatewayAck = ({ senderName = '', subject = '', messageRef = '' }: Props) => (
  <Html>
    <Head />
    <Preview>Accusé de réception — B.I.B Intranet</Preview>
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
          <Heading style={{ color: BRAND_TEXT, fontSize: '20px', margin: '0 0 16px' }}>
            Votre message a bien été reçu
          </Heading>
          <Text style={{ color: BRAND_TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 12px' }}>
            Bonjour{senderName ? ` ${senderName}` : ''},
          </Text>
          <Text style={{ color: BRAND_TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
            Nous accusons réception de votre message « <strong>{subject}</strong> ». 
            Notre équipe l'examinera dans les meilleurs délais et vous répondra par email.
          </Text>

          <Section style={{ marginTop: '20px', padding: '14px 16px', background: '#f4f5f9', borderRadius: '8px', borderLeft: `3px solid ${BRAND_NAVY}` }}>
            <Text style={{ margin: 0, fontSize: '12px', color: BRAND_MUTED }}>
              Référence du message
            </Text>
            <Text style={{ margin: '4px 0 0', fontSize: '14px', color: BRAND_TEXT, fontFamily: 'monospace', fontWeight: 600 }}>
              {messageRef}
            </Text>
          </Section>

          <Text style={{ color: BRAND_MUTED, fontSize: '12px', marginTop: '24px' }}>
            Cet email confirme la prise en compte de votre demande. Merci de conserver la référence ci-dessus pour tout suivi.
          </Text>
        </Section>

        {/* RGPD Footer */}
        <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />
        <Section style={{ padding: '20px 32px 28px' }}>
          <Text style={{ color: BRAND_MUTED, fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            <strong style={{ color: BRAND_TEXT }}>Confidentialité & RGPD</strong><br />
            Vos données (email, nom, contenu du message) sont traitées par Brand in a Box uniquement aux fins
            de traitement de votre demande, sur la base de votre consentement (Art. 6.1.a RGPD). Elles sont
            conservées 36 mois maximum, hébergées dans l'Union européenne et ne sont jamais cédées à des tiers.
            Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition
            (Art. 15 à 21 RGPD) en écrivant à <a href="mailto:dpo@brand-in-a-box.space" style={{ color: BRAND_NAVY }}>dpo@brand-in-a-box.space</a>.
          </Text>
          <Text style={{ color: BRAND_MUTED, fontSize: '11px', margin: '12px 0 0' }}>
            B.I.B Intranet · Brand in a Box · notify.brand-in-a-box.space
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GatewayAck,
  displayName: 'Gateway — Accusé de réception',
  subject: (d: Props) => `Bien reçu : ${d.subject || 'votre message'}`,
  previewData: { senderName: 'Marie', subject: 'Demande de partenariat', messageRef: 'GW-2025-101' },
} satisfies TemplateEntry
