/**
 * Coffee Break Step
 * 
 * Triggered when timer expires (session ended).
 * Shows "need coffee again" messages and provider buttons.
 * Handles provider selection and transitions to provider-confirmation.
 */

import { ProviderSelector } from "@/components/steps/provider-selector"
import chatSettings from "@/config/chat-messages.json"
import { getAllProviderMetadata } from "@/config/providers"
import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import { template } from "@/lib/template"
import { getRandomMessage } from "@/lib/utils"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const ProviderSelectorComponent = ProviderSelector

export const coffeeBreakStep: Step = {
  id: "coffee_break",
  components: {
    "provider-selector": ProviderSelectorComponent,
  },

  run(ctx: ChatContext, input?: string): StepResult {
    if (ctx.provider) {
      return {
        nextStepId: StepId.PROVIDER_MESSAGE,
      }
    }

    // 2. Handle Input (Provider Selection)
    // Accept "provider:bmc", "provider: bmc", "Provider:bmc" etc.
    if (input && input.toLowerCase().includes("provider")) {
      // Robust parsing
      const parts = input.split(":")
      // If split gives parts, take the last one as ID (simplest assumption for "provider:id")
      const rawId = parts.length > 1 ? parts[parts.length - 1] : ""
      const providerId = rawId.trim()

      if (providerId) {
        const providerMeta = getAllProviderMetadata().find((p) => p.providerId === providerId)
        const providerName = providerMeta?.name || providerId
        const url = providerMeta?.url

        // Valid selection found
        const confirmMessage = template(chatSettings.messages.provider_confirm, {
          providerName: providerName,
        })

        return {
          messages: [
            createChatMessage("assistant", confirmMessage)
          ],
          ctxPatch: {
            provider: {
              id: providerId,
              name: providerName,
              url: url,
            }
          },
          nextStepId: StepId.PROVIDER_MESSAGE,
        }
      }
    }

    // 3. Default State (Show Buttons) - Timer expired, need coffee again
    return {
      messages: [
        createChatMessage("assistant", getRandomMessage(chatSettings.messages.coffee_break)),
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
  },
}
