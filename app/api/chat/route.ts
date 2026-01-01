/**
 * AI Chat API Route (Server-Side AI Implementation)
 *
 * This route handles the chat interaction using server-side AI provider configuration.
 * It verifies the transaction before allowing premium features.
 *
 * Supports multiple AI providers configured via environment variables:
 * - OpenAI (via OPENAI_API_KEY)
 * - Anthropic Claude (via ANTHROPIC_API_KEY)
 * - Vercel AI Gateway (via VERCEL_AI_GATEWAY_URL)
 *
 * Security: All API keys are stored server-side and never exposed to the frontend.
 */

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { config } from "@/config"
import { sessionStore } from "@/services/session-store.service"
import chatSettings from "@/config/chat-settings.json"

// Define the AI provider type
type AIProvider = "openai" | "anthropic" | "vercel-gateway"

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  systemPrompt?: string
  sessionId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { messages, systemPrompt, sessionId } = body

    // Get session ID from header or body
    const headerSessionId = req.headers.get("x-session-id")
    const activeSessionId = headerSessionId || sessionId

    // Check if user has a valid session
    let session = null
    if (activeSessionId) {
      session = await sessionStore.getSession(activeSessionId)
    }

    if (!session || !session.verified) {
      return NextResponse.json(
        { error: "Payment verification required. Please verify your transaction first." },
        { status: 403 },
      )
    }

    // Get AI provider from environment (default from config)
    // Optionally allow override via header for flexibility
    const headerProvider = req.headers.get("x-ai-provider")
    const aiProvider: AIProvider = headerProvider
      ? (headerProvider as AIProvider)
      : config.aiProvider

    // Get API key from server-side configuration (secure)
    const apiKey = config.getAiApiKey(aiProvider)

    // Use system prompt from chat settings, with optional override from request
    const baseSystemPrompt = systemPrompt || chatSettings.agent.systemPrompt

    const systemMessage = `${baseSystemPrompt}

User verified email: ${session.payerEmail || "Unknown"}
Premium tier: Standard
Session duration: ${chatSettings.session.durationMinutes} minutes`

    // Prepare messages for the AI
    const userMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    // Get the last user message
    const lastMessage = userMessages[userMessages.length - 1]
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 })
    }

    // Build the model based on provider
    let model: Parameters<typeof generateText>[0]["model"]

    switch (aiProvider) {
      case "openai":
        if (!apiKey) {
          return NextResponse.json(
            { error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." },
            { status: 500 },
          )
        }
        // Create OpenAI model with API key from environment
        model = openai("gpt-4-turbo", { apiKey })
        break

      case "anthropic":
        if (!apiKey) {
          return NextResponse.json(
            { error: "Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable." },
            { status: 500 },
          )
        }
        // Create Anthropic model with API key from environment
        model = anthropic("claude-3-sonnet-20240229", { apiKey })
        break

      case "vercel-gateway":
        // Vercel AI Gateway - uses default OpenAI model with gateway URL
        if (!config.vercelAiGatewayUrl) {
          return NextResponse.json(
            { error: "Vercel AI Gateway URL not configured. Please set VERCEL_AI_GATEWAY_URL environment variable." },
            { status: 500 },
          )
        }
        // For Vercel Gateway, use OpenAI (gateway URL is handled via env var)
        model = openai("gpt-4-turbo")
        break

      default:
        return NextResponse.json({ error: "Unknown AI provider" }, { status: 400 })
    }

    // Generate response using AI SDK
    const { text } = await generateText({
      model,
      system: systemMessage,
      messages: userMessages,
    })

    // Return the generated text
    return NextResponse.json({
      role: "assistant",
      content: text,
    })
  } catch (error) {
    console.error("[Chat API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
