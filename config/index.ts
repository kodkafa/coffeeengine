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

  get kvRestApiUrl(): string {
    return process.env.KV_REST_API_URL || ""
  }

  get kvRestApiToken(): string {
    return process.env.KV_REST_API_TOKEN || ""
  }

  get coffeeApiKey(): string {
    return process.env.COFFEE_API_KEY || "coffekey"
  }

  get webhookSecretBmc(): string {
    return process.env.WEBHOOK_SECRET_BMC || ""
  }

  get tokenTtlSeconds(): number {
    return Number.parseInt(process.env.TOKEN_TTL_SECONDS || "2592000", 10) // 30 days default
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || "development"
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development"
  }

  private generateDefaultApiKey(): string {
    // Generate a random API key for development
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = "coffee_"
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  getProviderSecret(providerId: string): string {
    switch (providerId) {
      case "bmc":
        return this.webhookSecretBmc
      default:
        return ""
    }
  }
}

export const config = ConfigService.getInstance()
