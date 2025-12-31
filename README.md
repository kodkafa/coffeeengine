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

### Phase 2: API Layer & Verification
- ✅ RESTful verification endpoint (`POST /api/coffee/verify`)
- ✅ Auth middleware with `x-coffee-api-key` protection
- ✅ OpenAPI specification for Custom GPT integration
- ✅ Typed responses and error handling

### Phase 3: MCP Protocol Integration
- ✅ Model Context Protocol server for AI agents (Claude, Cursor)
- ✅ `verify_transaction` tool exposed to AI models
- ✅ HTTP-based MCP endpoint (`/api/mcp`)
- ✅ Zero logic duplication between HTTP and MCP

### Phase 4: Frontend & BYO-AI
- ✅ Modular UI components (VerificationCard, ChatInterface, AIChat)
- ✅ Client-side API abstraction (`lib/api-client.ts`)
- ✅ AI integration supporting OpenAI, Anthropic, and Vercel AI Gateway
- ✅ Secure key handling (user keys stay in browser)
- ✅ Premium page showcasing full payment → AI flow

## Architecture

### Directory Structure
```
├── app/
│   ├── api/
│   │   ├── chat/               # AI chat with verification
│   │   ├── coffee/verify/      # Payment verification endpoint
│   │   ├── events/             # Event browser API
│   │   ├── mcp/                # Model Context Protocol
│   │   ├── openapi/            # API specification
│   │   ├── webhooks/           # Payment provider webhooks
│   │   └── dev/                # Development utilities
│   ├── dev/                    # Tester pages
│   ├── premium/                # Premium feature showcase
│   ├── privacy/                # Privacy policy
│   └── layout.tsx              # Root layout with navigation
├── components/
│   ├── ai-chat.tsx             # AI-powered chat component
│   ├── chat-interface.tsx      # Simple chat component
│   ├── verification-card.tsx   # Transaction verification UI
│   └── ui/                     # Shadcn/UI components
├── lib/
│   ├── api-client.ts           # Typed API client for frontend
│   ├── auth-middleware.ts      # withAuth() HOF for routes
│   ├── bootstrap.ts            # Service initialization
│   ├── enums.ts                # Provider & event types
│   ├── kv.ts                   # Redis/KV client
│   ├── schemas.ts              # Zod validation schemas
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Utility functions
├── services/
│   ├── event-router.service.ts      # Event → handler routing
│   ├── event-store.service.ts       # Event storage in KV
│   ├── provider-registry.service.ts # Provider registration
│   ├── token-store.service.ts       # Transaction storage
│   ├── verification.service.ts      # Payment verification logic
│   └── handlers/                    # Event handlers
├── providers/
│   └── bmc.provider.ts         # Buy Me a Coffee adapter
├── config/
│   ├── index.ts                # Configuration service
│   ├── events.ts               # Event → handler mapping
│   └── providers.ts            # Enabled providers
└── mcp/
    └── server.ts               # MCP server implementation
```

### Key Design Principles

**1. Configuration Over Code**
- Add new providers by updating `config/providers.ts`
- Register events in `config/events.ts`
- No bootstrap.ts modifications needed

**2. Type Safety**
- Strict TypeScript with `strict: true`
- Zod schema validation for all webhooks
- Type-safe service interfaces

**3. Modularity**
- Providers implement `IWebhookProvider` interface
- Services depend on interfaces, not implementations
- Handlers are pure functions with consistent signatures

**4. Security**
- API key protection on all `/api/coffee/*` routes
- Row-level security patterns in data storage
- User AI keys never sent to Coffee Engine

## Quick Start

### Prerequisites
- Node.js 18+
- Vercel KV (Upstash Redis) connection
- Environment variables configured

### Setup

1. **Clone and install:**
```bash
git clone <repo>
npm install
```

2. **Configure environment** (copy `.env.local.example`):
```bash
cp .env.local.example .env.local
```

3. **Add environment variables** in v0 sidebar (Vars section):
   - `KV_REST_API_URL` - Upstash endpoint
   - `KV_REST_API_TOKEN` - Upstash token
   - `COFFEE_API_KEY` - Your API secret
   - `WEBHOOK_SECRET_BMC` - BMC webhook secret
   - `TOKEN_TTL_SECONDS` - Token expiration (default: 2592000)

4. **Run development server:**
```bash
npm run dev
```

5. **Visit:**
   - Home: `http://localhost:3000`
   - Premium: `http://localhost:3000/premium`
   - Webhook Tester: `http://localhost:3000/dev/webhook-tester`
   - API Docs: `http://localhost:3000/api/openapi`

## API Usage

### Verify Transaction
```bash
curl -X POST http://localhost:3000/api/coffee/verify \
  -H "Content-Type: application/json" \
  -H "x-coffee-api-key: your_api_key" \
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

## Development

### Webhook Testing
Visit `/dev/webhook-tester` to simulate BMC webhooks without real payments.

### Event Browsing
Visit `/dev/events` to inspect all stored events and transactions.

### Verification Testing
Visit `/dev/verify-tester` to test the verification endpoint.

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
- **AI:** Vercel AI SDK (supports OpenAI, Anthropic, Vercel AI Gateway)
- **Deploy:** Vercel

## Documentation

- [Development Guide](./dev-guide.md) - Detailed architecture docs
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Phase-by-phase breakdown
- [MCP Setup Guide](./MCP_SETUP.md) - Model Context Protocol configuration
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
