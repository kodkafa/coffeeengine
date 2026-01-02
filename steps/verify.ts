/**
 * Verify Step
 * 
 * Collects transaction ID via chat.
 * Uses the EXISTING verification service to validate transactions.
 * Creates secure session object on success - this becomes the "Proof of Payment" saved to Redis.
 */

import chatSettings from "@/config/chat-messages.json"
import { getDefaultProviderId } from "@/config/providers"
import { StepId } from "@/config/steps"
import type { ChatContext, Step, StepResult } from "@/types/engine"
import { createChatMessage } from "@/engine/utils/message"
import { getRandomMessage } from "@/lib/utils"
import { verificationService } from "@/services/verification.service"
import { randomBytes } from "crypto"

/**
 * Generates a secure session ID.
 */
function generateSecureSessionId(): string {
  return `sess_${randomBytes(16).toString("hex")}`
}

export const verifyStep: Step = {
  id: "verify",

  async run(ctx: ChatContext, input?: string): Promise<StepResult> {
    // Initial load: ask for transaction ID
    if (!input) {
      return {
        messages: [
          createChatMessage("assistant", getRandomMessage(chatSettings.messages.ask_for_tx)),
        ],
        components: [{ type: "verification_card" }],
      }
    }

    // Verify the transaction using the EXISTING verification service
    const providerId = ctx.provider?.id || getDefaultProviderId()
    const result = await verificationService.verify(input, providerId)

    if (!result.valid) {
      // Verification failed: show error and stay on verify step (or suggest support)
      return {
        messages: [
          createChatMessage("assistant", getRandomMessage(chatSettings.messages.tx_fail)),
        ],
        components: [{ type: "verification_card" }],
        // Stay on verify step to allow retry
      }
    }

    // Verification successful: create secure session object
    // This becomes the "Proof of Payment" saved to Redis via the engine
    const expiresAt = Date.now() + chatSettings.session.durationMinutes * 60 * 1000

    const session = {
      id: generateSecureSessionId(),
      expiresAt,
      verifiedAt: new Date().toISOString(),
      payerEmail: result.payerEmail,
      transactionId: result.externalId || input,
      providerId: result.providerId || providerId,
      amountMinor: result.amountMinor,
      currency: result.currency,
    }

    // Update context with session and transition to AI chat
    return {
      messages: [
        createChatMessage("assistant", getRandomMessage(chatSettings.messages.tx_success)),
      ],
      ctxPatch: { session },
      nextStepId: "ai_chat",
    }
  },
}

