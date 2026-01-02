/**
 * AI Generate API Route
 * 
 * Handles AI chat generation requests from client-side steps.
 * This endpoint is called by the ai-chat step to generate AI responses.
 */

import { config } from "@/config"
import chatSettings from "@/config/chat-messages.json"
import { AI_CALL_TIMEOUT_MS } from "@/config/chat"
import { logger } from "@/lib/logger"
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

interface GenerateRequest {
  input: string
  history: Array<{
    role: "user" | "assistant" | "system"
    content: string
  }>
  sessionId: string
}

/**
 * Calls the AI API using the configured provider.
 */
async function callAI(params: {
  input: string
  sessionId: string
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>
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

  // Add the current user input
  const messages = [
    ...params.history,
    {
      role: "user" as const,
      content: params.input,
    },
  ]

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

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { input, history, sessionId } = body

    // Validate required fields
    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "input is required and must be a string" },
        { status: 400 }
      )
    }

    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: "history is required and must be an array" },
        { status: 400 }
      )
    }

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required and must be a string" },
        { status: 400 }
      )
    }

    // Call AI API with timeout protection
    const response = await Promise.race([
      callAI({
        input,
        sessionId,
        history,
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("AI API call timeout")), AI_CALL_TIMEOUT_MS)
      ),
    ])

    return NextResponse.json({
      success: true,
      text: response,
    })
  } catch (error) {
    logger.error({ error }, "AI Generate API error")
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

