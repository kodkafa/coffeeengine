import type { EventHandler } from "@/services/event-router.service";
import { handleDonation, handleGenericEvent } from "./bmc.handler";

export const BMC_EVENT_MAP: Array<{ event: string; handler: EventHandler }> = [
  { event: "donation.created", handler: handleDonation },
  { event: "donation.updated", handler: handleDonation },
  { event: "donation.refunded", handler: handleDonation },
  { event: "membership.started", handler: handleGenericEvent },
  { event: "membership.renewed", handler: handleGenericEvent },
  { event: "membership.cancelled", handler: handleGenericEvent },
  { event: "membership.ended", handler: handleGenericEvent },
  { event: "extra.created", handler: handleGenericEvent },
  { event: "extra.updated", handler: handleGenericEvent },
  { event: "shop.order.created", handler: handleGenericEvent },
  { event: "shop.order.completed", handler: handleGenericEvent },
  { event: "shop.order.cancelled", handler: handleGenericEvent },
  { event: "subscription.created", handler: handleGenericEvent },
  { event: "subscription.updated", handler: handleGenericEvent },
  { event: "subscription.cancelled", handler: handleGenericEvent },
  { event: "subscription.payment_succeeded", handler: handleGenericEvent },
  { event: "subscription.payment_failed", handler: handleGenericEvent },
] as const


