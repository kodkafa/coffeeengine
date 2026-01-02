import chatSettings from "@/config/chat-messages.json"
import { getAllProviderMetadata } from "@/config/providers"
import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import { template } from "@/lib/template"
import { getRandomMessage } from "@/lib/utils"
import type { ChatContext, Provider, Step, StepResult } from "@/types/engine"

export const supportStep: Step = {
  id: "support",

  run(ctx: ChatContext, input?: string): StepResult {
    // If provider is already in context (from coffee-break step), show confirmation
    if (ctx.provider && !input) {
      const confirmMessage = template(chatSettings.messages.provider_confirm, {
        providerName: ctx.provider.name,
      })

      return {
        messages: [createChatMessage("assistant", confirmMessage)],
        ui: {
          component: "verification_card",
        },
        // Stay in support step, waiting for transaction ID or user confirmation
      }
    }

    // Handle error context (from step engine redirects)
    if (ctx.errorContext && !input) {
      return {
        messages: [
          createChatMessage("assistant", ctx.errorContext.message || "An error occurred. Let me help you."),
        ],
        ui: {
          component: "support-card",
          props: {
            title: "Error Support",
            description: "We encountered an issue. Please try again or select a provider to continue.",
            errorContext: {
              message: ctx.errorContext.message,
              step: ctx.currentStepId,
              details: ctx.errorContext.details,
            },
          },
        },
      }
    }

    // Handle provider selection (if coming directly to support step)
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

      const providerMetadata = getAllProviderMetadata().find((p) => p.providerId === providerId)
      const provider: Provider = {
        id: providerId,
        name: providerMetadata?.name || providerId,
        url: providerMetadata?.url,
      }

      const confirmMessage = template(chatSettings.messages.provider_confirm, {
        providerName: provider.name,
      })

      return {
        messages: [createChatMessage("assistant", confirmMessage)],
        ctxPatch: { provider },
        ui: {
          component: "verification_card",
        },
        // Stay in support step, waiting for transaction ID
      }
    }

    // If user provides transaction ID or confirms completion, transition to verify
    if (input && ctx.provider) {
      // Check if input looks like a transaction ID or confirmation
      const isConfirmation = /^(yes|done|completed|i completed|i did it|check|verify)/i.test(input.trim())
      const looksLikeTxId = input.trim().length > 5 && /^[A-Za-z0-9_-]+$/.test(input.trim())

      if (isConfirmation || looksLikeTxId) {
        return {
          nextStepId: StepId.VERIFY,
        }
      }
    }

    // Default: show provider selector if no provider selected
    if (!ctx.provider) {
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

    // Provider selected but waiting for transaction
    return {
      messages: [
        createChatMessage("assistant", getRandomMessage(chatSettings.messages.ask_for_tx)),
      ],
      ui: {
        component: "verification_card",
      },
    }
  },
}

