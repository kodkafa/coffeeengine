# Coffee Engine - Modular Payment Verification System


[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/kodkafa/coffeeengine)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/4N8UfJaJAVa)

## Overview
**Monetize your Custom GPTs & AI APIs with ease.**

Coffee Engine is a **production-ready**, modular payment verification system designed to gate premium features behind payment walls. Securely verify payments and unlock the full potential of your AI tools.

### Live Demos

| Platform | Description | Link |
| :--- | :--- | :--- |
| **Web App** | Full functionality demo | [**Launch Demo App** ↗](https://coffeeengine.vercel.app) |
| **ChatGPT** | Custom GPT demo | [**Try Custom GPT** ↗](https://chatgpt.com/g/g-695529d612d08191af7f52a9f5424ccb-coffee-engine) |

---


## Architecture

### Step Engine System

Coffee Engine uses a **modular step-based conversation flow** architecture. The system is built around a minimal orchestrator (`StepEngine`) that executes steps, each containing their own business logic.

#### Core Concepts

**StepEngine** (`engine/step-engine.ts`):
- Minimal orchestrator that locates and executes steps
- Does NOT contain business logic - only orchestration
- Handles context updates, step transitions, and message history
- Works universally (browser and server environments)

**Steps** (`steps/*.ts`):
- Each step is a self-contained module with its own business logic
- Steps communicate via system messages (hidden from UI)
- Steps can transition to other steps using `nextStepId`
- Steps can update context using `ctxPatch`
- Steps can render UI components via `ui` field

**Step Flow**:
1. User sends a message → `StepEngine.dispatch(ctx, input)`
2. Engine locates active step from `ctx.currentStepId`
3. Step executes with context and input
4. Step returns `StepResult` with messages, UI, and optional transition
5. Engine applies context updates and transitions if needed
6. Auto-advance utility handles step transitions without UI

#### Available Steps

1. **FAQ Step** (`steps/faq.ts`):
   - Initial step - displays FAQ buttons
   - Matches user input to FAQ questions
   - Transitions to `first_coffee` if no match

2. **First Coffee Step** (`steps/first-coffee.ts`):
   - Triggered when FAQ doesn't match (first time)
   - Shows paywall message and provider selector
   - Handles provider selection
   - Transitions to `provider_message` after selection

3. **Coffee Break Step** (`steps/coffee-break.ts`):
   - Triggered when session timer expires
   - Shows "need coffee again" messages
   - Displays provider selector for re-verification
   - Handles provider selection

4. **Provider Message Step** (`steps/provider-message.ts`):
   - Shows provider confirmation message
   - Transitions to `verify` step

5. **Verify Step** (`steps/verify.ts`):
   - Collects transaction ID via verification card UI
   - Calls `/api/coffee/verify-public` to validate transaction
   - Creates secure session object on success
   - Transitions to `ai_chat` after successful verification

6. **AI Chat Step** (`steps/ai-chat.ts`):
   - Validates session on every input
   - Calls `/api/ai/generate` for AI responses
   - Falls back to `coffee_break` if session expired
   - Renders conversation starters when verified

#### Step Communication

Steps communicate using **system messages** (hidden from UI):
- Internal commands like `"provider:bmc"` are stored as system messages
- System messages are automatically filtered from UI display in `components/chat.tsx`
- Steps can read context and history to make decisions
- System messages are stored in message history but never shown to users

#### Context Management

**ChatContext** (`types/engine.ts`):
- `currentStepId`: Active step identifier
- `session`: User session object (created after verification)
- `provider`: Selected payment provider
- `history`: Message history (user, assistant, system)
- `messageCount`: Total message count

**State Persistence**:
- Minimal state (session, verifiedAt, currentStepId) stored in Redis
- Chat messages stay in-memory only (not persisted)
- State loaded from Redis on page refresh
- State saved to Redis after verification and step transitions

#### Auto-Advance Utility

`engine/utils/auto-advance.ts`:
- Automatically advances through steps when a step transitions but has no UI
- Prevents blank states by getting initial UI from next step
- Has maximum depth limit to prevent infinite loops

### Provider System

Coffee Engine uses a **provider-agnostic architecture** for payment verification. Providers are registered dynamically and implement a common interface. Each provider is a self-contained module with its own webhook handling, event normalization, and handler mapping.

#### Provider Interface

**WebhookProvider** (`types/index.ts`):
```typescript
interface WebhookProvider {
  providerId: string
  verifyRequest(headers: Headers, body: string, secret: string): Promise<boolean>
  normalizePayload(payload: unknown): Promise<NormalizedEvent>
  controlEvent(event: NormalizedEvent): Promise<EventControlResult>
  getEventMap?(): ProviderEventMap[]
}
```

**Required Methods**:
- `verifyRequest()`: Validates webhook signature/authenticity
- `normalizePayload()`: Converts provider-specific format to `NormalizedEvent`
- `controlEvent()`: Processes event after verification, calculates TTL, generates thanks message
- `getEventMap()` (optional): Returns event → handler mappings

#### Provider Structure

Each provider lives in `providers/{providerId}/` directory with the following structure:

```
providers/
└── bmc/
    ├── bmc.provider.ts      # Main provider class implementing WebhookProvider
    ├── bmc.map.ts           # Event → handler mapping
    ├── bmc.handler.ts       # Event handler functions
    ├── bmc.events.ts        # TypeScript type definitions for webhook events
    └── config.ts            # Provider metadata configuration
```

**Provider Files Explained**:

1. **`{provider}.provider.ts`** - Main provider implementation:
   - Implements `WebhookProvider` interface
   - `verifyRequest()`: Validates webhook signature
   - `normalizePayload()`: Converts webhook payload to `NormalizedEvent`
   - `controlEvent()`: Processes event after verification, calculates TTL, generates templated thanks message
   - `getEventMap()`: Returns event → handler mappings
   - Private normalization methods for each event type

2. **`{provider}.map.ts`** - Event mapping:
   - Defines array of `{ event: string, handler: EventHandler }` pairs
   - Maps provider-specific event types to handler functions
   - Exported as constant (e.g., `BMC_EVENT_MAP`)

3. **`{provider}.handler.ts`** - Event handlers:
   - Pure functions: `(event: NormalizedEvent) => Promise<void>`
   - Handlers store events and transactions in Redis
   - Special handlers (e.g., `handleDonation`) create transaction records
   - Generic handlers (e.g., `handleGenericEvent`) only store events

4. **`{provider}.events.ts`** - Type definitions:
   - TypeScript interfaces for provider-specific webhook payloads
   - Defines event types, data structures, and webhook format
   - Used for type safety in normalization methods

5. **`config.ts`** - Provider metadata:
   - Exports `ProviderMetadata` object
   - Contains: `providerId`, `name`, `description`, `secretEnvVar`, `enabled`, `url`, `icon`
   - Used for UI display and configuration

#### Provider Registration

**Configuration** (`config/providers.ts`):
- `ENABLED_PROVIDERS`: Array of provider instances (e.g., `[new BmcProvider()]`)
- `PROVIDER_CONFIGS`: Array of provider metadata configurations
- `PROVIDER_METADATA`: Map of providerId → metadata
- Helper functions: `getAllProviderMetadata()`, `getProviderMetadata()`, `getProviderName()`

**Bootstrap Process** (`lib/bootstrap.ts`):
1. Iterates through `ENABLED_PROVIDERS` array
2. Registers each provider in `ProviderRegistryService`
3. If provider has `getEventMap()` method:
   - Registers events in `ProviderRegistryService`
   - Registers each event → handler mapping in `EventRouterService`
4. Logs total provider and event count

**Provider Registry** (`services/provider-registry.service.ts`):
- Singleton service managing all registered providers
- Stores providers in `Map<string, WebhookProvider>`
- Stores event mappings in `Map<string, ProviderEventMap[]>`
- Methods: `register()`, `registerEvents()`, `resolve()`, `getEvents()`, `getAll()`, `isRegistered()`

#### Buy Me a Coffee Provider

**Implementation** (`providers/bmc/bmc.provider.ts`):

**Class Structure**:
```typescript
export class BmcProvider implements WebhookProvider {
  readonly providerId = "bmc"
  
  getEventMap(): ProviderEventMap[]
  async verifyRequest(...): Promise<boolean>
  async normalizePayload(...): Promise<NormalizedEvent>
  
  // Private normalization methods:
  private normalizeDonation(...): NormalizedEvent
  private normalizeMembership(...): NormalizedEvent
  private normalizeExtra(...): NormalizedEvent
  private normalizeShopOrder(...): NormalizedEvent
  private normalizeSubscription(...): NormalizedEvent
}
```

**Webhook Verification** (`verifyRequest()`):
1. Receives webhook at `/api/webhooks/bmc`
2. Extracts signature from `x-signature-sha256` header
3. Computes HMAC SHA-256 hash: `crypto.createHmac("sha256", secret).update(body).digest("hex")`
4. Compares signatures using `crypto.timingSafeEqual()` (prevents timing attacks)
5. Returns `true` if match, `false` otherwise
6. Logs warnings if secret missing or signature header absent

**Payload Normalization** (`normalizePayload()`):
- Accepts unknown payload, validates structure
- Routes to appropriate normalization method based on `webhook.type`
- Each normalization method extracts:
  - `providerId`: Always `"bmc"`
  - `eventType`: Original webhook type (e.g., `"donation.created"`)
  - `externalId`: Transaction ID (varies by event type)
  - `amountMinor`: Amount in minor units (cents)
  - `currency`: Currency code (e.g., `"USD"`)
  - `payerEmail`: Supporter email
  - `occurredAt`: ISO timestamp
  - `rawPayload`: Original webhook payload
  - `eventMetadata`: Event-specific data (supporter name, coffee count, etc.)

**Event Types Supported** (16 total):
- **Donations**: `donation.created`, `donation.updated`, `donation.refunded`
- **Memberships**: `membership.started`, `membership.renewed`, `membership.cancelled`, `membership.ended`
- **Extras**: `extra.created`, `extra.updated`
- **Shop Orders**: `shop.order.created`, `shop.order.completed`, `shop.order.cancelled`
- **Subscriptions**: `subscription.created`, `subscription.updated`, `subscription.cancelled`, `subscription.payment_succeeded`, `subscription.payment_failed`

**Event Mapping** (`providers/bmc/bmc.map.ts`):
- Defines `BMC_EVENT_MAP` array with 16 event → handler pairs
- `donation.*` events → `handleDonation` (stores transaction)
- All other events → `handleGenericEvent` (stores event only)

**Event Handlers** (`providers/bmc/bmc.handler.ts`):
- `handleDonation()`: Stores event in event store AND creates transaction record in token store
- `handleGenericEvent()`: Stores event in event store only (no transaction record)

**Type Definitions** (`providers/bmc/bmc.events.ts`):
- `BmcWebhook<T>`: Generic webhook wrapper with `type`, `live_mode`, `attempt`, `created`, `event_id`, `data`
- `BmcEventType`: Union of 16 event type strings
- Data interfaces: `BmcDonationData`, `BmcMembershipData`, `BmcExtraData`, `BmcShopOrderData`, `BmcSubscriptionData`
- Type exports for each webhook variant

**Configuration** (`providers/bmc/config.ts`):
- Exports `bmcConfig: ProviderMetadata`
- `providerId: "bmc"`
- `name: "Buy Me a Coffee"`
- `secretEnvVar: "WEBHOOK_SECRET_BMC"`
- `url`: From `NEXT_PUBLIC_BMC_URL` env var or default
- `icon: "Coffee"` (lucide-react icon name)

#### Webhook Processing Flow

1. **Webhook Receipt** (`app/api/webhooks/[providerId]/route.ts`):
   - Receives POST request at `/api/webhooks/bmc`
   - Extracts `providerId` from URL params
   - Resolves provider from `ProviderRegistryService`

2. **Signature Verification**:
   - Gets provider secret from config
   - Calls `provider.verifyRequest(headers, body, secret)`
   - Returns 401 if signature invalid

3. **Payload Normalization**:
   - Parses request body as JSON
   - Calls `provider.normalizePayload(payload)`
   - Returns normalized `NormalizedEvent` object

4. **Event Routing**:
   - Calls `eventRouter.dispatch(normalizedEvent)`
   - Event router looks up handler from registered mappings
   - Handler executes (stores event/transaction)

5. **Response**:
   - Returns `{ ok: true, received: true }` to provider
   - Logs success/failure

#### Event Routing

**Event Router** (`services/event-router.service.ts`):
- Singleton service managing event → handler mappings
- `registerHandler(providerId, event, handler)`: Registers handler for specific event
- `dispatch(event)`: Looks up handler and executes it
- Handlers are pure functions: `(event: NormalizedEvent) => Promise<void>`

**Handler Registration**:
- During bootstrap, each provider's `getEventMap()` is called
- Each `{ event, handler }` pair is registered with event router
- Handler key format: `{providerId}:{eventType}` (e.g., `"bmc:donation.created"`)

**Handler Execution**:
- Event router extracts `providerId` and `eventType` from normalized event
- Looks up handler using key `{providerId}:{eventType}`
- Executes handler with normalized event
- Handles errors gracefully (logs but doesn't crash)

#### Transaction Storage

**Token Store** (`services/token-store.service.ts`):
- Stores verified transactions for verification lookups
- Key format: `txn:{providerId}:{externalId}` (e.g., `txn:bmc:bmc_12345`)
- TTL: Configurable (default: 30 days)
- Used by verification service to check if transaction exists
- Only donation events create transaction records

**Event Store** (`services/event-store.service.ts`):
- Stores all normalized events for analytics and browsing
- Key format: `event:{providerId}:{externalId}`
- TTL: Configurable (default: permanent)
- Provides event browsing API (`/api/events`)
- Used by admin dashboard for event inspection

#### Adding a New Provider

See the detailed guide: [Adding a New Provider](./docs/adding-a-provider.md)

Quick steps:
1. Create provider directory: `providers/{providerId}/`
2. Implement provider class with `verifyRequest()`, `normalizePayload()`, and `controlEvent()` methods
3. Define event mapping and handlers
4. Create provider configuration with metadata and messages
5. Register in `config/providers.ts`
6. Add webhook secret environment variable

#### Transaction Storage

**Token Store** (`services/token-store.service.ts`):
- Stores verified transactions in Redis
- Key format: `txn:{providerId}:{externalId}`
- TTL: Configurable (default: 30 days)
- Used for verification lookups

**Event Store** (`services/event-store.service.ts`):
- Stores all normalized events for analytics and browsing
- Key format: `event:{providerId}:{externalId}`
- TTL: Configurable via `EVENT_STORAGE_TTL_SECONDS` (default: permanent)
- Methods: `storeEvent()`, `getEvent()`, `getProviderEvents()`, `getEventStats()`
- All events are stored (donations, memberships, subscriptions, etc.)
- Provides event browsing API (`/api/events`) and admin dashboard

#### Verification Service

**Verification Service** (`services/verification.service.ts`):
- Singleton service for transaction verification
- `verify(transactionId, providerId)`: Verifies a single transaction
- `verifyBulk(transactionIds[], providerId)`: Verifies multiple transactions
- Looks up transaction in token store by `providerId` and `transactionId`
- Returns `VerificationResult` with:
  - `valid`: Boolean indicating if transaction exists
  - `reason`: Human-readable reason
  - `providerId`, `externalId`, `amountMinor`, `currency`, `payerEmail`, `occurredAt` (if valid)

**Verification Flow**:
1. User provides transaction ID (e.g., `"bmc_12345"`)
2. Verification service calls `tokenStore.retrieve(providerId, transactionId)`
3. If found in Redis → returns valid result with transaction details
4. If not found → returns invalid result with reason
5. Used by `/api/coffee/verify` and `/api/coffee/verify-public` endpoints

### Verification Flow

1. **User initiates verification**:
   - Selects payment provider (Buy Me a Coffee, etc.)
   - Enters transaction ID in verification card

2. **Verification request** (`steps/verify.ts`):
   - Calls `/api/coffee/verify-public` with transaction ID
   - Backend looks up transaction in Redis
   - Returns verification result

3. **Event control** (`/api/coffee/control-event`):
   - After successful verification, calls provider's `controlEvent()` method
   - Provider calculates coffee count, TTL, and generates templated thanks message
   - Transaction is flagged as "used" in Redis to prevent reuse
   - Returns `EventControlResult` with `verifiedAt`, `TTL`, and `thanksMessage`

4. **Session creation**:
   - Creates secure session object using control result
   - Session includes: `id`, `expiresAt`, `verifiedAt`, `payerEmail`, `transactionId`
   - Session stored in context and Redis
   - Uses templated thanks message from provider (not hardcoded)

5. **Access granted**:
   - Transitions to `ai_chat` step
   - User can now use AI features
   - Session validated on every AI request

6. **Session expiration**:
   - Timer tracks session expiration
   - On expire, transitions to `coffee_break` step
   - User must verify again to continue

**Transaction Flagging**:
- After successful `controlEvent()`, transaction is marked as "used" in Redis
- Prevents the same transaction ID from being verified multiple times
- Key format: `txn:used:{providerId}:{externalId}`

### AI Integration

**AI Generation API** (`app/api/ai/generate/route.ts`):
- Server-side endpoint for AI text generation
- Supports OpenAI, Anthropic, Vercel AI Gateway
- Validates session before processing
- Uses system prompt from configuration
- Returns AI response as text

**AI Chat Step** (`steps/ai-chat.ts`):
- Validates session on every input
- Calls `/api/ai/generate` with conversation history
- Filters system messages from history
- Handles errors gracefully
- Falls back to `coffee_break` if session expired

### Frontend Architecture

**Chat Component** (`components/chat.tsx`):
- Pure UI component (no business logic)
- Manages in-memory context and messages
- Instantiates `StepEngine` and calls `dispatch()`
- Automatically filters system messages from display (messages with `role: "system"`)
- Handles markdown rendering for AI responses
- Manages conversation starters after verification
- Exposes `sendMessage` function via `onSendMessageReady` callback

**Context Provider** (`contexts/chat-context.tsx`):
- React Context for session state management
- Provides `hasSession`, `verifiedAt`, `setSession`
- Manages timer expire callback registration
- Used by timer and chat components

**State Persistence**:
- Initial load: Fetches minimal state from Redis (`/api/chat/state`)
- After verification: Saves session, verifiedAt, currentStepId to Redis
- On step transition: Updates currentStepId in Redis
- Messages never persisted (in-memory only)

### Directory Structure
```
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   └── generate/            # AI text generation endpoint
│   │   ├── chat/
│   │   │   ├── route.ts             # Chat API (legacy, full context)
│   │   │   └── state/               # Minimal state API (session, verifiedAt, currentStepId)
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
│   ├── (chat)/
│   │   └── page.tsx                 # Homepage (AI chat interface)
│   └── layout.tsx                   # Root layout with navigation
├── components/
│   ├── chat.tsx                     # Main chat component (pure UI)
│   ├── coffee-timer.tsx             # Session timer component
│   ├── steps/
│   │   ├── verification-card.tsx   # Transaction verification UI
│   │   ├── provider-selector.tsx   # Payment provider selector
│   │   └── faq-buttons.tsx          # FAQ buttons component
│   └── ui/                          # Shadcn/UI components
├── contexts/
│   └── chat-context.tsx             # React Context for session state
├── config/
│   ├── chat-messages.json          # Centralized AI chat messages
│   ├── events.ts                    # Event → handler mapping
│   ├── index.ts                     # Configuration service
│   ├── providers.ts                 # Enabled providers
│   └── steps.ts                      # Step registry and StepId enum
├── engine/
│   ├── step-engine.ts               # Minimal step orchestrator
│   ├── state-manager.ts             # Redis context management (backend)
│   └── utils/
│       ├── auto-advance.ts          # Auto-advance utility
│       └── message.ts                # Message creation utilities
├── steps/
│   ├── ai-chat.ts                   # AI chat step (validates session, calls AI)
│   ├── coffee-break.ts              # Coffee break step (timer expired)
│   ├── faq.ts                       # FAQ step (initial step)
│   ├── first-coffee.ts              # First coffee step (first paywall)
│   ├── provider-message.ts          # Provider confirmation step
│   └── verify.ts                    # Verification step (collects TX ID)
├── lib/
│   ├── api-client.ts                # Typed API client for frontend
│   ├── auth-middleware.ts           # withAuth() HOF for routes
│   ├── bootstrap.ts                 # Service initialization
│   ├── chat-utils.ts                # Chat utilities (conversation ID)
│   ├── enums.ts                     # Provider & event types
│   ├── kv.ts                        # Redis/KV client
│   ├── redis.ts                     # Redis utilities and key prefixes
│   ├── schemas.ts                   # Zod validation schemas
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Utility functions
├── services/
│   ├── event-router.service.ts      # Event → handler routing
│   ├── event-store.service.ts       # Event storage in KV
│   ├── provider-registry.service.ts # Provider registration
│   ├── session-store.service.ts     # Session storage service
│   ├── token-store.service.ts      # Transaction storage
│   ├── verification.service.ts     # Payment verification logic
│   └── handlers/                    # Event handlers
├── providers/
│   └── bmc/
│       ├── bmc.provider.ts          # Buy Me a Coffee provider implementation
│       └── bmc.map.ts               # Event → handler mapping
├── types/
│   ├── chat-ui.ts                   # Chat UI type definitions
│   ├── engine.ts                    # Step engine type definitions
│   └── index.ts                     # Core type definitions
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
The homepage features an AI-powered chat interface built with a step-based architecture:

**Chat Component** (`components/chat.tsx`):
- Pure UI component with no business logic
- Manages in-memory context and messages
- Instantiates `StepEngine` and calls `dispatch()` for all user inputs
- Filters system messages from display
- Renders markdown for AI responses
- Shows conversation starters after verification
- Handles user and assistant messages

**Step-Based Flow**:
1. **FAQ Step**: User sees FAQ buttons, can ask questions
2. **First Coffee Step**: If FAQ doesn't match, shows paywall and provider selector
3. **Provider Message Step**: Confirms provider selection
4. **Verify Step**: Shows verification card, collects transaction ID
5. **AI Chat Step**: After verification, enables full AI chat with session validation
6. **Coffee Break Step**: When timer expires, shows "need coffee again" message

**Session Management**:
- Session state managed via React Context (`contexts/chat-context.tsx`)
- Timer component always visible (gray when not verified)
- Session, verifiedAt, and currentStepId persisted in Redis
- Messages never persisted (in-memory only)
- State loaded from Redis on page refresh

**Timer Integration**:
- Coffee timer component tracks session expiration
- On expire, automatically transitions to `coffee_break` step
- Timer always visible (gray when not verified, active when verified)
- Timer positioned absolutely in top-right corner

### Verification Flow
1. User sends a message that doesn't match FAQ
2. System transitions to `first_coffee` step
3. Provider selector appears with payment options
4. User selects provider → transitions to `provider_message` step
5. System confirms provider and transitions to `verify` step
6. Verification card appears inline in chat
7. User enters transaction ID
8. Step calls `/api/coffee/verify-public` to validate
9. On success, creates session and transitions to `ai_chat` step
10. User can now use AI features until session expires
11. On expiration, timer triggers transition back to `coffee_break` step

## Development

### Event Browsing
Visit `/admin/events` to inspect all stored events and transactions with:
- Event type filtering
- Email search
- Revenue statistics
- Event metadata viewing

### Message Customization
See the detailed guide: [Customizing Messages](./docs/customizing-messages.md)

Messages can be customized in:
- `config/chat-messages.json` - Main chat messages
- `providers/{provider}/config.ts` - Provider-specific messages (thanks messages, etc.)

Messages support:
- Random selection from arrays
- Template variables (e.g., `{providerName}`, `{coffeeCount}`)
- Provider-specific customization

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

### Setup & Configuration
- [Implementation Guide](./docs/implementation-guide.md) - Phase-by-phase implementation breakdown
- [MCP Setup Guide](./docs/mcp-setup.md) - Model Context Protocol configuration

### Integration Guides
- [Custom GPT Setup](./docs/custom-gpt-setup.md) - Integration with ChatGPT Custom GPTs
- [Knowledge Base](./docs/knowledge-base.md) - AI agent integration patterns and best practices
- [Testing Webhooks](./docs/testing-webhooks.md) - Webhook testing and debugging

### Development Guides
- [Adding a New Provider](./docs/adding-a-provider.md) - Step-by-step guide to add payment providers
- [Adding a New Step](./docs/adding-a-step.md) - Guide to create new conversation flow steps
- [Customizing Messages](./docs/customizing-messages.md) - How to customize and add messages

### Legal
- [Privacy Policy](./app/privacy/page.tsx) - User data handling and privacy

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
