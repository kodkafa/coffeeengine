/**
 * Coffee Engine MCP Server
 * Exposes transaction verification as an MCP tool for AI agents (Claude, Cursor, etc.)
 *
 * This server uses stdio transport and can be configured in Claude Desktop or other MCP clients.
 * For development, run: node mcp/server.ts
 *
 * Configuration for Claude Desktop (~/.../Claude/claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "coffee-engine": {
 *       "command": "node",
 *       "args": ["/path/to/coffee-engine/mcp/server.js"]
 *     }
 *   }
 * }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

// Import the verification service from the app
import { verificationService } from "../services/verification.service"

// Create the MCP server instance
const server = new McpServer({
  name: "coffee-engine",
  version: "1.0.0",
})

// Define the verification tool schema using Zod
const VerifyTransactionSchema = z.object({
  transactionId: z.string().describe("The transaction ID to verify (e.g., TXN_12345ABC)"),
  providerId: z.string().optional().default("bmc").describe("Payment provider ID (default: bmc)"),
  contextId: z.string().optional().describe("Optional context identifier for tracking"),
})

// Register the verify transaction tool
server.registerTool(
  "verify_transaction",
  {
    description:
      "Verify a transaction ID from a payment provider (Buy Me a Coffee, Stripe, etc.) to gate premium features. Returns transaction details if valid.",
    inputSchema: VerifyTransactionSchema,
  },
  async ({ transactionId, providerId = "bmc", contextId }) => {
    try {
      // MCP server uses stdio, logger may not work - use console for now
      // In production, consider redirecting to a log file
      if (process.env.NODE_ENV === "development") {
        console.error(`[MCP] Verifying transaction: ${transactionId} for provider: ${providerId}`)
      }

      // Call the verification service
      const result = await verificationService.verify(transactionId, providerId)

      // Format the response for the AI
      const humanReadable = result.valid
        ? `✅ Transaction verified successfully!\n\nAmount: ${result.amountMinor ? (result.amountMinor / 100).toFixed(2) : "N/A"} ${result.currency || "USD"}\nPayer: ${result.payerEmail || "Unknown"}\nDate: ${result.occurredAt || "Unknown"}`
        : `❌ Transaction verification failed: ${result.reason}`

      // Return structured response
      return {
        content: [
          {
            type: "text",
            text: humanReadable,
          },
        ],
        // Include structured data for system processing
        _metadata: {
          valid: result.valid,
          reason: result.reason,
          providerId: result.providerId,
          transactionId: result.externalId,
          amount: result.amountMinor,
          currency: result.currency,
          timestamp: result.occurredAt,
          payerEmail: result.payerEmail,
          contextId,
        },
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[MCP] Error verifying transaction:", error)
      }
      return {
        content: [
          {
            type: "text",
            text: `❌ Error during verification: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      }
    }
  },
)

// Register a health check resource
server.registerResource(
  "health",
  {
    name: "Coffee Engine Health Check",
    mimeType: "text/plain",
    uri: "coffee://health",
  },
  async () => "Coffee Engine MCP Server is running",
)

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // MCP stdio transport - log to stderr
  console.error("[MCP] Coffee Engine server running on stdio transport")
}

main().catch((error) => {
  // MCP fatal error - always log
  console.error("[MCP] Fatal error:", error)
  process.exit(1)
})
