/**
 * Rate Limiting Service
 * 
 * Provides reusable rate limiting functionality using Redis (Vercel KV).
 * Supports per-conversation, per-IP, and per-API-key rate limiting.
 */

import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS } from "@/config/chat"
import { logger } from "@/lib/logger"
import { kv } from "@/lib/redis"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: number
}

export interface RateLimitOptions {
  maxRequests?: number
  windowSeconds?: number
  keyPrefix?: string
}

/**
 * Generic rate limiting function.
 * 
 * @param identifier - Unique identifier (conversationId, IP, API key, etc.)
 * @param options - Rate limit configuration options
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    maxRequests = RATE_LIMIT_MAX_REQUESTS,
    windowSeconds = RATE_LIMIT_WINDOW_SECONDS,
    keyPrefix = "ratelimit:",
  } = options

  const key = `${keyPrefix}${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % windowSeconds)

  try {
    // Get current count
    const count = await kv.incr(key)

    // Set expiration on first request in this window
    if (count === 1) {
      await kv.expire(key, windowSeconds)
    }

    const remaining = Math.max(0, maxRequests - count)
    const resetAt = windowStart + windowSeconds

    if (count > maxRequests) {
      logger.warn({ identifier, count, maxRequests }, "Rate limit exceeded")
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }

    return {
      allowed: true,
      remaining,
      resetAt,
    }
  } catch (error) {
    logger.error({ identifier, error }, "Rate limit check failed")
    // Fail closed: deny request on error
    return {
      allowed: false,
      remaining: 0,
      resetAt: undefined,
    }
  }
}

/**
 * Rate limit by IP address.
 */
export async function checkRateLimitByIP(ip: string, options?: RateLimitOptions): Promise<RateLimitResult> {
  return checkRateLimit(ip, {
    ...options,
    keyPrefix: "ratelimit:ip:",
  })
}

/**
 * Rate limit by API key.
 */
export async function checkRateLimitByApiKey(apiKey: string, options?: RateLimitOptions): Promise<RateLimitResult> {
  return checkRateLimit(apiKey, {
    ...options,
    keyPrefix: "ratelimit:apikey:",
  })
}

/**
 * Rate limit by conversation ID.
 */
export async function checkRateLimitByConversation(
  conversationId: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  return checkRateLimit(conversationId, {
    ...options,
    keyPrefix: "ratelimit:chat:",
  })
}

