// Zod validation schemas for runtime data integrity

import { z } from "zod"

// Normalized event validation schema
export const NormalizedEventSchema = z.object({
  providerId: z.string().min(1),
  eventType: z.string().min(1),
  externalId: z.string().min(1),
  amountMinor: z.number().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
  payerEmail: z.string().email().optional(),
  occurredAt: z.string().datetime(),
  rawPayload: z.unknown(),
  eventMetadata: z.record(z.unknown()).optional(),
  storedAt: z.number().optional(),
})

export type ValidatedNormalizedEvent = z.infer<typeof NormalizedEventSchema>

// Verification result schema
export const VerificationResultSchema = z.object({
  valid: z.boolean(),
  reason: z.string(),
  providerId: z.string().optional(),
  externalId: z.string().optional(),
  amountMinor: z.number().optional(),
  currency: z.string().optional(),
  occurredAt: z.string().optional(),
  payerEmail: z.string().optional(),
})

export type ValidatedVerificationResult = z.infer<typeof VerificationResultSchema>
