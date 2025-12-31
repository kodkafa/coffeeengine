// Verification Service - core business logic for token verification

import { tokenStore } from "./token-store.service"
import type { VerificationResult } from "@/types"

export class VerificationService {
  private static instance: VerificationService

  private constructor() {}

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService()
    }
    return VerificationService.instance
  }

  async verify(transactionId: string, providerId = "bmc"): Promise<VerificationResult> {
    try {
      console.log(`[VerificationService] Verifying transaction: ${transactionId} for provider: ${providerId}`)

      // Check if token exists in store
      const event = await tokenStore.retrieve(providerId, transactionId)

      console.log(`[VerificationService] Retrieved event:`, event ? "Found" : "Not found")

      if (!event) {
        console.log(`[VerificationService] Token not found: txn:${providerId}:${transactionId}`)
        return {
          valid: false,
          reason: "Transaction not found or expired",
        }
      }

      console.log(`[VerificationService] Token verified successfully for ${transactionId}`)

      // Token found and valid
      return {
        valid: true,
        reason: "Transaction verified successfully",
        providerId: event.providerId,
        externalId: event.externalId,
        amountMinor: event.amountMinor,
        currency: event.currency,
        occurredAt: event.occurredAt,
        payerEmail: event.payerEmail,
      }
    } catch (error) {
      console.error("[VerificationService] Error during verification:", error)
      console.error("[VerificationService] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return {
        valid: false,
        reason: "Internal verification error",
      }
    }
  }

  async verifyBulk(transactionIds: string[], providerId = "bmc"): Promise<VerificationResult[]> {
    return Promise.all(transactionIds.map((id) => this.verify(id, providerId)))
  }
}

export const verificationService = VerificationService.getInstance()
