// Centralized provider configuration for easier management

import { BmcProvider } from "@/providers/bmc.provider"

// Export enabled providers from a single configuration file
export const ENABLED_PROVIDERS = [new BmcProvider()]

// Provider metadata for documentation and configuration
export const PROVIDER_METADATA = {
  bmc: {
    name: "Buy Me a Coffee",
    description: "BMC webhook provider with support for donations, memberships, and subscriptions",
    secretEnvVar: "WEBHOOK_SECRET_BMC",
  },
} as const
