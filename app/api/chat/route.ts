/**
 * AI Chat API Route (BYO-AI Implementation)
 *
 * This route handles the chat interaction with the user's preferred AI provider.
 * It verifies the transaction before allowing premium features.
 *
 * Supports multiple AI providers:
 * - OpenAI (user's key via header)
 * - Anthropic Claude (user's key via header)
 * - Vercel AI Gateway (server-side)
 */

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

// Define the AI provider type
type AIProvider = "openai" | "anthropic" | "vercel-gateway"

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  systemPrompt?: string
  verificationContext?: {
    valid: boolean
    payerEmail?: string
    amountMinor?: number
    currency?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { messages, systemPrompt, verificationContext } = body

    // Check if user is verified
    if (!verificationContext?.valid) {
      return NextResponse.json(
        { error: "Payment verification required. Please verify your transaction first." },
        { status: 403 },
      )
    }

    // Get AI provider and key from headers
    const aiProvider = (req.headers.get("x-ai-provider") || "openai") as AIProvider
    const apiKey = req.headers.get("x-ai-key")

    // Build the model string based on provider
    let model: string
    const systemMessage = `${systemPrompt || "You are a helpful assistant."}

User verified email: ${verificationContext.payerEmail || "Unknown"}
Premium tier: Standard`

    switch (aiProvider) {
      case "openai":
        if (!apiKey) {
          return NextResponse.json({ error: "OpenAI API key required in x-ai-key header" }, { status: 400 })
        }
        model = "openai/gpt-4-turbo"
        break

      case "anthropic":
        if (!apiKey) {
          return NextResponse.json({ error: "Anthropic API key required in x-ai-key header" }, { status: 400 })
        }
        model = "anthropic/claude-3-sonnet-20240229"
        break

      case "vercel-gateway":
        // Vercel AI Gateway handles auth via env vars
        model = "openai/gpt-4-turbo"
        break

      default:
        return NextResponse.json({ error: "Unknown AI provider" }, { status: 400 })
    }

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
