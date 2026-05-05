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
  sentByName?: string
  sentByPosition?: string
  ccList?: string[]
}

const TEXT = '#1a1f2e'
const MUTED = '#6b7280'

const GatewayOutbound = ({ senderName = '', message = '', messageRef = '', sentBy = '', sentByName = '', sentByPosition = '', ccList = [] }: Props) => (
  <Html>
    <Head />
    <Preview>{message ? message.slice(0, 90) : 'Message B.I.B'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '22px', margin: '0 0 12px' }}>
          Bonjour{senderName ? ` ${senderName}` : ''},
        </Text>

        <Text style={{ color: TEXT, fontSize: '14px', lineHeight: '22px', whiteSpace: 'pre-wrap', margin: '0 0 20px' }}>
          {message}
        </Text>

        <Text style={{ margin: '20px 0 0', fontSize: '13px', color: TEXT, lineHeight: '20px' }}>
          Cordialement,<br />
          {sentByName || sentBy || "L'équipe B.I.B"}
          {sentByPosition ? <><br /><span style={{ color: MUTED, fontSize: '12px' }}>{sentByPosition}</span></> : null}
          <br />
          <span style={{ color: MUTED, fontSize: '12px' }}>Brand in a Box · B.I.B Intranet</span>
        </Text>

        {ccList.length > 0 && (
          <Text style={{ color: MUTED, fontSize: '11px', margin: '14px 0 0' }}>
            Cc : {ccList.join(', ')}
          </Text>
        )}

        <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 10px' }} />
        <Text style={{ color: MUTED, fontSize: '11px', margin: 0 }}>
          Réf : {messageRef} — Pour toute question : <a href="mailto:contact@brand-in-a-box.space" style={{ color: MUTED }}>contact@brand-in-a-box.space</a>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GatewayOutbound,
  displayName: 'Gateway — Envoi sortant',
  subject: (d: Props) => d.subject || 'Message B.I.B',
  previewData: { senderName: 'Marie', subject: 'Information', message: 'Bonjour…', messageRef: 'GW-OUT-101', sentBy: 'Pierre Moreau', ccList: [] },
} satisfies TemplateEntry
