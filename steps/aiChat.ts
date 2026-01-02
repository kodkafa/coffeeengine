/**
 * AI Chat Step
 * 
 * Validates session and expiration on every input.
 * Falls back to support flow if expired.
 * Calls real AI API using the AI SDK.
 */

import { config } from "@/config"
import chatSettings from "@/config/chat-messages.json"
import { StepId } from "@/config/steps"
import { AI_CALL_TIMEOUT_MS } from "@/config/chat"
import type { ChatContext, ChatMessage, Step, StepResult } from "@/types/engine"
import { createChatMessage } from "@/engine/utils/message"
import { logger } from "@/lib/logger"
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

/**
 * Calls the AI API using the configured provider.
 * 
 * @param params - Input parameters including user input, session ID, and conversation history
 * @returns AI-generated response text
 */
async function callAI(params: {
  input: string
  sessionId: string
  history: ChatMessage[]
}): Promise<string> {
  const provider = config.aiProvider
  const apiKey = config.getAiApiKey(provider)

  // Validate API key
  if (!apiKey && provider !== "vercel-gateway") {
    logger.error({ provider }, "AI API key not configured")
    throw new Error(`AI API key not configured for provider: ${provider}`)
  }

  // Build model based on provider
  let model
  switch (provider) {
    case "openai":
      model = openai("gpt-4-turbo", { apiKey })
      break
    case "anthropic":
      model = anthropic("claude-3-sonnet-20240229", { apiKey })
      break
    case "vercel-gateway":
      // Vercel Gateway uses a different configuration
      // For now, fall back to OpenAI if gateway URL is not configured
      if (!config.vercelAiGatewayUrl) {
        logger.warn({}, "Vercel AI Gateway URL not configured, falling back to OpenAI")
        model = openai("gpt-4-turbo", { apiKey: config.openaiApiKey })
      } else {
        // Vercel Gateway would require different setup
        // For now, use OpenAI as fallback
        model = openai("gpt-4-turbo", { apiKey: config.openaiApiKey })
      }
      break
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }

  // Convert ChatMessage[] to AI SDK message format
  const messages = params.history.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }))

  // Add the current user input
  messages.push({
    role: "user",
    content: params.input,
  })

  try {
    logger.debug({ provider, sessionId: params.sessionId, messageCount: messages.length }, "Calling AI API")

    const { text } = await generateText({
      model,
      system: chatSettings.agent.systemPrompt,
      messages,
      maxTokens: 1000,
    })

    logger.debug({ provider, sessionId: params.sessionId }, "AI API call successful")
    return text
  } catch (error) {
    logger.error({ provider, error, sessionId: params.sessionId }, "AI API call failed")
    throw new Error(
      `AI API call failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Mock session expired messages.
 */
const sessionExpiredMessages = [
  "⏰ Your session has expired. Please verify again to continue.",
  "⏱️ Time's up! Please verify again to continue chatting.",
]

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
          createChatMessage("assistant", "Session expired. Please support to continue."),
        ],
        nextStepId: "coffee_break",
      }
    }

    // Session is valid - proceed with AI generation

    // Initial load: no input, just show that we're ready
    if (!input) {
      return {
        // No messages, no components - just stay in this step
      }
    }

    // Call AI API with timeout protection
    let response: string
    try {
      response = await Promise.race([
        callAI({
          input,
          sessionId: ctx.session.id,
          history: ctx.history,
        }),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("AI API call timeout")), AI_CALL_TIMEOUT_MS)
        ),
      ])
    } catch (error) {
      logger.error({ error, sessionId: ctx.session.id }, "AI API call error")
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

