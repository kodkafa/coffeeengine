Coffee Engine – Modular Development Architecture (v2.0)
This document is the authoritative development architecture for the improved Coffee Engine. It emphasizes modularity, type safety, and configuration-driven logic.

The guide is structured into five documents:

Doc 1 – Core Concepts, Tech Stack & Global Architecture

Doc 2 – Phase 1: Webhook Intake, Zod Validation & Dynamic Registry

Doc 3 – Phase 2: API Layer, Middleware & OpenAPI

Doc 4 – Phase 3: MCP Protocol Integration

Doc 5 – Phase 4: Frontend Chat & BYO-AI

Doc 1 – Core Concepts, Tech Stack & Global Architecture
1.1 Tech Stack
Framework: Next.js 16 (App Router, full‑stack)

Language: TypeScript (Strict Mode)

Validation: Zod (Runtime schema validation for webhooks and API DTOs)

Data Store: Vercel KV (Upstash Redis)

UI: Tailwind CSS + Shadcn/UI

Deployment: Vercel

1.2 High‑Level Goals
Configuration Over Code

Adding a provider should involve updating a config file, not modifying core bootstrap logic.

Event routing (Provider → Event → Handler) must be defined in a declarative configuration map.

Type Safety & Data Integrity

All incoming webhooks must be validated against a Zod schema after signature verification.

Token storage/retrieval must be strictly typed; no any casting of JSON strings.

Modular Service Architecture

Core services (EventRouter, TokenStore) must depend on interfaces, not concrete classes, to allow for easy testing and swapping.

Authentication logic must be abstracted into reusable middleware/utils, keeping controllers thin.

1.3 Global Architectural Layers
Configuration Layer (/config)

providers.config.ts: Exports the list of enabled providers.

events.config.ts: Exports the map of events to handler functions.

Core Domain Layer (/lib, /services)

Generic services for routing, storage, and verification.

Completely provider-agnostic.

Provider Adapter Layer (/providers)

Self-contained modules for each provider (BMC, Patreon, Stripe, etc.).

Must implement the IWebhookProvider interface.

Interface Layer (/app/api, /app/api/mcp)

HTTP Endpoints and MCP Tool definitions.

strictly separated from business logic.

Doc 2 – Phase 1: Webhooks, Validation & Dynamic Registry
2.1 Objectives
Implement a Generic Bootstrap system that loads providers from config.

Enforce Zod Schema Validation for normalized events.

Decouple event mapping from the router logic.

2.2 Strict Provider Interface (IWebhookProvider)
Every provider must implement this interface:

TypeScript

interface IWebhookProvider {
  readonly providerId: string;
  verifyRequest(request: Request): Promise<boolean>;
  normalizePayload(payload: unknown): Promise<NormalizedEvent>;
}
Note: verifyRequest now takes the standard Request object for flexibility.

2.3 Configuration-Driven Registry
Instead of hardcoding registrations in bootstrap.ts, create a configuration file:

config/providers.ts

TypeScript

import { BmcProvider } from "@/providers/bmc";
// Import other providers...

export const ENABLED_PROVIDERS = [
  new BmcProvider(),
  // new StripeProvider(),
];
config/events.ts

TypeScript

import { handleDonation } from "@/services/handlers/donation";
import { handleGeneric } from "@/services/handlers/generic";

export const EVENT_MAP = [
  { provider: "bmc", event: "donation.created", handler: handleDonation },
  { provider: "bmc", event: "subscription.created", handler: handleGeneric },
  // ...
] as const;
Updated bootstrap.ts:

Iterates ENABLED_PROVIDERS and calls providerRegistry.register().

Iterates EVENT_MAP and calls eventRouter.registerHandler().

This ensures the core engine never needs editing to add a new provider.

2.4 Zod Validation for Normalized Events
The NormalizedEvent type must have a corresponding Zod schema (NormalizedEventSchema).

Where to validate: Inside the TokenStore before saving, and optionally inside the ProviderAdapter output.

Why: Prevents "poison" data (missing IDs, bad amounts) from corrupting the database.

2.5 Token Store with Zod
The TokenStoreService must:

Stringify data on set.

On get, parse JSON and parse with NormalizedEventSchema.parse().

If schema validation fails, throw a critical error (data corruption).

Doc 3 – Phase 2: API Layer, Middleware & OpenAPI
3.1 Objectives
Create a Verification Service that is purely logic-focused.

Implement Auth Middleware to protect endpoints.

Auto-generate or strictly define OpenAPI specs.

3.2 Verification Service (IVerificationService)
Input: { transactionId: string, providerId?: string } Logic:

Try to fetch token txn:{providerId}:{transactionId}.

If providerId is missing, iterating through "default providers" (like BMC) to find a match is permitted (optional convenience).

Return strict VerificationResult object.

3.3 Auth Middleware (withAuth)
Do not write if (!apiKey) return 401 in every route. Create a higher-order function:

TypeScript

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const key = req.headers.get("x-coffee-api-key");
    if (key !== process.env.COFFEE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req);
  };
}
Wrap the /api/coffee/verify route handler with this function.

3.4 OpenAPI Spec
Define the spec in lib/openapi-spec.ts as a typed object, then serve it at /api/openapi.

Use the actual Zod schemas from your code to generate the OpenAPI parameter descriptions if possible, or keep them manually synced to ensure accuracy.

Doc 4 – Phase 3: MCP Protocol Integration
4.1 Objectives
Expose verification logic to AI Agents (Claude, Cursor, Custom GPTs).

Ensure zero logic duplication between HTTP API and MCP Tool.

4.2 MCP Service Adapter
The MCP Tool handler calls VerificationService.verifyTransaction(...) directly.

Security Note: The MCP server process must have access to the KV Store environment variables.

Output: The MCP tool returns a human-readable string (for the AI) and structured JSON (for the system), if the MCP client supports it. For now, a JSON-stringified result is best for AI parsing.

Doc 5 – Phase 4: Frontend Chat & BYO-AI
5.1 Objectives
Demonstrate the "Premium Flow": User Input → Payment → Verification → AI Response.

Modular UI Components: Use Shadcn/UI for all elements.

5.2 Client-Side API Abstraction
Create a lib/api-client.ts for the frontend.

Methods:

verifyTransaction(txId: string): Promise<Result>

checkHealth(): Promise<boolean>

This keeps page.tsx or chat-component.tsx clean of fetch calls.

5.3 BYO-AI Security
Rule: Never send the user's OpenAI/Anthropic Key to your server.

Flow:

Frontend verifies transaction with Coffee Engine (Server-side).

If valid, Server returns a short-lived "session token" or strict "success" signal.

Frontend then calls the AI Provider directly from the browser (using the user's local key) OR calls a proxy route that uses the user's key (passed in headers).

Preferred: Frontend calls AI directly to minimize liability.

Implementation Instructions (Prompt for AI)
"Generate the Coffee Engine v2 based on the 'Modular Development Architecture v2.0'.

Refactoring Requirements:

Strict Configuration: Create config/providers.ts and config/events.ts. Move all hardcoded registrations from bootstrap.ts to these files.

Schema Validation: Install zod. Define NormalizedEventSchema. Update TokenStoreService to validate data against this schema on retrieval.

Middleware: Create lib/auth-middleware.ts and apply it to the api/coffee/verify route.

Enums: Replace string literals for event types with a TypeScript Enum CoffeeEvent.

Clean Code: Ensure all Services follow the Singleton pattern but implement exported Interfaces.

Proceed with implementing Phase 1 (Webhooks & Registry) and Phase 2 (Verification API) using this improved structure."
