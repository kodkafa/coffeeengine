import { ENABLED_PROVIDERS } from "@/config/providers"
import { logger } from "@/lib/logger"
import { eventRouter } from "@/services/event-router.service"
import { providerRegistry } from "@/services/provider-registry.service"
import type { WebhookProvider } from "@/types"

// Type guard to check if provider has getEventMap method
interface ProviderWithEvents extends WebhookProvider {
  getEventMap(): Array<{ event: string; handler: (event: unknown) => Promise<void> }>
}

function hasEventMap(provider: WebhookProvider): provider is ProviderWithEvents {
  return typeof (provider as ProviderWithEvents).getEventMap === "function"
}

let isBootstrapped = false

export function bootstrap(): void {
  if (isBootstrapped) {
    return
  }

  logger.info({}, "Initializing Coffee Engine...")

  let totalEventCount = 0

  // Register providers and their events
  for (const provider of ENABLED_PROVIDERS) {
    providerRegistry.register(provider)

    // Register events if provider supports it
    if (hasEventMap(provider)) {
      const eventMap = provider.getEventMap()
      providerRegistry.registerEvents(provider.providerId, eventMap)

      // Register each event with the event router
      for (const { event, handler } of eventMap) {
        eventRouter.registerHandler(provider.providerId, event, handler)
        totalEventCount++
      }
    }
  }

  isBootstrapped = true
  logger.info(
    { providerCount: ENABLED_PROVIDERS.length, eventRouteCount: totalEventCount },
    "Coffee Engine initialized"
  )
}
