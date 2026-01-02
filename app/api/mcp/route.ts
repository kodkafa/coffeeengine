/**
 * HTTP-based MCP endpoint for remote MCP connections
 * Allows AI agents and tools to connect to Coffee Engine over HTTP
 *
 * Usage: POST /api/mcp with MCP JSON-RPC message
 *
 * Security:
 * - Optional API key authentication (via x-coffee-api-key header)
 * - Rate limiting (30 requests/minute per IP or API key)
 * - Input validation with Zod schema
 */

import { config } from "@/config"
import { getDefaultProviderId } from "@/config/providers"
import { logger } from "@/lib/logger"
import { checkRateLimitByApiKey, checkRateLimitByIP } from "@/services/rate-limit.service"
import { verificationService } from "@/services/verification.service"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

/**
 * MCP request schema for validation
 */
const MCPRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
  id: z.union([z.string(), z.number()]).optional(),
})

/**
 * Verify transaction params schema
 */
const VerifyTransactionParamsSchema = z.object({
  transactionId: z.string().min(1),
  providerId: z.string().optional(),
  contextId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Get client identifier for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
    const apiKey = req.headers.get("x-coffee-api-key")

    // 2. Rate limiting (by API key if provided, otherwise by IP)
    const rateLimitResult = apiKey
      ? await checkRateLimitByApiKey(apiKey)
      : await checkRateLimitByIP(clientIP)

    if (!rateLimitResult.allowed) {
      logger.warn({ apiKey: !!apiKey, clientIP }, "MCP rate limit exceeded")
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Rate limit exceeded",
            data: {
              resetAt: rateLimitResult.resetAt,
            },
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetAt
              ? String(Math.max(1, rateLimitResult.resetAt - Math.floor(Date.now() / 1000)))
              : "60",
          },
        }
      )
    }

    // 3. Optional API key authentication (if provided)
    if (apiKey && apiKey !== config.coffeeApiKey) {
      logger.warn({ clientIP }, "Invalid API key for MCP endpoint")
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Invalid API key",
          },
        },
        { status: 401 }
      )
    }

    // 4. Parse and validate request body
    const body = await req.json()
    const validationResult = MCPRequestSchema.safeParse(body)

    if (!validationResult.success) {
      logger.warn({ error: validationResult.error, clientIP }, "Invalid MCP request format")
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id,
          error: {
            code: -32600,
            message: "Invalid request",
            data: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { jsonrpc, method, params, id } = validationResult.data

    // 5. Handle MCP methods
    if (method === "verify_transaction") {
      // Validate params
      const paramsValidation = VerifyTransactionParamsSchema.safeParse(params)

      if (!paramsValidation.success) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32602,
              message: "Invalid params",
              data: paramsValidation.error.errors,
            },
          },
          { status: 400 }
        )
      }

      const { transactionId, providerId = getDefaultProviderId(), contextId } = paramsValidation.data

      logger.info({ transactionId, providerId, contextId, clientIP }, "MCP verify_transaction request")

      const result = await verificationService.verify(transactionId, providerId)

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          valid: result.valid,
          reason: result.reason,
          providerId: result.providerId,
          externalId: result.externalId,
          amountMinor: result.amountMinor,
          currency: result.currency,
          occurredAt: result.occurredAt,
          payerEmail: result.payerEmail,
          contextId,
        },
      })
    }

    // Unknown method
    logger.warn({ method, clientIP }, "Unknown MCP method")
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Unknown method: ${method}`,
        },
      },
      { status: 400 }
    )
  } catch (error) {
    logger.error({ error }, "MCP HTTP error")
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
      },
      { status: 500 }
    )
  }
}
