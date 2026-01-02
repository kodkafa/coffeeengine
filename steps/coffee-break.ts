/**
 * Coffee Break Step
 * 
 * Triggered after user input doesn't match FAQ.
 * Asks for support and renders provider buttons.
 * Handles provider selection and transitions to provider-confirmation.
 */

import chatSettings from "@/config/chat-messages.json"
import { getAllProviderMetadata } from "@/config/providers"
import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import { getRandomMessage } from "@/lib/utils"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const coffeeBreakStep: Step = {
  id: "coffee_break",

  run(ctx: ChatContext, input?: string): StepResult {
    // If provider is already selected, transition to provider-confirmation
    if (ctx.provider) {
      return {
        nextStepId: StepId.SUPPORT, // Support step handles provider-confirmation
      }
    }

    // If input is a provider selection
    if (input?.startsWith("provider:")) {
      const providerId = input.split(":")[1]?.trim()
      if (!providerId) {
        return {
          messages: [
            createChatMessage("assistant", getRandomMessage(chatSettings.messages.support_retry)),
          ],
          ui: {
            component: "provider-selector",
            props: {
              providers: getAllProviderMetadata().map((config) => ({
                id: config.providerId,
                name: config.name,
                url: config.url || "#",
                icon: config.icon,
              })),
            },
          },
        }
      }

      // Provider selected - transition to support step for confirmation
      // No messages here - let auto-advance trigger support step which will show confirmation
      const providerName = getAllProviderMetadata().find((p) => p.providerId === providerId)?.name || providerId
      
      return {
        ctxPatch: {
          provider: {
            id: providerId,
            name: providerName,
            url: getAllProviderMetadata().find((p) => p.providerId === providerId)?.url,
          },
        },
        nextStepId: StepId.SUPPORT,
        // No messages/UI - this triggers auto-advance to support step
      }
    }

    // Initial load: show paywall trigger message and provider buttons
    return {
      messages: [
        createChatMessage("assistant", getRandomMessage(chatSettings.messages.paywall_trigger)),
      ],
      ui: {
        component: "provider-selector",
        props: {
          providers: getAllProviderMetadata().map((config) => ({
            id: config.providerId,
            name: config.name,
            url: config.url || "#",
            icon: config.icon,
          })),
        },
      },
      // Stay in this step, waiting for provider selection
    }
  },
}

