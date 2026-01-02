// Configuration service for environment variables

export class ConfigService {
  private static instance: ConfigService

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  get coffeeApiKey(): string {
    return process.env.COFFEE_API_KEY || ""
  }

  get webhookSecretBmc(): string {
    return process.env.WEBHOOK_SECRET_BMC || ""
  }

  // Transaction Storage TTL (for verified payment transactions)
  get transactionTtlSeconds(): number {
    return Number.parseInt(process.env.TRANSACTION_TTL_SECONDS || "2592000", 10) // 30 days default
  }

  // User Session TTL (for AI chat session security)
  get userSessionTtlSeconds(): number {
    return Number.parseInt(process.env.USER_SESSION_TTL_SECONDS || "86400", 10) // 24 hours default
  }

  // Event Storage TTL (for webhook events - optional, can be permanent)
  get eventStorageTtlSeconds(): number | null {
    const value = process.env.EVENT_STORAGE_TTL_SECONDS
    if (!value || value === "0" || value.toLowerCase() === "permanent") {
      return null // Permanent storage
    }
    return Number.parseInt(value, 10)
  }

  // Legacy support - deprecated, use transactionTtlSeconds instead
  get tokenTtlSeconds(): number {
    return this.transactionTtlSeconds
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || "development"
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development"
  }

  getProviderSecret(providerId: string): string {
    switch (providerId) {
      case "bmc":
        return this.webhookSecretBmc
      default:
        return ""
    }
  }

  // AI Provider Configuration
  get aiProvider(): "openai" | "anthropic" | "vercel-gateway" {
    const provider = process.env.AI_PROVIDER || "openai"
    if (provider === "openai" || provider === "anthropic" || provider === "vercel-gateway") {
      return provider
    }
    return "openai"
  }

  get openaiApiKey(): string {
    return process.env.OPENAI_API_KEY || ""
  }

  get anthropicApiKey(): string {
    return process.env.ANTHROPIC_API_KEY || ""
  }

  get vercelAiGatewayUrl(): string {
    return process.env.VERCEL_AI_GATEWAY_URL || ""
  }

  getAiApiKey(provider: "openai" | "anthropic" | "vercel-gateway"): string {
    switch (provider) {
      case "openai":
        return this.openaiApiKey
      case "anthropic":
        return this.anthropicApiKey
      case "vercel-gateway":
        return "" // Vercel Gateway uses different auth mechanism
      default:
        return ""
    }
  }
}

export const config = ConfigService.getInstance()
