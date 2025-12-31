/**
 * HTTP-based MCP endpoint for remote MCP connections
 * Allows AI agents and tools to connect to Coffee Engine over HTTP
 *
 * Usage: POST /api/mcp with MCP JSON-RPC message
 */

import { type NextRequest, NextResponse } from "next/server"
import { verificationService } from "@/services/verification.service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle MCP JSON-RPC 2.0 messages
    const { jsonrpc, method, params, id } = body

    if (jsonrpc !== "2.0") {
      return NextResponse.json({ error: { code: -32600, message: "Invalid JSON-RPC version" } }, { status: 400 })
    }

    // Verify transaction
    if (method === "verify_transaction") {
      const { transactionId, providerId = "bmc", contextId } = params || {}

      if (!transactionId) {
        return NextResponse.json(
          { jsonrpc: "2.0", id, error: { code: -32602, message: "transactionId is required" } },
          { status: 400 },
        )
      }

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
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } },
      { status: 400 },
    )
  } catch (error) {
    console.error("[MCP HTTP] Error:", error)
    return NextResponse.json({ error: { code: -32603, message: "Internal server error" } }, { status: 500 })
  }
}
