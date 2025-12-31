// Centralized event-to-handler mapping instead of scattered bootstrap logic

import { handleDonation } from "@/services/handlers/donation.handler"
import { handleGenericEvent } from "@/services/handlers/generic.handler"

// Define all event routes in a single configuration
export const EVENT_MAP = [
  // Donation events
  { provider: "bmc", event: "donation.created", handler: handleDonation },
  { provider: "bmc", event: "donation.updated", handler: handleDonation },
  { provider: "bmc", event: "donation.refunded", handler: handleDonation },

  // Membership events
  { provider: "bmc", event: "membership.started", handler: handleGenericEvent },
  { provider: "bmc", event: "membership.renewed", handler: handleGenericEvent },
  { provider: "bmc", event: "membership.cancelled", handler: handleGenericEvent },
  { provider: "bmc", event: "membership.ended", handler: handleGenericEvent },

  // Extra events
  { provider: "bmc", event: "extra.created", handler: handleGenericEvent },
  { provider: "bmc", event: "extra.updated", handler: handleGenericEvent },

  // Shop order events
  { provider: "bmc", event: "shop.order.created", handler: handleGenericEvent },
  { provider: "bmc", event: "shop.order.completed", handler: handleGenericEvent },
  { provider: "bmc", event: "shop.order.cancelled", handler: handleGenericEvent },

  // Subscription events
  { provider: "bmc", event: "subscription.created", handler: handleGenericEvent },
  { provider: "bmc", event: "subscription.updated", handler: handleGenericEvent },
  { provider: "bmc", event: "subscription.cancelled", handler: handleGenericEvent },
  { provider: "bmc", event: "subscription.payment_succeeded", handler: handleGenericEvent },
  { provider: "bmc", event: "subscription.payment_failed", handler: handleGenericEvent },
] as const

export type EventRoute = (typeof EVENT_MAP)[number]
