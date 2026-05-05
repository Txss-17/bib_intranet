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

const GatewayReply = ({ senderName = '', subject = '', message = '', messageRef = '', respondedBy = '' }: Props) => (
  <Html>
    <Head />
    <Preview>Réponse à votre message — B.I.B Intranet</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }}>
      <Container style={{ padding: '32px', maxWidth: '560px' }}>
        <Heading style={{ color: '#0a0a0a', fontSize: '20px' }}>Réponse à votre message</Heading>
        <Text style={{ color: '#404040', fontSize: '14px', lineHeight: '22px' }}>
          Bonjour {senderName || ''},
        </Text>
        <Text style={{ color: '#404040', fontSize: '13px', fontStyle: 'italic' }}>
          Au sujet de : « {subject} »
        </Text>
        <Hr style={{ borderColor: '#e5e5e5', margin: '16px 0' }} />
        <Text style={{ color: '#0a0a0a', fontSize: '14px', lineHeight: '22px', whiteSpace: 'pre-wrap' }}>
          {message}
        </Text>
        <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0 12px' }} />
        <Section>
          <Text style={{ margin: 0, fontSize: '12px', color: '#737373' }}>
            Cordialement,<br />
            {respondedBy || 'L\'équipe B.I.B'}
          </Text>
        </Section>
        <Text style={{ color: '#a3a3a3', fontSize: '11px', marginTop: '24px' }}>
          Réf : {messageRef} — B.I.B Intranet
        </Text>
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
