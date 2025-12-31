// Token Store Service - manages transaction verification tokens in KV

import { kv } from "@/lib/kv"
import { config } from "@/config"
import type { NormalizedEvent } from "@/types"

export class TokenStoreService {
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

  async store(event: NormalizedEvent): Promise<void> {
    const key = this.getKey(event.providerId, event.externalId)
    const ttl = config.tokenTtlSeconds

    await kv.set(key, JSON.stringify(event), {
      ex: ttl,
    })

    console.log(`[TokenStore] Stored token: ${key} with TTL: ${ttl}s`)
  }

  async retrieve(providerId: string, externalId: string): Promise<NormalizedEvent | null> {
    const key = this.getKey(providerId, externalId)

    console.log(`[TokenStore] Attempting to retrieve key: ${key}`)

    try {
      const data = await kv.get<string>(key)

      console.log(`[TokenStore] Retrieved data type:`, typeof data)
      console.log(`[TokenStore] Retrieved data:`, data ? "Found" : "null")

      if (!data) {
        console.log(`[TokenStore] No data found for key: ${key}`)
        return null
      }

      if (typeof data === "object") {
        console.log(`[TokenStore] Data is already an object, returning directly`)
        return data as NormalizedEvent
      }

      console.log(`[TokenStore] Parsing JSON data`)
      return JSON.parse(data) as NormalizedEvent
    } catch (error) {
      console.error(`[TokenStore] Error retrieving/parsing data for key ${key}:`, error)
      throw error
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
    console.log(`[TokenStore] Deleted token: ${key}`)
  }
}

export const tokenStore = TokenStoreService.getInstance()
