import { StepId } from "@/config/steps"
import { createChatMessage } from "@/engine/utils/message"
import { template } from "@/lib/template"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const providerMessageStep: Step = {
    id: "provider_message",

    run(ctx: ChatContext, input?: string): StepResult {
        // If user sends a message, transition to verify step
        // Note: User message is already added to context in ai-chat.tsx before dispatch
        if (input) {
            return {
                nextStepId: StepId.VERIFY,
            }
        }

        // Get provider name or use default
        const providerName = ctx.provider?.name || "your provider"
        const message = template("I'm very excited for your {providerName} choice! Let me know when you finish.", {
            providerName: providerName,
        })

        // Only show message, wait for user input
        // Verification card will be shown in verify step
        return {
            messages: [
                createChatMessage("assistant", message),
            ],
        }
    }
}
