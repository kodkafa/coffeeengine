// Buy Me a Coffee Provider Implementation - Modular Event Handling

import crypto from "crypto"
import type { WebhookProvider, NormalizedEvent } from "@/types"
import type {
  BmcWebhook,
  BmcDonationData,
  BmcMembershipData,
  BmcExtraData,
  BmcShopOrderData,
  BmcSubscriptionData,
} from "@/types/bmc-events"

export class BmcProvider implements WebhookProvider {
  readonly providerId = "bmc"

  async verifyRequest(headers: Headers, body: string, secret: string): Promise<boolean> {
    console.log("[v0] [BMC] === SIGNATURE VALIDATION DEBUG ===")
    console.log("[v0] [BMC] All headers:", Object.fromEntries(headers.entries()))
    console.log("[v0] [BMC] Body length:", body.length)
    console.log("[v0] [BMC] Secret configured:", !!secret)
    console.log("[v0] [BMC] Secret length:", secret?.length)

    if (!secret) {
      console.warn("[BMC] No webhook secret configured")
      return false
    }

    // BMC sends signature as x-signature-sha256 header
    const signature = headers.get("x-signature-sha256")

    if (!signature) {
      console.warn("[BMC] No signature header found (expected x-signature-sha256)")
      return false
    }

    // This follows BMC documentation: hash the exact payload with HMAC-SHA256
    const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex")

    console.log("[BMC] Signature validation:")
    console.log("  Expected:", expectedSignature)
    console.log("  Received:", signature)

    // Use timing-safe comparison
    try {
      const match = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))
      console.log("  Match:", match)
      return match
    } catch (err) {
      console.error("[BMC] Signature comparison failed:", err)
      return false
    }
  }

  async normalizePayload(payload: unknown): Promise<NormalizedEvent> {
    const webhook = payload as BmcWebhook

    if (!webhook.type || !webhook.data) {
      throw new Error("[BMC] Invalid webhook structure: missing type or data")
    }

    console.log(`[BMC] Processing event type: ${webhook.type}`)

    // Route to type-specific normalizer
    switch (webhook.type) {
      case "donation.created":
      case "donation.updated":
      case "donation.refunded":
        return this.normalizeDonation(webhook as BmcWebhook<BmcDonationData>)

      case "membership.started":
      case "membership.renewed":
      case "membership.cancelled":
      case "membership.ended":
        return this.normalizeMembership(webhook as BmcWebhook<BmcMembershipData>)

      case "extra.created":
      case "extra.updated":
        return this.normalizeExtra(webhook as BmcWebhook<BmcExtraData>)

      case "shop.order.created":
      case "shop.order.completed":
      case "shop.order.cancelled":
        return this.normalizeShopOrder(webhook as BmcWebhook<BmcShopOrderData>)

      case "subscription.created":
      case "subscription.updated":
      case "subscription.cancelled":
      case "subscription.payment_succeeded":
      case "subscription.payment_failed":
        return this.normalizeSubscription(webhook as BmcWebhook<BmcSubscriptionData>)

      default:
        throw new Error(`[BMC] Unsupported event type: ${webhook.type}`)
    }
  }

  private normalizeDonation(webhook: BmcWebhook<BmcDonationData>): NormalizedEvent {
    const data = webhook.data

    if (!data.transaction_id) {
      throw new Error("[BMC] Missing transaction_id in donation payload")
    }

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: data.transaction_id,
      amountMinor: Math.round(data.amount * 100),
      currency: data.currency,
      payerEmail: data.supporter_email,
      occurredAt: new Date(data.created_at * 1000).toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        supporterName: data.supporter_name,
        supporterId: data.supporter_id,
        coffeeCount: data.coffee_count,
        coffeePrice: data.coffee_price,
        supportNote: data.support_note,
        message: data.message,
        refunded: data.refunded === "true",
        status: data.status,
      },
    }
  }

  private normalizeMembership(webhook: BmcWebhook<BmcMembershipData>): NormalizedEvent {
    const data = webhook.data

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: data.membership_id,
      amountMinor: Math.round(data.amount * 100),
      currency: data.currency,
      payerEmail: data.supporter_email,
      occurredAt: new Date(data.started_at * 1000).toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        supporterName: data.supporter_name,
        supporterId: data.supporter_id,
        membershipLevelId: data.membership_level_id,
        membershipLevelName: data.membership_level_name,
        status: data.status,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      },
    }
  }

  private normalizeExtra(webhook: BmcWebhook<BmcExtraData>): NormalizedEvent {
    const data = webhook.data

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: `extra_${data.id}`,
      amountMinor: Math.round(data.amount * 100),
      currency: data.currency,
      payerEmail: data.supporter_email,
      occurredAt: new Date(data.created_at * 1000).toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        supporterName: data.supporter_name,
        supporterId: data.supporter_id,
        message: data.message,
      },
    }
  }

  private normalizeShopOrder(webhook: BmcWebhook<BmcShopOrderData>): NormalizedEvent {
    const data = webhook.data

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: data.order_id,
      amountMinor: Math.round(data.total_amount * 100),
      currency: data.currency,
      payerEmail: data.supporter_email,
      occurredAt: new Date(data.created_at * 1000).toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        supporterName: data.supporter_name,
        supporterId: data.supporter_id,
        status: data.status,
        items: data.items,
        shippingAddress: data.shipping_address,
      },
    }
  }

  private normalizeSubscription(webhook: BmcWebhook<BmcSubscriptionData>): NormalizedEvent {
    const data = webhook.data

    return {
      providerId: this.providerId,
      eventType: webhook.type,
      externalId: data.subscription_id,
      amountMinor: Math.round(data.amount * 100),
      currency: data.currency,
      payerEmail: data.supporter_email,
      occurredAt: new Date(data.created_at * 1000).toISOString(),
      rawPayload: webhook,
      eventMetadata: {
        supporterName: data.supporter_name,
        supporterId: data.supporter_id,
        planId: data.plan_id,
        planName: data.plan_name,
        status: data.status,
        interval: data.interval,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      },
    }
  }
}
