# Coffee Engine MCP (Model Context Protocol) Setup Guide

## What is MCP?

MCP is an open protocol that allows AI agents (Claude, Cursor, Custom GPTs) to access tools and data from external services. Coffee Engine's MCP server exposes a `verify_transaction` tool that AI agents can use to verify payments.

## Setup Scenarios

### Scenario 1: Claude Desktop (Local)

This is the simplest setup for personal use.

#### Prerequisites
- [Claude Desktop](https://claude.ai/download) (macOS/Windows)
- Node.js 16+ installed
- Coffee Engine project cloned

#### Steps

1. **Build the MCP Server**
   ```bash
   cd /path/to/coffee-engine
   npm install
   npm run build  # If not done automatically
   ```

2. **Get the Absolute Path**
   ```bash
   pwd  # macOS/Linux
   cd   # Windows (use: echo %cd%)
   # Copy the output path
   ```

3. **Edit Claude Desktop Config**
   
   **macOS/Linux:**
   ```bash
   code "~/Library/Application Support/Claude/claude_desktop_config.json"
   ```
   
   **Windows:**
   ```bash
   code "%APPDATA%\Claude\claude_desktop_config.json"
   ```

4. **Add Coffee Engine Server**
   ```json
   {
     "mcpServers": {
       "coffee-engine": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/coffee-engine/mcp/server.js"]
       }
     }
   }
   ```

5. **Restart Claude Desktop**
   - Close Claude completely
   - Reopen it
   - Look for MCP icon in bottom toolbar

6. **Test the Tool**
   In Claude, ask:
   ```
   Use the verify_transaction tool to check transaction TXN_12345ABC
   ```

### Scenario 2: Vercel Deployment (Production)

For production use, deploy the MCP endpoint as an HTTP route.

#### Prerequisites
- Coffee Engine deployed to Vercel
- Environment variables configured

#### Steps

1. **MCP Endpoint is Already Active**
   - Located at: `https://your-domain.com/api/mcp`
   - Uses standard JSON-RPC 2.0 protocol

2. **Configure External Tools**
   
   **For Custom GPT:**
   ```json
   {
     "schema": {
       "type": "object",
       "properties": {
         "endpoint": {
           "type": "string",
           "value": "https://your-domain.com/api/mcp"
         },
         "tool": {
           "type": "string",
           "value": "verify_transaction"
         }
       }
     }
   }
   ```

3. **API Request Example**
   ```bash
   curl -X POST https://your-domain.com/api/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "method": "verify_transaction",
       "params": {
         "transactionId": "TXN_ABC123",
         "providerId": "bmc",
         "contextId": "user_123"
       },
       "id": 1
     }'
   ```

### Scenario 3: Cursor IDE Integration

Cursor has built-in MCP support for enhanced AI coding capabilities.

#### Steps

1. **In Cursor Settings:**
   - Go to Settings → MCP Servers
   - Click "Add Server"
   - Name: "Coffee Engine"
   - Command: `node`
   - Args: `["/path/to/coffee-engine/mcp/server.js"]`

2. **Use in AI Assistance:**
   ```
   @mcp Check if transaction TXN_ABC is verified
   ```

3. **In Code Comments:**
   ```typescript
   // @coffee-verify(TXN_ABC)
   // Use the verify_transaction MCP tool to verify
   ```

---

## Available MCP Tools

### `verify_transaction`

Verifies a transaction from a payment provider.

**Parameters:**
- `transactionId` (string, required): Transaction ID to verify
- `providerId` (string, optional, default: "bmc"): Payment provider
- `contextId` (string, optional): Context for tracking

**Response:**
```json
{
  "valid": true,
  "reason": "Transaction verified successfully",
  "providerId": "bmc",
  "externalId": "TXN_ABC123",
  "amountMinor": 500,
  "currency": "USD",
  "occurredAt": "2025-01-15T10:30:00Z",
  "payerEmail": "supporter@example.com",
  "contextId": "user_123"
}
```

**Error Response:**
```json
{
  "valid": false,
  "reason": "Transaction not found or expired"
}
```

---

## MCP Server Architecture

### File: `mcp/server.ts`

```
┌─────────────────────────────────────┐
│   MCP Server (stdio transport)      │
├─────────────────────────────────────┤
│  Registers: verify_transaction tool │
│  Connects to: VerificationService   │
│  Returns: Human-readable + JSON     │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│    VerificationService              │
├─────────────────────────────────────┤
│  - Fetches from TokenStore          │
│  - Validates against Zod schema     │
│  - Returns structured result        │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│    Vercel KV (Redis)                │
├─────────────────────────────────────┤
│  - Stores: txn:{providerId}:{txId}  │
│  - Type: NormalizedEvent (Zod)      │
└─────────────────────────────────────┘
```

### File: `app/api/mcp/route.ts`

HTTP endpoint for remote MCP connections. Same logic, different transport:

```
┌─────────────────────────────────────┐
│   HTTP POST /api/mcp                │
│   (JSON-RPC 2.0)                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│    Parse JSON-RPC Request           │
├─────────────────────────────────────┤
│  - Check jsonrpc version            │
│  - Route to handler (verify_tx...)  │
│  - Validate params with Zod         │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│    VerificationService              │
│    (Same as stdio version)          │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Cannot find module @modelcontextprotocol/sdk"

**Solution:**
```bash
npm install @modelcontextprotocol/sdk
npm run build
```

### Issue: MCP Icon Doesn't Appear in Claude

**Check:**
1. Restart Claude completely (not just close)
2. Verify node path in config is correct
3. Test MCP server manually:
   ```bash
   node /path/to/coffee-engine/mcp/server.js
   # Type: {"jsonrpc":"2.0","method":"tools/list","id":1}
   # Should return list of tools
   ```
4. Check application logs for errors

### Issue: "Timeout waiting for MCP response"

**Possible causes:**
- VerificationService is slow (check KV access)
- Environment variables not set
- Transaction doesn't exist

**Debug:**
```bash
# Add logging to mcp/server.ts
console.error("[MCP] Verifying...", { transactionId, providerId })
```

### Issue: HTTP MCP endpoint returns 404

**Check:**
1. App is deployed to Vercel
2. Route file exists at `app/api/mcp/route.ts`
3. Environment variables are set

**Test:**
```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"unknown","id":1}'
# Should return error about unknown method, not 404
```

---

## Security Considerations

### MCP Server (Stdio)
- Runs locally on user's machine
- Inherits environment variables
- No network exposure (unless explicitly proxied)
- Ensure `KV_REST_API_TOKEN` is secure

### MCP Endpoint (HTTP)
- Publicly accessible
- No authentication required (optional: add `x-coffee-api-key`)
- Rate limit recommendations:
  ```
  100 requests/minute per IP
  1000 requests/hour per API key
  ```
- Consider using Vercel's edge middleware for rate limiting

### Best Practices
1. Keep `KV_REST_API_TOKEN` secret
2. Rotate `COFFEE_API_KEY` regularly
3. Monitor MCP tool usage in logs
4. Test with sample transactions only

---

## Advanced: Custom MCP Tools

To add more tools to the MCP server:

```typescript
// In mcp/server.ts

server.registerTool(
  "get_user_transactions",
  {
    description: "Get all transactions for a user",
    inputSchema: z.object({
      userEmail: z.string().email()
    })
  },
  async ({ userEmail }) => {
    // Implementation
    return { content: [...] }
  }
)
```

Then use in Claude:
```
Get all transactions for user@example.com
```

---

## References

- [MCP Specification](https://modelcontextprotocol.io)
- [Claude Desktop Docs](https://claude.ai/docs)
- [Coffee Engine API Docs](https://your-domain.com/api/openapi)
