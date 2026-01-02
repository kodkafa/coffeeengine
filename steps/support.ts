import chatSettings from "@/config/chat-messages.json"
import { getProviderName, ProviderId } from "@/config/providers"
import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import { template } from "@/lib/template"
import { getRandomMessage } from "@/lib/utils"
import type { ChatContext, Provider, Step, StepResult } from "@/types/engine"

export const supportStep: Step = {
  id: "support",

  run(ctx: ChatContext, input?: string): StepResult {
    if (!input) {
      return {
        components: [{ type: "provider_buttons" }],
      }
    }

    if (input.startsWith("provider:")) {
      const providerId = input.split(":")[1]?.trim()

      if (!providerId) {
        return {
          messages: [
            createChatMessage("assistant", getRandomMessage(chatSettings.messages.support_retry)),
          ],
          components: [{ type: "provider_buttons" }],
        }
      }

      const provider: Provider = {
        id: providerId,
        name: getProviderName(providerId),
        url: providerId === ProviderId.BMC ? process.env.NEXT_PUBLIC_BMC_URL : undefined,
      }

      const confirmMessage = template(chatSettings.messages.provider_confirm, {
        providerName: provider.name,
      })

      return {
        messages: [createChatMessage("assistant", confirmMessage)],
        ctxPatch: { provider },
        nextStepId: StepId.VERIFY,
      }
    }

    return {
      messages: [
        createChatMessage("assistant", getRandomMessage(chatSettings.messages.support_retry)),
      ],
      components: [{ type: "provider_buttons" }],
    }
  },
}

