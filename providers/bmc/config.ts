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

/**
 * BMC Provider Configuration
 * Base TTL per coffee in seconds (45 minutes = 2700 seconds)
 */
export const bmcProviderConfig = {
  baseTTLSeconds: 2700, // 45 minutes per coffee
}

/**
 * BMC Provider Messages
 * Template variables: {coffeeCount}, {supporterName}, {amount}, {currency}
 */
export const bmcMessages = {
  thanks: [
    "☕ Thanks for {coffeeCount} coffee(s), {supporterName}! You're all set.",
    "🎉 {coffeeCount} coffee(s) received from {supporterName}! Let's build something amazing.",
    "✨ Thank you {supporterName} for {coffeeCount} coffee(s)! Your support means everything.",
    "🚀 {coffeeCount} coffee(s) from {supporterName}! Ready to create magic?",
  ],
}


