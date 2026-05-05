import * as React from 'npm:react@18.3.1'
import { template as gatewayAck } from './gateway-acknowledgment.tsx'
import { template as gatewayReply } from './gateway-reply.tsx'

export type TemplateEntry = {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: any) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'gateway-acknowledgment': gatewayAck,
  'gateway-reply': gatewayReply,
}
