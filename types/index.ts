export interface NormalizedEvent {
  providerId: string
  eventType: string
  externalId: string
  amountMinor: number
  currency: string
  payerEmail?: string
  occurredAt: string
  rawPayload: unknown
  eventMetadata?: Record<string, unknown> // Store additional event-specific data
}

export interface WebhookProvider {
  providerId: string
  verifyRequest(headers: Headers, body: string, secret: string): Promise<boolean>
  normalizePayload(payload: unknown): Promise<NormalizedEvent>
}

export interface VerificationResult {
  valid: boolean
  reason: string
  providerId?: string
  externalId?: string
  amountMinor?: number
  currency?: string
  occurredAt?: string
  payerEmail?: string
}

export interface ProviderConfig {
  providerId: string
  enabled: boolean
  secretEnvVar: string
}

/**
 * Provider metadata including UI information
 * Each provider should export this from their config.ts file
 */
export interface ProviderMetadata extends ProviderConfig {
  name: string
  description: string
  url?: string
  icon?: string // Icon name from lucide-react (e.g., "Coffee", "Heart")
}
