// Provider Registry - manages webhook provider implementations

import type { WebhookProvider } from "@/types"

export class ProviderRegistryService {
  private static instance: ProviderRegistryService
  private providers: Map<string, WebhookProvider> = new Map()

  private constructor() {}

  static getInstance(): ProviderRegistryService {
    if (!ProviderRegistryService.instance) {
      ProviderRegistryService.instance = new ProviderRegistryService()
    }
    return ProviderRegistryService.instance
  }

  register(provider: WebhookProvider): void {
    this.providers.set(provider.providerId, provider)
    console.log(`[ProviderRegistry] Registered provider: ${provider.providerId}`)
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
