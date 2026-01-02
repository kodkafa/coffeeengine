/**
 * FAQ Step
 * 
 * Displays static FAQ entries as starter buttons.
 * Matches user input by exact question text.
 * Loops within the same step.
 * Transitions only when input does not match any FAQ.
 */

import { FAQButtons } from "@/components/steps/faq-buttons"
import chatSettings from "@/config/chat-messages.json"
import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const FAQComponent = FAQButtons

/**
 * Normalizes a string for comparison (lowercase, trim).
 */
function normalize(str: string): string {
  return str.toLowerCase().trim()
}

export const faqStep: Step = {
  id: "faq",
  components: {
    "faq_buttons": FAQComponent,
  },

  run(ctx: ChatContext, input?: string): StepResult {
    // Initial load: show FAQ buttons
    if (!input) {
      return {
        ui: {
          component: "faq_buttons",
        },
      }
    }

    // Find matching FAQ by exact question text
    const faq = chatSettings.faq?.find(
      (f) => normalize(f.question) === normalize(input),
    )

    if (faq) {
      // Match found: show question and answer, keep FAQ buttons visible
      return {
        messages: [
          createChatMessage("user", faq.question),
          createChatMessage("assistant", faq.answer),
        ],
        ui: {
          component: "faq_buttons",
        },
        // Stay in the same step (no nextStepId)
      }
    }

    // No match: transition to first_coffee (first time coffee break)
    return {
      nextStepId: StepId.FIRST_COFFEE,
    }
  },
}

