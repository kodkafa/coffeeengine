import { BmcProvider } from "@/providers/bmc/bmc.provider"

export enum ProviderId {
  BMC = "bmc",
  KOFI = "kofi",
}

export const ENABLED_PROVIDERS = [new BmcProvider()]

export const PROVIDER_METADATA = {
  bmc: {
    name: "Buy Me a Coffee",
    description: "BMC webhook provider with support for donations, memberships, and subscriptions",
    secretEnvVar: "WEBHOOK_SECRET_BMC",
  },
  kofi: {
    name: "Ko-fi",
    description: "Ko-fi webhook provider with support for donations, memberships, and subscriptions",
    secretEnvVar: "WEBHOOK_SECRET_KOFI",
  },
} as const

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
