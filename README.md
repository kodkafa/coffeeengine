# Coffee Engine v2.0 - Modular Payment Verification System

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/kodkafa/coffeeengine)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/4N8UfJaJAVa)

## Overview

Coffee Engine is a production-ready, modular payment verification system designed to gate premium features behind payment walls. Built on Next.js 16 with TypeScript, Zod validation, Vercel KV storage, and AI integration via the AI SDK.

**Live Deployment:** [https://vercel.com/kodkafa/coffeeengine](https://vercel.com/kodkafa/coffeeengine)

## Core Features

### Phase 1: Webhook Intake & Event Processing
- ✅ Provider-agnostic webhook handler supporting Buy Me a Coffee (BMC) with 16+ events
- ✅ Zod schema validation for normalized events
- ✅ Dynamic provider registry (configuration-driven, not hardcoded)
- ✅ Event routing with handler mapping
- ✅ Event storage and retrieval via Vercel KV

### Phase 2: API Layer & Verification
- ✅ RESTful verification endpoint (`POST /api/coffee/verify`) with API key authentication
- ✅ Public verification endpoint (`POST /api/coffee/verify-public`) for frontend use (no auth required)
- ✅ Auth middleware with `x-coffee-api-key` protection
- ✅ OpenAPI specification for Custom GPT integration
- ✅ Typed responses and error handling
- ✅ Health check endpoint (`GET /api/coffee/health`)

### Phase 3: MCP Protocol Integration
- ✅ Model Context Protocol server for AI agents (Claude, Cursor)
- ✅ `verify_transaction` tool exposed to AI models
- ✅ HTTP-based MCP endpoint (`/api/mcp`)
- ✅ Zero logic duplication between HTTP and MCP

### Phase 4: Frontend & AI Chat Interface
- ✅ AI-powered chat interface on homepage with conversational verification flow
- ✅ Modular UI components (VerificationCard, AIChat, SupportLink)
- ✅ Client-side API abstraction (`lib/api-client.ts`)
- ✅ AI integration supporting OpenAI, Anthropic, and Vercel AI Gateway
- ✅ Secure key handling (user keys stay in browser)
- ✅ Premium page showcasing full payment → AI flow
- ✅ Admin dashboard for event browsing and analytics (`/admin/events`)
- ✅ Centralized AI message configuration (`config/messages.json`)

## Architecture

### Directory Structure
```
├── app/
│   ├── api/
│   │   ├── chat/                    # AI chat with verification
│   │   ├── coffee/
│   │   │   ├── health/              # Health check endpoint
│   │   │   ├── verify/              # Payment verification (authenticated)
│   │   │   └── verify-public/       # Payment verification (public, no auth)
│   │   ├── events/                  # Event browser API & stats
│   │   ├── mcp/                     # Model Context Protocol
│   │   ├── openapi/                 # API specification
│   │   └── webhooks/                # Payment provider webhooks
│   ├── admin/
│   │   └── events/                  # Admin dashboard for event browsing
│   ├── premium/                     # Premium feature showcase
│   ├── privacy/                     # Privacy policy
│   ├── page.tsx                     # Homepage (AI chat interface)
│   └── layout.tsx                   # Root layout with navigation
├── components/
│   ├── ai-chat.tsx                  # AI-powered chat with verification flow
│   ├── chat-interface.tsx           # Simple chat component
│   ├── support-link.tsx             # Payment provider support buttons
│   ├── verification-card.tsx        # Transaction verification UI
│   └── ui/                          # Shadcn/UI components
├── config/
│   ├── events.ts                    # Event → handler mapping
│   ├── index.ts                     # Configuration service
│   ├── messages.json                # Centralized AI chat messages
│   └── providers.ts                 # Enabled providers
├── lib/
│   ├── api-client.ts                # Typed API client for frontend
│   ├── auth-middleware.ts           # withAuth() HOF for routes
│   ├── bootstrap.ts                 # Service initialization
│   ├── enums.ts                     # Provider & event types
│   ├── kv.ts                        # Redis/KV client
│   ├── schemas.ts                   # Zod validation schemas
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Utility functions
├── services/
│   ├── event-router.service.ts      # Event → handler routing
│   ├── event-store.service.ts       # Event storage in KV
│   ├── provider-registry.service.ts # Provider registration
│   ├── token-store.service.ts       # Transaction storage
│   ├── verification.service.ts      # Payment verification logic
│   └── handlers/                    # Event handlers
├── providers/
│   └── bmc.provider.ts              # Buy Me a Coffee adapter
└── mcp/
    └── server.ts                    # MCP server implementation
```

### Key Design Principles

**1. Configuration Over Code**
- Add new providers by updating `config/providers.ts`
- Register events in `config/events.ts`
- Customize AI messages in `config/messages.json`
- No bootstrap.ts modifications needed

**2. Type Safety**
- Strict TypeScript with `strict: true`
- Zod schema validation for all webhooks and API requests
- Type-safe service interfaces
- No `any` types allowed

**3. Modularity**
- Providers implement `IWebhookProvider` interface
- Services depend on interfaces, not implementations
- Handlers are pure functions with consistent signatures
- Reusable UI components

**4. Security**
- API key protection on authenticated routes (`/api/coffee/verify`)
- Public endpoint for frontend use (`/api/coffee/verify-public`)
- Row-level security patterns in data storage
- AI API keys stored server-side only (never exposed to frontend)
- Environment variables for secure configuration
- Session-based verification with configurable TTL
- Separate TTLs for transactions, sessions, and events

## Quick Start

### Prerequisites
- Node.js 18+ (or Bun)
- Vercel KV (Upstash Redis) connection
- Environment variables configured

### Setup

1. **Clone and install:**
```bash
git clone <repo>
npm install
# or
bun install
```

2. **Configure environment** (copy `.env.example`):
```bash
cp .env.example .env.local
```

3. **Add environment variables** (edit `.env.local`):
   
   **Required:**
   - `KV_REST_API_URL` - Upstash endpoint
   - `KV_REST_API_TOKEN` - Upstash token
   - `COFFEE_API_KEY` - Your API secret (for authenticated endpoints)
   - `WEBHOOK_SECRET_BMC` - BMC webhook secret
   
   **AI Provider Configuration (choose one):**
   - `AI_PROVIDER` - Set to `"openai"`, `"anthropic"`, or `"vercel-gateway"`
   - `OPENAI_API_KEY` - Required if `AI_PROVIDER=openai`
   - `ANTHROPIC_API_KEY` - Required if `AI_PROVIDER=anthropic`
   - `VERCEL_AI_GATEWAY_URL` - Required if `AI_PROVIDER=vercel-gateway`
   
   **TTL Configuration (Time To Live):**
   - `TRANSACTION_TTL_SECONDS` - Transaction storage TTL (default: 2592000 = 30 days)
   - `USER_SESSION_TTL_SECONDS` - User session TTL for AI chat (default: 86400 = 24 hours)
   - `EVENT_STORAGE_TTL_SECONDS` - Event storage TTL (default: permanent, set to "0" or "permanent" for permanent storage)
   
   **Optional:**
   - `NEXT_PUBLIC_BMC_URL` - Buy Me a Coffee URL

4. **Run development server:**
```bash
npm run dev
# or
bun dev
```

5. **Visit:**
   - Home (AI Chat): `http://localhost:3000`
   - Premium: `http://localhost:3000/premium`
   - Admin Dashboard: `http://localhost:3000/admin/events`
   - API Docs: `http://localhost:3000/api/openapi`

## API Usage

### Verify Transaction (Public Endpoint - Frontend)

```bash
curl -X POST http://localhost:3000/api/coffee/verify-public \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_12345",
    "providerId": "bmc"
  }'
```

**Response:**
```json
{
  "ok": true,
  "valid": true,
  "amountMinor": 50000,
  "currency": "USD",
  "payerEmail": "user@example.com",
  "externalId": "bmc_12345"
}
```

### Verify Transaction (Authenticated Endpoint - Server-to-Server)

```bash
curl -X POST http://localhost:3000/api/coffee/verify \
  -H "Content-Type: application/json" \
  -H "x-coffee-api-key: your_api_key" \
  -d '{
    "transactionId": "txn_12345",
    "providerId": "bmc"
  }'
```

### Health Check

```bash
curl http://localhost:3000/api/coffee/health
```

### Integration with Custom GPT
1. Visit `http://localhost:3000/api/openapi`
2. Copy the OpenAPI spec
3. Add to Custom GPT in ChatGPT UI
4. Verify transactions in your GPT conversations

### MCP Integration
Configure MCP in Claude Desktop:
```json
{
  "mcpServers": {
    "coffee-engine": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "KV_REST_API_URL": "your-url",
        "KV_REST_API_TOKEN": "your-token",
        "COFFEE_API_KEY": "your-key"
      }
    }
  }
}
```

## Frontend Components

### AI Chat Interface
The homepage features an AI-powered chat interface that:
- Guides users through a conversational verification flow
- Shows support buttons (Buy Me a Coffee) when needed
- Displays verification form inline in the chat
- Saves selected payment provider to localStorage
- Provides full AI chat capabilities after verification

### Verification Flow
1. User sends a message
2. AI responds asking about coffee transaction completion
3. User confirms or clicks support button
4. AI asks for transaction ID
5. Verification component appears inline
6. User enters transaction ID
7. Verification completes and unlocks premium features

### Support Link Component
The `SupportLink` component:
- Displays payment provider buttons (extensible for multiple providers)
- Saves selected provider to localStorage
- Triggers callback for chat flow integration
- Currently supports Buy Me a Coffee (configurable)

## Development

### Event Browsing
Visit `/admin/events` to inspect all stored events and transactions with:
- Event type filtering
- Email search
- Revenue statistics
- Event metadata viewing

### Message Customization
Edit `config/messages.json` to customize AI chat messages:
- `firstMessage` - Initial greeting
- `askTransactionId` - Request for transaction ID
- `transactionNotCompleted` - Reminder message
- `verificationSuccess` - Success confirmation
- `supportButtonClicked` - Response to support button click
- `fallback` - Default response

## Deployment

The project automatically deploys to Vercel on git push.

**Build command:** `npm run build`  
**Start command:** `npm start`

Environment variables are configured in Vercel project settings.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Validation:** Zod
- **Storage:** Vercel KV (Upstash Redis)
- **UI:** Shadcn/UI + Tailwind CSS v4
- **AI:** Vercel AI SDK (`@ai-sdk/react`) - supports OpenAI, Anthropic, Vercel AI Gateway
- **Deploy:** Vercel
- **Runtime:** Node.js 18+ or Bun

## Documentation

- [Development Guide](./dev-guide.md) - Detailed architecture docs
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Phase-by-phase breakdown
- [MCP Setup Guide](./MCP_SETUP.md) - Model Context Protocol configuration
- [Custom GPT Setup](./docs/CUSTOM_GPT_SETUP.md) - Integration with ChatGPT
- [Privacy Policy](./app/privacy/page.tsx) - User data handling

## Support

For issues, visit the v0 workspace:
[https://v0.app/chat/4N8UfJaJAVa](https://v0.app/chat/4N8UfJaJAVa)

## How It Works (v0 Sync)

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## License

Built with v0.app - See v0 terms for licensing details.
