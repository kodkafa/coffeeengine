/**
 * State Manager - Server-Authoritative Chat Context Management
 * 
 * Handles loading and saving ChatContext to Redis (Vercel KV).
 * 
 * Key principles:
 * - Server is the source of truth
 * - Client only sends conversationId and message
 * - Context is always fetched from Redis
 * - Default context created if not found
 */

import { stepRegistry } from "@/config/steps"
import { logger } from "@/lib/logger"
import { CHAT_CONTEXT_KEY_PREFIX, CHAT_CONTEXT_TTL_SECONDS, kv } from "@/lib/redis"
import type { ChatContext, ChatMessage } from "./types"

/**
 * Creates a default ChatContext for a new conversation.
 */
function createDefaultContext(): ChatContext {
  return {
    currentStepId: Object.keys(stepRegistry)[0],
    messageCount: 0,
    history: [],
  }
}

/**
 * Gets the Redis key for a conversation context.
 */
function getContextKey(conversationId: string): string {
  return `${CHAT_CONTEXT_KEY_PREFIX}${conversationId}`
}

/**
 * Serializes ChatContext for storage in Redis.
 * 
 * Dates need to be serialized as ISO strings for JSON storage.
 */
function serializeContext(ctx: ChatContext): string {
  const serialized = {
    ...ctx,
    history: ctx.history.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    })),
  }
  return JSON.stringify(serialized)
}

/**
 * Deserializes ChatContext from Redis storage.
 * 
 * Converts ISO string timestamps back to Date objects.
 */
function deserializeContext(data: string): ChatContext {
  const parsed = JSON.parse(data) as {
    currentStepId: string
    messageCount: number
    history: Array<{
      id: string
      role: "user" | "assistant" | "system"
      content: string
      timestamp: string | Date
    }>
    provider?: {
      id: string
      name: string
      url?: string
    }
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
  }

  return {
    ...parsed,
    history: parsed.history.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    })) as ChatMessage[],
  }
}

/**
 * Loads a ChatContext from Redis.
 * 
 * If the context doesn't exist, returns a default initial context.
 * The default context is NOT saved to Redis until the first message is sent.
 * 
 * @param conversationId - The unique conversation identifier
 * @returns The ChatContext (either loaded or default)
 */
export async function loadChatContext(conversationId: string): Promise<ChatContext> {
  const key = getContextKey(conversationId)

  try {
    const data = await kv.get<string>(key)

    if (!data) {
      // Context doesn't exist - return default (not saved yet)
      return createDefaultContext()
    }

    // Deserialize and return
    return deserializeContext(data)
  } catch (error) {
    logger.error({ conversationId, error }, "Error loading context")
    // On error, return default context
    return createDefaultContext()
  }
}

/**
 * Saves a ChatContext to Redis with a 24-hour TTL.
 * 
 * @param conversationId - The unique conversation identifier
 * @param ctx - The ChatContext to save
 */
export async function saveChatContext(conversationId: string, ctx: ChatContext): Promise<void> {
  const key = getContextKey(conversationId)

  try {
    const serialized = serializeContext(ctx)

    // Save with 24-hour TTL
    await kv.set(key, serialized, {
      ex: CHAT_CONTEXT_TTL_SECONDS,
    })

    logger.debug({ conversationId, ttl: CHAT_CONTEXT_TTL_SECONDS }, "Saved context")
  } catch (error) {
    logger.error({ conversationId, error }, "Error saving context")
    throw error
  }
}

/**
 * Deletes a ChatContext from Redis.
 * 
 * @param conversationId - The unique conversation identifier
 */
export async function deleteChatContext(conversationId: string): Promise<void> {
  const key = getContextKey(conversationId)

  try {
    await kv.del(key)
    logger.debug({ conversationId }, "Deleted context")
  } catch (error) {
    logger.error({ conversationId, error }, "Error deleting context")
    throw error
  }
}

/**
 * Checks if a ChatContext exists in Redis.
 * 
 * @param conversationId - The unique conversation identifier
 * @returns true if the context exists, false otherwise
 */
export async function chatContextExists(conversationId: string): Promise<boolean> {
  const key = getContextKey(conversationId)

  try {
    const exists = await kv.exists(key)
    return exists === 1
  } catch (error) {
    logger.error({ conversationId, error }, "Error checking context existence")
    return false
  }
}

