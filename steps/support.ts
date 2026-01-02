import { SupportCard } from "@/components/steps/support-card"
import { createChatMessage } from "@/engine/utils/message"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const SupportComponent = SupportCard

export const supportStep: Step = {
  id: "support",
  components: {
    "support-card": SupportComponent,
  },

  run(ctx: ChatContext, input?: string): StepResult {
    const errorMessage = ctx.errorContext?.message || "An error occurred. Please try again."
    
    return {
      messages: [
        createChatMessage("assistant", errorMessage),
      ],
      ui: {
        component: "support-card",
        props: {
          title: "Error",
          description: errorMessage,
          errorContext: ctx.errorContext ? {
            message: ctx.errorContext.message,
            step: ctx.currentStepId,
            details: ctx.errorContext.details,
          } : undefined,
        },
      },
    }
  },
}

