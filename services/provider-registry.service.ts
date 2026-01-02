// Provider Registry - manages webhook provider implementations

import { logger } from "@/lib/logger"
import type { EventHandler } from "@/services/event-router.service"
import type { WebhookProvider } from "@/types"

export interface ProviderEventMap {
  event: string
  handler: EventHandler
}

export class ProviderRegistryService {
  private static instance: ProviderRegistryService
  private providers: Map<string, WebhookProvider> = new Map()
  private providerEvents: Map<string, ProviderEventMap[]> = new Map()

  private constructor() {}

  static getInstance(): ProviderRegistryService {
    if (!ProviderRegistryService.instance) {
      ProviderRegistryService.instance = new ProviderRegistryService()
    }
    return ProviderRegistryService.instance
  }

  register(provider: WebhookProvider): void {
    this.providers.set(provider.providerId, provider)
    logger.debug({ providerId: provider.providerId }, "Registered provider")
  }

  registerEvents(providerId: string, eventMap: ProviderEventMap[]): void {
    this.providerEvents.set(providerId, eventMap)
    logger.debug({ providerId, eventCount: eventMap.length }, "Registered provider events")
  }

  getEvents(providerId: string): ProviderEventMap[] | undefined {
    return this.providerEvents.get(providerId)
  }

  resolve(providerId: string): WebhookProvider | undefined {
    return this.providers.get(providerId)
  }

  getAll(): WebhookProvider[] {
    return Array.from(this.providers.values())
  }

  isRegistered(providerId: string): boolean {
    return this.providers.has(providerId)
  }
}

export const providerRegistry = ProviderRegistryService.getInstance()
