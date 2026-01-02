// Token Store Service - manages transaction verification tokens in KV

import { config } from "@/config"
import { kv } from "@/lib/kv"
import { logger } from "@/lib/logger"
import { NormalizedEventSchema } from "@/lib/schemas"
import type { NormalizedEvent } from "@/types"

export interface ITokenStore {
  store(event: NormalizedEvent): Promise<void>
  retrieve(providerId: string, externalId: string): Promise<NormalizedEvent | null>
  exists(providerId: string, externalId: string): Promise<boolean>
  delete(providerId: string, externalId: string): Promise<void>
  markAsUsed(providerId: string, externalId: string): Promise<void>
  isUsed(providerId: string, externalId: string): Promise<boolean>
}

export class TokenStoreService implements ITokenStore {
  private static instance: TokenStoreService

  private constructor() {}

  static getInstance(): TokenStoreService {
    if (!TokenStoreService.instance) {
      TokenStoreService.instance = new TokenStoreService()
    }
    return TokenStoreService.instance
  }

  private getKey(providerId: string, externalId: string): string {
    return `txn:${providerId}:${externalId}`
  }

  private getUsedKey(providerId: string, externalId: string): string {
    return `txn:used:${providerId}:${externalId}`
  }

  async store(event: NormalizedEvent): Promise<void> {
    const validated = NormalizedEventSchema.parse(event)

    const key = this.getKey(validated.providerId, validated.externalId)
    const ttl = config.transactionTtlSeconds

    await kv.set(key, JSON.stringify(validated), {
      ex: ttl,
    })

    logger.debug({ key, ttl }, "Stored token")
  }

  async retrieve(providerId: string, externalId: string): Promise<NormalizedEvent | null> {
    const key = this.getKey(providerId, externalId)

    try {
      const data = await kv.get<string>(key)

      if (!data) {
        logger.debug({ key }, "No data found")
        return null
      }

      if (typeof data === "object") {
        return NormalizedEventSchema.parse(data) as NormalizedEvent
      }
      const parsed = JSON.parse(data)
      return NormalizedEventSchema.parse(parsed) as NormalizedEvent
    } catch (error) {
      logger.error({ key, error }, "Error retrieving/parsing data")
      throw new Error(
        `[TokenStore] Data validation failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async exists(providerId: string, externalId: string): Promise<boolean> {
    const key = this.getKey(providerId, externalId)
    const exists = await kv.exists(key)
    return exists === 1
  }

  async delete(providerId: string, externalId: string): Promise<void> {
    const key = this.getKey(providerId, externalId)
    await kv.del(key)
    logger.debug({ key }, "Deleted token")
  }

  async markAsUsed(providerId: string, externalId: string): Promise<void> {
    const key = this.getUsedKey(providerId, externalId)
    // Store with same TTL as transaction to keep them in sync
    const ttl = config.transactionTtlSeconds
    await kv.set(key, "1", {
      ex: ttl,
    })
    logger.debug({ key, ttl }, "Marked transaction as used")
  }

  async isUsed(providerId: string, externalId: string): Promise<boolean> {
    const key = this.getUsedKey(providerId, externalId)
    const exists = await kv.exists(key)
    return exists === 1
  }
}

export const tokenStore = TokenStoreService.getInstance()
