# Adding a New Payment Provider

This guide explains how to add a new payment provider to Coffee Engine. The system uses a provider-agnostic architecture, making it easy to integrate new payment providers.

## Overview

Each provider is a self-contained module that:
- Validates webhook signatures
- Normalizes provider-specific events to a common format
- Handles event processing and storage
- Provides UI metadata (name, icon, URL)
- Configures provider-specific settings (TTL, messages)

## Step-by-Step Guide

### 1. Create Provider Directory

Create a new directory under `providers/` with your provider ID:

```bash
mkdir -p providers/your-provider
```

Example: `providers/stripe/`, `providers/paypal/`, etc.

### 2. Define Provider Types (`{provider}.events.ts`)

Create TypeScript interfaces for your provider's webhook payloads:

```typescript
// providers/your-provider/your-provider.events.ts

export interface YourProviderWebhook<T = unknown> {
  type: string
  id: string
  created: string
  data: T
  // ... other provider-specific fields
}

export interface YourProviderPaymentData {
  id: string
  amount: number
  currency: string
  customer_email: string
  // ... other fields
}

// Export specific webhook types
export type YourProviderPaymentWebhook = YourProviderWebhook<YourProviderPaymentData>
```

### 3. Create Event Mapping (`{provider}.map.ts`)

Define which events map to which handlers:

```typescript
// providers/your-provider/your-provider.map.ts

import type { EventHandler } from "@/services/event-router.service"
import { handlePayment, handleGenericEvent } from "./your-provider.handler"

export const YOUR_PROVIDER_EVENT_MAP: Array<{ event: string; handler: EventHandler }> = [
  { event: "payment.created", handler: handlePayment },
  { event: "payment.succeeded", handler: handlePayment },
  { event: "payment.refunded", handler: handlePayment },
  { event: "subscription.created", handler: handleGenericEvent },
  // ... more events
] as const
```

**Important**: 
- Events that create transactions (like payments) should use handlers that call `tokenStore.store()`
- Other events (like subscriptions, cancellations) can use generic handlers that only store events

### 4. Create Event Handlers (`{provider}.handler.ts`)

Implement handlers for your events:

```typescript
// providers/your-provider/your-provider.handler.ts

import { logger } from "@/lib/logger"
import { eventStore } from "@/services/event-store.service"
import { tokenStore } from "@/services/token-store.service"
import type { NormalizedEvent } from "@/types"

/**
 * Handles payment events - stores both transaction and event
 */
export async function handlePayment(event: NormalizedEvent): Promise<void> {
  logger.info(
    {
      externalId: event.externalId,
      amount: event.amountMinor / 100,
      currency: event.currency,
    },
    "Processing payment"
  )

  // Store transaction (for verification)
  await tokenStore.store(event)
  
  // Store event (for analytics)
  await eventStore.storeEvent(event)

  logger.debug({ externalId: event.externalId }, "Payment stored successfully")
}

/**
 * Handles generic events - only stores event (no transaction)
 */
export async function handleGenericEvent(event: NormalizedEvent): Promise<void> {
  logger.debug({ eventType: event.eventType, externalId: event.externalId }, "Processing generic event")

  // Only store event (no transaction record)
  await eventStore.storeEvent(event)

  logger.debug({ eventType: event.eventType }, "Event stored successfully")
}
```

### 5. Create Provider Configuration (`config.ts`)

Define provider metadata and settings:

```typescript
// providers/your-provider/config.ts

import type { ProviderMetadata } from "@/types"

/**
 * Provider metadata including UI information
 */
export const yourProviderConfig: ProviderMetadata = {
  providerId: "your-provider",
  name: "Your Provider Name",
  description: "Description of your provider",
  secretEnvVar: "WEBHOOK_SECRET_YOUR_PROVIDER", // Environment variable name for webhook secret
  enabled: true,
  url: process.env.NEXT_PUBLIC_YOUR_PROVIDER_URL || "https://your-provider.com",
  icon: "CreditCard", // Icon name from lucide-react
}

/**
 * Provider-specific configuration
 */
export const yourProviderConfig = {
  baseTTLSeconds: 3600, // Session TTL per unit (e.g., per payment) in seconds
}

/**
 * Provider messages with template variables
 * Template variables: {amount}, {currency}, {payerName}, {payerEmail}
 */
export const yourProviderMessages = {
  thanks: [
    "✅ Thank you for your {amount} {currency} payment!",
    "🎉 Payment of {amount} {currency} received!",
    "✨ Thanks for supporting us with {amount} {currency}!",
  ],
}
```

### 6. Implement Provider Class (`{provider}.provider.ts`)

This is the main provider implementation:

```typescript
// providers/your-provider/your-provider.provider.ts

import { logger } from "@/lib/logger"
import { template } from "@/lib/template"
import { getRandomMessage } from "@/lib/utils"
import type { ProviderEventMap } from "@/services/provider-registry.service"
import type { EventControlResult, NormalizedEvent, WebhookProvider } from "@/types"
import crypto from "crypto"
import type { YourProviderWebhook, YourProviderPaymentData } from "./your-provider.events"
import { YOUR_PROVIDER_EVENT_MAP } from "./your-provider.map"
import { yourProviderMessages, yourProviderConfig } from "./config"

export class YourProvider implements WebhookProvider {
  readonly providerId = "your-provider"

  /**
   * Returns event → handler mappings
   */
  getEventMap(): ProviderEventMap[] {
    return YOUR_PROVIDER_EVENT_MAP.map((item) => ({
      event: item.event,
      handler: item.handler,
    }))
  }

  /**
   * Verifies webhook signature
   */
  async verifyRequest(headers: Headers, body: string, secret: string): Promise<boolean> {
    if (!secret) {
      logger.warn({}, "No webhook secret configured")
      return false
    }

    // Get signature from headers (adjust header name for your provider)
    const signature = headers.get("x-signature") // or "x-webhook-signature", etc.

    if (!signature) {
      logger.warn({}, "No signature header found")
      return false
    }

    // Compute expected signature (adjust algorithm for your provider)
    // Common algorithms: HMAC SHA-256, HMAC SHA-1, etc.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")

    try {
      // Use timing-safe comparison to prevent timing attacks
      const match = crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
      logger.debug({ match }, "Signature validation")
      return match
    } catch (err) {
      logger.error({ error: err }, "Signature comparison failed")
      return false
    }
  }

  /**
   * Normalizes provider-specific payload to common format
   */
  async normalizePayload(payload: unknown): Promise<NormalizedEvent> {
    // Validate and parse payload
    const webhook = payload as YourProviderWebhook<YourProviderPaymentData>

    // Route to appropriate normalization method based on event type
    switch (webhook.type) {
      case "payment.created":
      case "payment.succeeded":
        return this.normalizePayment(webhook)
      case "payment.refunded":
        return this.normalizeRefund(webhook)
      default:
        return this.normalizeGeneric(webhook)
    }
  }

  /**
   * Normalizes payment events
   */
  private normalizePayment(webhook: YourProviderWebhook<YourProviderPaymentData>): NormalizedEvent {
    const data = webhook.data

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: `your_provider_${data.id}`, // Prefix with provider ID
      amountMinor: Math.round(data.amount * 100), // Convert to minor units (cents)
      currency: data.currency.toUpperCase(),
      payerEmail: data.customer_email,
      occurredAt: webhook.created || new Date().toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        // Store any additional event-specific data
        customerId: data.customer_id,
        paymentMethod: data.payment_method,
      },
    }
  }

  /**
   * Normalizes refund events
   */
  private normalizeRefund(webhook: YourProviderWebhook<YourProviderPaymentData>): NormalizedEvent {
    // Similar to normalizePayment but for refunds
    const data = webhook.data

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: `your_provider_${data.id}`,
      amountMinor: Math.round(data.amount * 100),
      currency: data.currency.toUpperCase(),
      payerEmail: data.customer_email,
      occurredAt: webhook.created || new Date().toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        refundReason: data.reason,
      },
    }
  }

  /**
   * Normalizes generic events
   */
  private normalizeGeneric(webhook: YourProviderWebhook): NormalizedEvent {
    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: `your_provider_${webhook.id}`,
      amountMinor: 0, // Generic events may not have amounts
      currency: "USD", // Default currency
      occurredAt: webhook.created || new Date().toISOString(),
      rawPayload: webhook,
    }
  }

  /**
   * Controls event after verification - calculates TTL, generates thanks message
   */
  async controlEvent(event: NormalizedEvent): Promise<EventControlResult> {
    // Calculate coffee count or payment units
    // For example, if $5 = 1 unit, then $25 = 5 units
    const baseTTLSeconds = yourProviderConfig.baseTTLSeconds
    const paymentUnits = Math.floor(event.amountMinor / 500) // $5 = 1 unit
    const coffeeCount = Math.max(1, paymentUnits) // At least 1 unit
    const TTL = coffeeCount * baseTTLSeconds

    // Extract supporter information
    const supporterName = (event.eventMetadata?.customerName as string) || "Supporter"
    const amount = (event.amountMinor / 100).toFixed(2)
    const currency = event.currency

    // Select random thanks message template
    const messageTemplate = getRandomMessage(yourProviderMessages.thanks)

    // Template the message
    const thanksMessage = template(messageTemplate, {
      amount,
      currency,
      payerName: supporterName,
      payerEmail: event.payerEmail || "",
    })

    const verifiedAt = new Date().toISOString()

    logger.debug(
      {
        providerId: this.providerId,
        externalId: event.externalId,
        coffeeCount,
        TTL,
      },
      "Event controlled"
    )

    return {
      verifiedAt,
      TTL,
      thanksMessage,
    }
  }
}
```

### 7. Register Provider in Config

Add your provider to `config/providers.ts`:

```typescript
// config/providers.ts

import { BmcProvider } from "@/providers/bmc/bmc.provider"
import { bmcConfig } from "@/providers/bmc/config"
import { YourProvider } from "@/providers/your-provider/your-provider.provider" // Add import
import { yourProviderConfig } from "@/providers/your-provider/config" // Add import
import type { ProviderMetadata } from "@/types"

export enum ProviderId {
  BMC = "bmc",
  YOUR_PROVIDER = "your-provider", // Add to enum
}

// Add provider instance
export const ENABLED_PROVIDERS = [
  new BmcProvider(),
  new YourProvider(), // Add here
]

// Add provider config
const PROVIDER_CONFIGS: ProviderMetadata[] = [
  bmcConfig,
  yourProviderConfig, // Add here
]
```

### 8. Add Environment Variable

Add your webhook secret to `.env.local`:

```bash
WEBHOOK_SECRET_YOUR_PROVIDER=your_webhook_secret_here
```

The provider will automatically use this secret for webhook verification.

### 9. Configure Webhook in Provider Dashboard

In your payment provider's dashboard:
1. Set webhook URL to: `https://your-domain.com/api/webhooks/your-provider`
2. Copy the webhook secret
3. Add it to your `.env.local` file

## Testing Your Provider

### 1. Test Webhook Verification

```bash
# Create a test webhook payload
curl -X POST http://localhost:3000/api/webhooks/your-provider \
  -H "Content-Type: application/json" \
  -H "x-signature: your_computed_signature" \
  -d '{
    "type": "payment.created",
    "id": "test_123",
    "data": {
      "id": "pay_123",
      "amount": 5.00,
      "currency": "usd",
      "customer_email": "test@example.com"
    }
  }'
```

### 2. Test Transaction Verification

After receiving a webhook, test verification:

```bash
curl -X POST http://localhost:3000/api/coffee/verify-public \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "your_provider_pay_123",
    "providerId": "your-provider"
  }'
```

### 3. Check Event Storage

Visit `/admin/events` to see stored events and verify they're being processed correctly.

## Key Points

1. **Transaction Storage**: Only payment events should call `tokenStore.store()`. Other events should only call `eventStore.storeEvent()`.

2. **External ID Format**: Always prefix external IDs with your provider ID (e.g., `your_provider_123`) to avoid collisions.

3. **Amount Normalization**: Convert amounts to minor units (cents) in `normalizePayload()`.

4. **Signature Verification**: Use `crypto.timingSafeEqual()` to prevent timing attacks.

5. **Error Handling**: Log errors but don't throw - let the system handle failures gracefully.

6. **Type Safety**: Use TypeScript interfaces for all webhook payloads.

## Example: Complete Provider Structure

```
providers/your-provider/
├── your-provider.provider.ts  # Main provider class
├── your-provider.events.ts    # TypeScript type definitions
├── your-provider.map.ts       # Event → handler mapping
├── your-provider.handler.ts   # Event handler functions
└── config.ts                  # Provider metadata and config
```

## Next Steps

After adding your provider:
1. Test webhook reception
2. Test transaction verification
3. Test the full verification flow in the UI
4. Verify events appear in the admin dashboard
5. Test session creation and expiration

For more details, see the [Implementation Guide](./implementation-guide.md).

