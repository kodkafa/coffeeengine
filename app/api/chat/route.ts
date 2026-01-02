/**
 * Chat API Route - Step Engine Integration
 * 
 * Handles chat messages using the Step Engine architecture with:
 * - Rate limiting (30 requests/minute per conversation)
 * - Server-authoritative state management (Redis)
 * - Security: Context never accepted from client, never fully exposed in response
 * 
 * Flow:
 * 1. Parse conversationId and message from request
 * 2. Rate limit check (Redis)
 * 3. Load context from Redis (server-authoritative)
 * 4. Run engine.dispatch(context, message)
 * 5. Save updated context to Redis
 * 6. Return only StepResult output (no full context)
 */

import { AUTO_ADVANCE_MAX_DEPTH } from "@/config/chat"
import { stepRegistry } from "@/config/steps"
import { loadChatContext, saveChatContext } from "@/engine/state-manager"
import { StepEngine } from "@/engine/step-engine"
import { logger } from "@/lib/logger"
import { checkRateLimitByConversation } from "@/services/rate-limit.service"
import type { StepResult } from "@/types/engine"
import { type NextRequest, NextResponse } from "next/server"

interface ChatRequest {
  conversationId: string
  message: string
  // SECURITY: Do NOT accept context from client
  // ctx?: ChatContext // ❌ NOT ALLOWED
}


/**
 * Handles auto-advance logic when a step transitions.
 * 
 * If a step returns `nextStepId`, we immediately run the next step
 * with `undefined` input to get its initial UI, preventing blank states.
 */
async function handleAutoAdvance(
  engine: StepEngine,
  ctx: Awaited<ReturnType<typeof loadChatContext>>,
  maxDepth = AUTO_ADVANCE_MAX_DEPTH,
): Promise<{ ctx: Awaited<ReturnType<typeof loadChatContext>>; result: StepResult }> {
  let currentCtx = ctx
  let depth = 0

  while (depth < maxDepth) {
    const dispatchResult = await engine.dispatch(currentCtx, undefined)

    // If the step doesn't transition, we're done
    if (!dispatchResult.output.nextStepId) {
      return {
        ctx: dispatchResult.ctx,
        result: dispatchResult.output,
      }
    }

    // If the step transitions but already has messages/components/ui, we're done
    if (
      dispatchResult.output.messages?.length ||
      dispatchResult.output.components?.length ||
      !!dispatchResult.output.ui
    ) {
      return {
        ctx: dispatchResult.ctx,
        result: dispatchResult.output,
      }
    }

    // Step transitioned but no UI yet - continue to next step
    currentCtx = dispatchResult.ctx
    depth++
  }

  // Max depth reached
  return {
    ctx: currentCtx,
    result: {
      messages: [],
      components: [],
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body: ChatRequest = await req.json()
    const { conversationId, message } = body

    // Validate required fields
    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { error: "conversationId is required and must be a string" },
        { status: 400 },
      )
    }

    if (message === undefined || message === null || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required and must be a string" },
        { status: 400 },
      )
    }

    // SECURITY: Reject any attempt to send context from client
    if ("ctx" in body || "context" in body) {
      return NextResponse.json(
        { error: "Context cannot be provided by client. Server-authoritative only." },
        { status: 400 },
      )
    }

    // 2. Rate limit check
    const rateLimitResult = await checkRateLimitByConversation(conversationId)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetAt
              ? String(Math.max(1, rateLimitResult.resetAt - Math.floor(Date.now() / 1000)))
              : "60",
          },
        },
      )
    }

    // 3. Load context from Redis (server-authoritative)
    // Context is NEVER accepted from client - always loaded from server
    const context = await loadChatContext(conversationId)

    // 4. Instantiate StepEngine
    const engine = new StepEngine(stepRegistry)

    // 5. Run engine.dispatch
    const dispatchResult = await engine.dispatch(context, message)

    // Handle auto-advance if step transitioned
    let finalResult: StepResult
    let finalContext: Awaited<ReturnType<typeof loadChatContext>>

    if (dispatchResult.output.nextStepId) {
      const hasUI =
        dispatchResult.output.messages?.length ||
        dispatchResult.output.components?.length ||
        !!dispatchResult.output.ui

      if (!hasUI) {
        // No UI yet - auto-advance to get initial UI from next step
        const autoAdvanceResult = await handleAutoAdvance(engine, dispatchResult.ctx)
        finalContext = autoAdvanceResult.ctx
        finalResult = autoAdvanceResult.result
      } else {
        // Step already has UI - use it
        finalContext = dispatchResult.ctx
        finalResult = dispatchResult.output
      }
    } else {
      // No transition - use result as-is
      finalContext = dispatchResult.ctx
      finalResult = dispatchResult.output
    }

    // 6. Save updated context to Redis
    await saveChatContext(conversationId, finalContext)

    // 7. Respond with ONLY the StepResult output (no full context)
    // SECURITY: Never send full context to client (leak prevention)
    return NextResponse.json({
      success: true,
      result: finalResult,
      // Only send minimal metadata, not full context
      metadata: {
        currentStepId: finalContext.currentStepId,
        messageCount: finalContext.messageCount,
        hasSession: !!finalContext.session,
        // Don't expose session details
      },
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
    })
  } catch (error) {
    logger.error({ error }, "Chat API POST error")
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/**
 * GET endpoint for initializing a new conversation or loading existing one.
 */
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    // Load context from Redis (server-authoritative)
    const context = await loadChatContext(conversationId)

    // Instantiate StepEngine
    const engine = new StepEngine(stepRegistry)

    // Get initial UI for current step (no input)
    const dispatchResult = await engine.dispatch(context, undefined)

    // Handle auto-advance if needed
    let finalResult: StepResult
    let finalContext: Awaited<ReturnType<typeof loadChatContext>>

    if (dispatchResult.output.nextStepId) {
      const hasUI =
        dispatchResult.output.messages?.length ||
        dispatchResult.output.components?.length ||
        !!dispatchResult.output.ui

      if (!hasUI) {
        const autoAdvanceResult = await handleAutoAdvance(engine, dispatchResult.ctx)
        finalContext = autoAdvanceResult.ctx
        finalResult = autoAdvanceResult.result
      } else {
        finalContext = dispatchResult.ctx
        finalResult = dispatchResult.output
      }
    } else {
      finalContext = dispatchResult.ctx
      finalResult = dispatchResult.output
    }

    // Save context to Redis
    await saveChatContext(conversationId, finalContext)

    // Return only StepResult output (no full context)
    return NextResponse.json({
      success: true,
      result: finalResult,
      metadata: {
        currentStepId: finalContext.currentStepId,
        messageCount: finalContext.messageCount,
        hasSession: !!finalContext.session,
      },
    })
  } catch (error) {
    logger.error({ error }, "Chat API POST error")
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
