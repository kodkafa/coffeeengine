import { BmcProvider } from "@/providers/bmc.provider"
import { providerRegistry } from "@/services/provider-registry.service"
import { eventRouter } from "@/services/event-router.service"
import { handleDonation } from "@/services/handlers/donation.handler"
import { handleGenericEvent } from "@/services/handlers/generic.handler"

let isBootstrapped = false

export function bootstrap(): void {
  if (isBootstrapped) {
    return
  }

  console.log("[Bootstrap] Initializing Coffee Engine...")

  // Register providers
  const bmcProvider = new BmcProvider()
  providerRegistry.register(bmcProvider)

  eventRouter.registerHandler("bmc", "donation.created", handleDonation)
  eventRouter.registerHandler("bmc", "donation.updated", handleDonation)
  eventRouter.registerHandler("bmc", "donation.refunded", handleDonation)

  eventRouter.registerHandler("bmc", "membership.started", handleGenericEvent)
  eventRouter.registerHandler("bmc", "membership.renewed", handleGenericEvent)
  eventRouter.registerHandler("bmc", "membership.cancelled", handleGenericEvent)
  eventRouter.registerHandler("bmc", "membership.ended", handleGenericEvent)

  eventRouter.registerHandler("bmc", "extra.created", handleGenericEvent)
  eventRouter.registerHandler("bmc", "extra.updated", handleGenericEvent)

  eventRouter.registerHandler("bmc", "shop.order.created", handleGenericEvent)
  eventRouter.registerHandler("bmc", "shop.order.completed", handleGenericEvent)
  eventRouter.registerHandler("bmc", "shop.order.cancelled", handleGenericEvent)

  eventRouter.registerHandler("bmc", "subscription.created", handleGenericEvent)
  eventRouter.registerHandler("bmc", "subscription.updated", handleGenericEvent)
  eventRouter.registerHandler("bmc", "subscription.cancelled", handleGenericEvent)
  eventRouter.registerHandler("bmc", "subscription.payment_succeeded", handleGenericEvent)
  eventRouter.registerHandler("bmc", "subscription.payment_failed", handleGenericEvent)

  isBootstrapped = true
  console.log("[Bootstrap] Coffee Engine initialized with all event handlers")
}
