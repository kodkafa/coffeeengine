/**
 * AI Chat Step
 * 
 * Validates session and expiration on every input.
 * Falls back to support flow if expired.
 * Calls backend API for AI generation (step handles its own API calls).
 */

import { createChatMessage } from "@/engine/utils/message"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const aiChatStep: Step = {
  id: "ai_chat",

  async run(ctx: ChatContext, input?: string): Promise<StepResult> {
    // CRITICAL: Check session validity at the very start
    // This is the gatekeeper - prevents abuse even if API is called directly
    if (!ctx.session || Date.now() > ctx.session.expiresAt) {
      // Session invalid or expired - immediately return to coffee_break
      // Do NOT call the AI/LLM
      return {
        messages: [
          //createChatMessage("assistant", "Session expired. Please support to continue."),
        ],
        nextStepId: "coffee_break",
      }
    }

    // Session is valid - proceed with AI generation

    // Initial load: no input, just stay in this step
    // UI will be handled by chat component (conversation starters)
    if (!input) {
      return {
        // No messages, no components - just stay in this step
        // Chat component will show conversation starters if configured
      }
    }

    // Call backend API for AI generation
    // Step handles its own API calls - this works in both client and server environments
    // Use relative URL - fetch will use current origin automatically
    let response: string
    try {
      // Convert ChatMessage[] to API format
      const history = ctx.history
        .filter((msg) => msg.role !== "system") // Filter system messages for API
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))

      const apiResponse = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          history,
          sessionId: ctx.session.id,
        }),
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}))
        throw new Error(errorData.message || `AI API call failed: ${apiResponse.statusText}`)
      }

      const data = await apiResponse.json()
      if (!data.success || !data.text) {
        throw new Error(data.message || "AI API returned invalid response")
      }

      response = data.text
    } catch (error) {
      // Return error message to user
      return {
        messages: [
          createChatMessage(
            "assistant",
            "I'm sorry, I encountered an error processing your request. Please try again."
          ),
        ],
        // Stay in ai_chat step to allow retry
      }
    }

    // Return AI response
    return {
      messages: [
        createChatMessage("assistant", response),
      ],
      // Stay in ai_chat step (no nextStepId)
    }
  },
}

