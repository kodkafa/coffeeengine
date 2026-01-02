/**
 * Coffee Break Step
 * 
 * Triggered after user input doesn't match FAQ.
 * Asks for support and renders provider buttons.
 */

import chatSettings from "@/config/chat-messages.json"
import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import { getRandomMessage } from "@/lib/utils"
import type { Step, StepResult } from "@/types/engine"

export const coffeeBreakStep: Step = {
  id: "coffee_break",

  run(): StepResult {
    // Show paywall trigger message and provider buttons
    return {
      messages: [
        createChatMessage("assistant", getRandomMessage(chatSettings.messages.paywall_trigger)),
      ],
      components: [{ type: "provider_buttons" }],
      // Transition to support step
      nextStepId: StepId.SUPPORT,
    }
  },
}

