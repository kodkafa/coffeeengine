import { ENABLED_PROVIDERS } from "@/config/providers"
import { EVENT_MAP } from "@/config/events"
import { providerRegistry } from "@/services/provider-registry.service"
import { eventRouter } from "@/services/event-router.service"

let isBootstrapped = false

export function bootstrap(): void {
  if (isBootstrapped) {
    return
  }

  console.log("[Bootstrap] Initializing Coffee Engine...")

  for (const provider of ENABLED_PROVIDERS) {
    providerRegistry.register(provider)
  }

  for (const route of EVENT_MAP) {
    eventRouter.registerHandler(route.provider, route.event, route.handler)
  }

  isBootstrapped = true
  console.log("[Bootstrap] Coffee Engine initialized with configuration-driven providers and events")
}
