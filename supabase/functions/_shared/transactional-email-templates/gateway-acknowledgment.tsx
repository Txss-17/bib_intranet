/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  senderName?: string
  subject?: string
  messageRef?: string
}

const NAVY = '#0a1024'
const GOLD = '#c9a961'
const TEXT = '#1a1f2e'
const MUTED = '#6b7280'
const LOGO_URL = 'https://workspace.brand-in-a-box.space/brand/bib-logo.jpg'

const Header = () => (
  <Section style={{ background: NAVY, padding: '24px 32px', textAlign: 'center' as const }}>
    <Img src={LOGO_URL} alt="Brand in a Box" width="180" height="auto" style={{ margin: '0 auto', display: 'block', filter: 'brightness(0) invert(1)' }} />
    <Text style={{ color: GOLD, fontSize: '11px', letterSpacing: '2px', margin: '8px 0 0', textTransform: 'uppercase' as const, fontWeight: 600 }}>
      Intranet
    </Text>
  </Section>
)

const RgpdFooter = () => (
  <>
    <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px' }} />
    <Section style={{ padding: '20px 32px 28px' }}>
      <Text style={{ color: MUTED, fontSize: '11px', lineHeight: '16px', margin: 0 }}>
        <strong style={{ color: TEXT }}>Confidentialité & RGPD.</strong>{' '}
        Vos données (email, nom, contenu) sont traitées par <strong>Brand in a Box</strong> aux seules fins
        du traitement de votre demande, sur la base de votre consentement (Art. 6.1.a RGPD).
        Conservation 36 mois maximum, hébergement dans l'Union européenne, aucun transfert à des tiers.
        Droits d'accès, rectification, effacement, limitation, opposition et portabilité (Art. 15 à 21 RGPD) :{' '}
        <a href="mailto:dpo@brand-in-a-box.space" style={{ color: NAVY, fontWeight: 600 }}>dpo@brand-in-a-box.space</a>.
        Réclamation : CNIL (www.cnil.fr).
      </Text>
      <Text style={{ color: MUTED, fontSize: '11px', margin: '12px 0 0', textAlign: 'center' as const }}>
        © Brand in a Box · B.I.B Intranet · notify.brand-in-a-box.space
      </Text>
    </Section>
  </>
)

const GatewayAck = ({ senderName = '', subject = '', messageRef = '' }: Props) => (
  <Html>
    <Head />
    <Preview>Accusé de réception — votre message a bien été reçu</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0 }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', padding: 0, border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <Header />
        <Section style={{ padding: '32px' }}>
          <div style={{ width: '40px', height: '3px', background: GOLD, marginBottom: '20px' }} />
          <Heading style={{ color: TEXT, fontSize: '22px', margin: '0 0 16px', fontWeight: 700 }}>
            Votre message a bien été reçu
          </Heading>
          <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 12px' }}>
            Bonjour{senderName ? ` ${senderName}` : ''},
          </Text>
          <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 20px' }}>
            Nous accusons réception de votre message « <strong>{subject}</strong> ». Notre équipe l'examinera
            et vous répondra par email dans les meilleurs délais.
          </Text>

          <Section style={{ padding: '16px 18px', background: '#fafaf7', borderRadius: '6px', borderLeft: `3px solid ${GOLD}` }}>
            <Text style={{ margin: 0, fontSize: '11px', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600 }}>
              Référence du message
            </Text>
            <Text style={{ margin: '6px 0 0', fontSize: '15px', color: NAVY, fontFamily: 'monospace', fontWeight: 700 }}>
              {messageRef}
            </Text>
          </Section>

          <Text style={{ color: MUTED, fontSize: '12px', marginTop: '24px', lineHeight: '18px' }}>
            Conservez cette référence pour tout suivi ultérieur de votre demande.
          </Text>
        </Section>
        <RgpdFooter />
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
