/**
 * Frontend API Client Library
 * Provides a clean interface for frontend components to interact with Coffee Engine
 *
 * Usage:
 * const result = await apiClient.verifyTransaction('TXN_12345ABC');
 * const health = await apiClient.checkHealth();
 */

import { z } from "zod"

// Response schemas
export const VerificationResultSchema = z.object({
  ok: z.boolean(),
  valid: z.boolean(),
  reason: z.string(),
  providerId: z.string().optional(),
  externalId: z.string().optional(),
  amountMinor: z.number().optional(),
  currency: z.string().optional(),
  occurredAt: z.string().optional(),
  payerEmail: z.string().optional(),
  contextId: z.string().optional(),
  sessionId: z.string().optional(),
})

export type VerificationResult = z.infer<typeof VerificationResultSchema>

export const HealthCheckSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string(),
})

export type HealthCheckResponse = z.infer<typeof HealthCheckSchema>

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  }

  /**
   * Verify a transaction with the Coffee Engine (public endpoint, no auth required)
   * @param transactionId - The transaction ID to verify
   * @param providerId - Optional provider ID (defaults to 'bmc')
   * @param contextId - Optional context identifier for tracking
   * @returns VerificationResult with transaction details if valid
   *
   * Note: This uses the public endpoint that doesn't require API key headers.
   */
  async verifyTransaction(transactionId: string, providerId = "bmc", contextId?: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/coffee/verify-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          providerId,
          ...(contextId && { contextId }),
        }),
      })

      if (!response.ok) {
        return {
          ok: false,
          valid: false,
          reason: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      const validated = VerificationResultSchema.parse(data)
      return {
        ...validated,
        ok: true,
      }
    } catch (error) {
      console.error("[ApiClient] Verification error:", error)
      return {
        ok: false,
        valid: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Check if the Coffee Engine API is healthy
   * @returns HealthCheckResponse with service status
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/coffee/health`)

      if (!response.ok) return false

      const data = await response.json()
      const validated = HealthCheckSchema.safeParse(data)
      return validated.success && validated.data.ok
    } catch (error) {
      console.error("[ApiClient] Health check error:", error)
      return false
    }
  }

  /**
   * Get the OpenAPI specification for the Coffee Engine
   * @returns OpenAPI spec object
   */
  async getOpenAPISpec(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/openapi`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[ApiClient] OpenAPI spec error:", error)
      return null
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Also export for use in server components
export default apiClient
