/**
 * Redis Client
 * 
 * Exports the Vercel KV (Redis-compatible) client instance.
 * This is used for server-authoritative state management.
 */

import { kv } from "@/lib/kv"

export { kv }

/**
 * Redis key prefix for chat contexts.
 */
export const CHAT_CONTEXT_KEY_PREFIX = "chat:context:"

/**
 * TTL for chat contexts (24 hours in seconds).
 */
export const CHAT_CONTEXT_TTL_SECONDS = 24 * 60 * 60 // 24 hours

