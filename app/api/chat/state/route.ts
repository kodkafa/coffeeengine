/**
 * Chat State API Route - Minimal State Persistence
 * 
 * Handles only critical state: session, verifiedAt, currentStepId
 * Chat messages are NOT stored here - they stay in-memory only.
 */

import { kv } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

const CHAT_STATE_KEY_PREFIX = "chat:state:"
const CHAT_STATE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

interface ChatState {
  session?: {
    id: string
    expiresAt: number
    verifiedAt?: string
    payerEmail?: string
    transactionId?: string
    providerId?: string
    amountMinor?: number
    currency?: string
  }
  verifiedAt?: string // ISO string timestamp
  currentStepId?: string
}

function getStateKey(conversationId: string): string {
  return `${CHAT_STATE_KEY_PREFIX}${conversationId}`
}

/**
 * GET endpoint - Load minimal state from Redis
 */
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    const key = getStateKey(conversationId)
    const data = await kv.get<ChatState | string>(key)

    if (!data) {
      // No state found - return empty state
      return NextResponse.json({
        success: true,
        state: {},
      })
    }

    // Vercel KV can return either object or string
    const state: ChatState = typeof data === "object" ? data : JSON.parse(data)

    return NextResponse.json({
      success: true,
      state,
    })
  } catch (error) {
    logger.error({ error }, "Chat State API GET error")
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint - Save minimal state to Redis
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { conversationId, session, verifiedAt, currentStepId } = body

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { error: "conversationId is required and must be a string" },
        { status: 400 }
      )
    }

    const key = getStateKey(conversationId)

    // Load existing state to merge
    const existingData = await kv.get<ChatState | string>(key)
    // Vercel KV can return either object or string
    const existingState: ChatState = existingData
      ? typeof existingData === "object"
        ? existingData
        : JSON.parse(existingData)
      : {}

    // Merge new state with existing (only update provided fields)
    const updatedState: ChatState = {
      ...existingState,
      ...(session !== undefined && { session }),
      ...(verifiedAt !== undefined && { verifiedAt }),
      ...(currentStepId !== undefined && { currentStepId }),
    }

    // Save to Redis
    await kv.set(key, JSON.stringify(updatedState), {
      ex: CHAT_STATE_TTL_SECONDS,
    })

    logger.debug({ conversationId, hasSession: !!updatedState.session }, "Saved chat state")

    return NextResponse.json({
      success: true,
      state: updatedState,
    })
  } catch (error) {
    logger.error({ error }, "Chat State API POST error")
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

