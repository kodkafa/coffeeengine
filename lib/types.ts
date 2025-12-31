// Core service interfaces for dependency injection and testability

import type { NormalizedEvent, VerificationResult } from "@/types"

// Token store interface for verification
export interface ITokenStore {
  store(event: NormalizedEvent): Promise<void>
  retrieve(providerId: string, externalId: string): Promise<NormalizedEvent | null>
  exists(providerId: string, externalId: string): Promise<boolean>
  delete(providerId: string, externalId: string): Promise<void>
}

// Event store interface for historical records
export interface IEventStore {
  storeEvent(event: NormalizedEvent): Promise<void>
  getEvent(providerId: string, externalId: string): Promise<NormalizedEvent | null>
  getProviderEvents(providerId: string, limit?: number, offset?: number): Promise<NormalizedEvent[]>
  getEventsByType(providerId: string, eventType: string, limit?: number, offset?: number): Promise<NormalizedEvent[]>
  getUserEvents(email: string, limit?: number, offset?: number): Promise<NormalizedEvent[]>
  getEventStats(providerId: string): Promise<{
    totalEvents: number
    eventTypeBreakdown: Record<string, number>
    totalRevenue: number
  }>
}

// Verification service interface
export interface IVerificationService {
  verify(transactionId: string, providerId?: string): Promise<VerificationResult>
  verifyBulk(transactionIds: string[], providerId?: string): Promise<VerificationResult[]>
}
