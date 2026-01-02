/**
 * Verify Step
 * 
 * Collects transaction ID via chat.
 * Uses the EXISTING verification service to validate transactions.
 * Creates secure session object on success - this becomes the "Proof of Payment" saved to Redis.
 */

import { VerificationCard } from "@/components/steps/verification-card"
import chatSettings from "@/config/chat-messages.json"
import { createChatMessage } from "@/engine/utils/message"
import { logger } from "@/lib/logger"
import { getRandomMessage } from "@/lib/utils"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const VerifyComponent = VerificationCard

/**
 * Generates a secure session ID.
 * Works in both browser and Node.js environments.
 */
function generateSecureSessionId(): string {
  // Use browser crypto API if available, otherwise fall back to Node.js crypto
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(16)
    window.crypto.getRandomValues(array)
    return `sess_${Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")}`
  } else {
    // Server-side: use Node.js crypto
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomBytes } = require("crypto")
    return `sess_${randomBytes(16).toString("hex")}`
  }
}

export const verifyStep: Step = {
  id: "verify",
  components: {
    "verification_card": VerifyComponent,
  },

  async run(ctx: ChatContext, input?: string): Promise<StepResult> {
    // Verify the transaction using the EXISTING verification service
    // Provider MUST be in context - if not, show error
    if (!ctx.provider?.id) {
      logger.warn({}, "Provider not set in context for verification")
      return {
        messages: [
          createChatMessage("assistant", "Please select a payment provider first."),
        ],
        nextStepId: "first_coffee",
      }
    }
    
    const providerId = ctx.provider.id

    // Initial load: ask for transaction ID
    if (!input) {
      return {
        messages: [
          createChatMessage("assistant", getRandomMessage(chatSettings.messages.ask_for_tx)),
        ],
        ui: {
          component: "verification_card",
          props: {
            providerId,
            // Handler will be injected by chat component via onSendMessage
          },
        },
      }
    }

    // Verify the transaction by calling backend API
    // Step handles its own API calls - this works in both client and server environments
    // Use relative URL - fetch will use current origin automatically
    let result: { valid: boolean; reason: string; payerEmail?: string; externalId?: string; providerId?: string; amountMinor?: number; currency?: string }
    
    try {
      const response = await fetch("/api/coffee/verify-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: input,
          providerId,
          createSession: false, // We'll create session in context, not via API
        }),
      })

      if (!response.ok) {
        result = {
          valid: false,
          reason: `Verification failed: ${response.statusText}`,
        }
      } else {
        const data = await response.json()
        result = {
          valid: data.valid || false,
          reason: data.reason || (data.valid ? "Transaction verified successfully" : "Verification failed"),
          payerEmail: data.payerEmail,
          externalId: data.externalId,
          providerId: data.providerId,
          amountMinor: data.amountMinor,
          currency: data.currency,
        }
      }
    } catch (error) {
      result = {
        valid: false,
        reason: error instanceof Error ? error.message : "Verification error",
      }
    }

    if (!result.valid) {
      // Verification failed: show error and stay on verify step (or suggest support)
      return {
        messages: [
          createChatMessage("assistant", getRandomMessage(chatSettings.messages.tx_fail)),
        ],
        ui: {
          component: "verification_card",
          props: {
            providerId,
            error: result.reason,
          },
        },
        // Stay on verify step to allow retry
      }
    }

    // Verification successful: call provider's controlEvent method
    // This processes the transaction and returns generic data (verifiedAt, TTL, thanksMessage)
    try {
      const controlResponse = await fetch("/api/coffee/control-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: result.externalId || input,
          providerId: providerId, // Use providerId from context, not from result
        }),
      })

      if (!controlResponse.ok) {
        // If control event fails, we should not proceed - return error
        const errorData = await controlResponse.json().catch(() => ({}))
        return {
          messages: [
            createChatMessage("assistant", errorData.message || "Verification processing failed. Please try again."),
          ],
          ui: {
            component: "verification_card",
            props: {
              providerId: result.providerId || providerId,
              error: errorData.message || "Control event failed",
            },
          },
        }
      }

      // Get control result from provider (verifiedAt, TTL, thanksMessage)
      const controlResult = await controlResponse.json()

      // Create secure session object using control result
      // This becomes the "Proof of Payment" saved to Redis via the engine
      // TTL is in seconds, convert to milliseconds
      const expiresAt = Date.now() + controlResult.TTL * 1000

      const session = {
        id: generateSecureSessionId(),
        expiresAt,
        verifiedAt: controlResult.verifiedAt,
        payerEmail: result.payerEmail,
        transactionId: result.externalId || input,
        providerId: result.providerId || providerId,
        amountMinor: result.amountMinor,
        currency: result.currency,
      }

      // Update context with session and transition to AI chat
      // Use the templated thanks message from provider
      return {
        messages: [
          createChatMessage("assistant", controlResult.thanksMessage),
        ],
        ctxPatch: { session },
        nextStepId: "ai_chat",
      }
    } catch (error) {
      // If control event fails, return error instead of fallback
      logger.error({ error }, "Control event error")
      return {
        messages: [
          createChatMessage("assistant", "Verification processing failed. Please try again."),
        ],
        ui: {
          component: "verification_card",
          props: {
            providerId: result.providerId || providerId,
            error: error instanceof Error ? error.message : "Control event error",
          },
        },
      }
    }
  },
}

