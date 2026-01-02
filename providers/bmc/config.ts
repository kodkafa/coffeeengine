import type { ProviderMetadata } from "@/types"

/**
 * BMC Provider Configuration
 * Exports provider metadata including UI information
 */
export const bmcConfig: ProviderMetadata = {
  providerId: "bmc",
  name: "Buy Me a Coffee",
  description: "BMC webhook provider with support for donations, memberships, and subscriptions",
  secretEnvVar: "WEBHOOK_SECRET_BMC",
  enabled: true,
  url: process.env.NEXT_PUBLIC_BMC_URL || "https://buymeacoffee.com",
  icon: "Coffee", // Icon name from lucide-react
}

