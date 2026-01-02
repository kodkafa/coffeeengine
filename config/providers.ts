import { BmcProvider } from "@/providers/bmc/bmc.provider"
import { bmcConfig } from "@/providers/bmc/config"
import type { ProviderMetadata } from "@/types"

export enum ProviderId {
  BMC = "bmc",
  KOFI = "kofi",
}

/**
 * Registry of enabled provider instances
 * Each provider should be instantiated here
 */
export const ENABLED_PROVIDERS = [new BmcProvider()]

/**
 * Registry of provider metadata
 * Each provider exports its config from providers/{provider}/config.ts
 * This registry aggregates all provider configurations
 */
const PROVIDER_CONFIGS: ProviderMetadata[] = [bmcConfig]

/**
 * Provider metadata map indexed by providerId
 * Automatically generated from PROVIDER_CONFIGS
 */
export const PROVIDER_METADATA: Record<string, Omit<ProviderMetadata, "providerId">> = 
  PROVIDER_CONFIGS.reduce((acc, config) => {
    const { providerId, ...metadata } = config
    acc[providerId] = metadata
    return acc
  }, {} as Record<string, Omit<ProviderMetadata, "providerId">>)

/**
 * Get all enabled provider metadata
 */
export function getAllProviderMetadata(): ProviderMetadata[] {
  return PROVIDER_CONFIGS.filter((config) => config.enabled)
}

/**
 * Gets the default provider ID.
 * Currently returns ProviderId.BMC but can be extended to support multiple providers.
 */
export function getDefaultProviderId(): ProviderId {
  return ProviderId.BMC
}

/**
 * Gets provider metadata by ID.
 */
export function getProviderMetadata(providerId: string): (typeof PROVIDER_METADATA)[keyof typeof PROVIDER_METADATA] | undefined {
  return PROVIDER_METADATA[providerId as keyof typeof PROVIDER_METADATA]
}

/**
 * Gets provider name by ID, falling back to the provider ID if not found.
 */
export function getProviderName(providerId: string): string {
  const metadata = getProviderMetadata(providerId)
  return metadata?.name || providerId
}
