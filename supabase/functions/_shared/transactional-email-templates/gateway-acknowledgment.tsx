/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  senderName?: string
  subject?: string
  messageRef?: string
}

const GatewayAck = ({ senderName = '', subject = '', messageRef = '' }: Props) => (
  <Html>
    <Head />
    <Preview>Nous avons bien reçu votre message — B.I.B Intranet</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }}>
      <Container style={{ padding: '32px', maxWidth: '560px' }}>
        <Heading style={{ color: '#0a0a0a', fontSize: '20px' }}>Message bien reçu</Heading>
        <Text style={{ color: '#404040', fontSize: '14px', lineHeight: '22px' }}>
          Bonjour {senderName || ''},<br /><br />
          Nous avons bien reçu votre message « {subject} ». Notre équipe va l'examiner et vous répondra dans les meilleurs délais.
        </Text>
        <Section style={{ marginTop: '24px', padding: '12px 16px', background: '#f5f5f5', borderRadius: '6px' }}>
          <Text style={{ margin: 0, fontSize: '12px', color: '#737373' }}>
            Référence : <strong>{messageRef}</strong>
          </Text>
        </Section>
        <Text style={{ color: '#737373', fontSize: '12px', marginTop: '24px' }}>
          B.I.B Intranet — Brand in a Box
        </Text>
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
