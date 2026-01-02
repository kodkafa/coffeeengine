// Verification Service - core business logic for token verification

import { getDefaultProviderId } from "@/config/providers"
import { tokenStore } from "./token-store.service"
import { logger } from "@/lib/logger"
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

  async verify(transactionId: string, providerId = getDefaultProviderId()): Promise<VerificationResult> {
    try {
      logger.debug({ providerId }, "Verifying transaction")

      // Check if transaction has already been used
      const isUsed = await tokenStore.isUsed(providerId, transactionId)
      if (isUsed) {
        logger.debug({ providerId, transactionId }, "Transaction already used")
        return {
          valid: false,
          reason: "This transaction has already been verified and used",
        }
      }

      // Check if token exists in store
      const event = await tokenStore.retrieve(providerId, transactionId)

      if (!event) {
        logger.debug({ providerId }, "Token not found")
        return {
          valid: false,
          reason: "Transaction not found or expired",
        }
      }

      logger.info({ providerId, externalId: event.externalId }, "Token verified successfully")

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
      logger.error(
        {
          error,
          providerId,
          transactionId,
        },
        "Error during verification"
      )
      return {
        valid: false,
        reason: "Internal verification error",
      }
    }
  }

  async verifyBulk(transactionIds: string[], providerId = getDefaultProviderId()): Promise<VerificationResult[]> {
    return Promise.all(transactionIds.map((id) => this.verify(id, providerId)))
  }
}

export const verificationService = VerificationService.getInstance()
