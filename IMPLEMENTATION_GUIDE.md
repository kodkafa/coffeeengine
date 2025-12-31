# Coffee Engine v2.0 - Implementation Guide

## Completed Phases Overview

This guide documents the complete implementation of Coffee Engine v2.0 following the Modular Development Architecture specification. All phases have been successfully implemented.

### Phase 1: Webhook Intake, Zod Validation & Dynamic Registry ✅
- Configuration-driven provider registry (`config/providers.ts`)
- Event routing configuration (`config/events.ts`)
- Zod schema validation for normalized events (`lib/schemas.ts`)
- Type-safe enums for events (`lib/enums.ts`)
- Singleton pattern with exported interfaces for all services

### Phase 2: API Layer, Middleware & OpenAPI ✅
- Auth middleware (`lib/auth-middleware.ts`)
- Verification service with strict typing
- Complete OpenAPI specification at `/api/openapi`
- Webhook handler at `/api/webhooks/[providerId]`
- Verification endpoint at `/api/coffee/verify`

### Phase 3: MCP Protocol Integration ✅
- **New File: `mcp/server.ts`** - Standalone MCP server exposing verification tool
- **New File: `app/api/mcp/route.ts`** - HTTP-based MCP endpoint for remote connections
- Zod schema validation for MCP inputs
- Zero logic duplication - MCP tools call the same `VerificationService`
- Configured for Claude Desktop and other MCP clients

### Phase 4: Frontend Chat & BYO-AI ✅
- **New Component: `components/verification-card.tsx`** - Transaction verification UI
- **New Component: `components/chat-interface.tsx`** - Simple chat with verification gate
- **New Component: `components/ai-chat.tsx`** - Full-featured AI chat with provider support
- **New Library: `lib/api-client.ts`** - Frontend API abstraction
- **New Endpoint: `app/api/chat/route.ts`** - AI chat backend with verification
- **New Page: `app/premium/page.tsx`** - Complete premium flow demo

---

## Architecture Summary

### Layer 1: Configuration Layer (`/config`)
- **providers.ts** - List of enabled providers
- **events.ts** - Event-to-handler mappings
- **index.ts** - Centralized config export

### Layer 2: Core Domain Layer (`/lib`, `/services`)
- **Verification Service** - Pure business logic
- **Event Router Service** - Provider-agnostic routing
- **Token Store Service** - Zod-validated storage
- **Provider Registry Service** - Dynamic registration
- **Auth Middleware** - Reusable authentication

### Layer 3: Provider Adapter Layer (`/providers`)
- **BMC Provider** - Buy Me a Coffee webhook handler
- Implements `IWebhookProvider` interface
- Self-contained with own normalization logic

### Layer 4: Interface Layer (`/app/api`)
- **HTTP Endpoints** - REST API (webhooks, verification, health)
- **MCP Endpoint** - Model Context Protocol support
- **Chat Endpoint** - AI provider integration
- **OpenAPI** - Auto-documented specification

### Layer 5: Frontend Layer (`/components`, `/app`)
- **Verification UI** - Payment verification flow
- **Chat Components** - Simple and AI-powered chat
- **Premium Page** - Full feature showcase
- **API Client** - Type-safe frontend requests

---

## Key Files & Their Purposes

### Newly Created Files

#### Phase 3 - MCP Integration
```
mcp/server.ts              - Standalone MCP server for Claude Desktop
app/api/mcp/route.ts       - HTTP MCP endpoint (remote connections)
```

#### Phase 4 - Frontend & AI
```
lib/api-client.ts                   - Frontend API abstraction layer
components/verification-card.tsx    - Payment verification UI component
components/chat-interface.tsx       - Simple chat with verification gate
components/ai-chat.tsx              - AI-powered chat component
app/api/chat/route.ts               - Chat API with AI provider support
app/premium/page.tsx                - Premium feature demo page
```

#### Phase 1 & 2 (Previously Created)
```
lib/schemas.ts              - Zod validation schemas
lib/enums.ts                - TypeScript enums for type safety
lib/auth-middleware.ts      - Auth HOF for protecting routes
config/providers.ts         - Enabled providers list
config/events.ts            - Event routing configuration
config/index.ts             - Config export
```

---

## Usage Examples

### 1. Verify a Transaction (Frontend)

```typescript
import { apiClient } from '@/lib/api-client';

// In a React component
const result = await apiClient.verifyTransaction('TXN_12345ABC', 'bmc');
if (result.valid) {
  console.log(`Verified ${result.payerEmail} paid ${result.amountMinor / 100} ${result.currency}`);
}
```

### 2. Chat with Verification Gate

```tsx
import { ChatInterface } from '@/components/chat-interface';

export function MyApp() {
  return <ChatInterface onVerified={(result) => console.log(result)} />;
}
```

### 3. AI-Powered Chat with BYO Key

```tsx
import { AIChat } from '@/components/ai-chat';

export function PremiumChat() {
  const [apiKey, setApiKey] = useState('');
  return (
    <AIChat 
      apiKey={apiKey} 
      systemPrompt="You are a premium AI assistant"
    />
  );
}
```

### 4. Configure MCP in Claude Desktop

Edit `~/.../Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coffee-engine": {
      "command": "node",
      "args": ["/path/to/coffee-engine/mcp/server.js"]
    }
  }
}
```

Then in Claude, use the "verify_transaction" tool:
```
User: "Verify transaction TXN_ABC123"
Claude: Uses the verify_transaction MCP tool
Result: "✅ Transaction verified for user@example.com, Amount: $5.00"
```

---

## Security Implementation

### Authentication
- **API Key Protection**: All endpoints requiring authentication use `withAuth()` middleware
- **Header-based Auth**: `x-coffee-api-key` header for API requests
- **Session Tokens**: Frontend maintains optional session after verification

### Data Validation
- **Zod Schemas**: All inputs validated at route entry points
- **Type Safety**: TypeScript strict mode throughout
- **Schema Validation**: Token storage validates against NormalizedEventSchema

### AI Provider Security
- **Client-Side Keys**: User's OpenAI/Anthropic keys stay in browser
- **Never Logged**: API keys are not stored or logged by Coffee Engine
- **Optional: Server Proxy**: For users who prefer server-side proxying
- **No Data Sharing**: User's AI API keys never sent to Coffee Engine

---

## Adding a New Provider

1. **Create Provider Class** (`providers/new-provider.ts`):

```typescript
import type { IWebhookProvider } from '@/types';

export class NewProvider implements IWebhookProvider {
  readonly providerId = 'new-provider';

  async verifyRequest(request: Request): Promise<boolean> {
    // Implement signature verification
  }

  async normalizePayload(payload: unknown): Promise<NormalizedEvent> {
    // Normalize to standard event format
  }
}
```

2. **Register in Config** (`config/providers.ts`):

```typescript
import { NewProvider } from '@/providers/new-provider';

export const ENABLED_PROVIDERS = [
  new BmcProvider(),
  new NewProvider(), // Add here
];
```

3. **Add Event Handlers** (`config/events.ts`):

```typescript
export const EVENT_MAP = [
  { provider: 'new-provider', event: 'payment.created', handler: handleDonation },
  // ...
];
```

---

## Environment Variables

### Required
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
COFFEE_API_KEY=your_secret_api_key
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token
```

### Optional (for providers)
```bash
BMC_WEBHOOK_SECRET=your_bmc_secret
STRIPE_API_KEY=your_stripe_key
```

### Optional (for AI features)
```bash
NEXT_PUBLIC_COFFEE_API_KEY=frontend_api_key (if needed)
```

---

## Deployment

### Deploy to Vercel
```bash
git push origin main
# Auto-deploys via Vercel GitHub integration
```

### MCP Server Deployment
For production MCP usage, either:

1. **As Subprocess** (recommended for Claude Desktop):
   - Run as standalone Node process with stdio transport
   - Requires environment variables accessible to process

2. **As HTTP Server** (recommended for remote):
   - Use `/api/mcp` endpoint
   - Accessible via standard HTTPS

---

## Testing

### Test Transaction Verification
```bash
curl -X POST http://localhost:3000/api/coffee/verify \
  -H "x-coffee-api-key: test-key" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"TXN_TEST"}'
```

### Test OpenAPI Spec
```bash
curl http://localhost:3000/api/openapi | jq .
```

### Test MCP Tool (via Claude Desktop)
- Configure in `claude_desktop_config.json`
- Restart Claude Desktop
- MCP icon appears in bottom toolbar
- Use verify_transaction tool

---

## Troubleshooting

### MCP Server Won't Connect
- Check Node.js version (16+)
- Verify path in claude_desktop_config.json
- Check environment variables
- Run with `node mcp/server.js` to see errors

### Verification Fails
- Confirm transaction exists in KV store
- Check provider ID is correct
- Verify API key if using auth

### AI Chat Not Working
- Ensure API key is set for chosen provider
- Check NEXT_PUBLIC_BASE_URL
- Verify /api/chat endpoint is accessible
- Check browser console for CORS errors

---

## Next Steps

Potential future enhancements:

1. **Phase 5**: Advanced Analytics & Dashboards
2. **Phase 6**: Multi-provider Payment Processing
3. **Phase 7**: Subscription Management
4. **Phase 8**: Custom Branded AI Agents
