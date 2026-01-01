// Session Store Service - manages user verification sessions for AI chat

import { kv } from "@/lib/kv"
import { config } from "@/config"

export interface UserSession {
  verified: boolean
  payerEmail?: string
  transactionId?: string
  providerId?: string
  amountMinor?: number
  currency?: string
  verifiedAt: string
  expiresAt: number // Unix timestamp
}

export interface ISessionStore {
  createSession(sessionId: string, session: UserSession): Promise<void>
  getSession(sessionId: string): Promise<UserSession | null>
  updateSession(sessionId: string, updates: Partial<UserSession>): Promise<void>
  deleteSession(sessionId: string): Promise<void>
  exists(sessionId: string): Promise<boolean>
}

export class SessionStoreService implements ISessionStore {
  private static instance: SessionStoreService

  private constructor() {}

  static getInstance(): SessionStoreService {
    if (!SessionStoreService.instance) {
      SessionStoreService.instance = new SessionStoreService()
    }
    return SessionStoreService.instance
  }

  private getKey(sessionId: string): string {
    return `session:${sessionId}`
  }

  async createSession(sessionId: string, session: UserSession): Promise<void> {
    const key = this.getKey(sessionId)
    const ttl = config.userSessionTtlSeconds

    // Calculate expiresAt if not provided
    const expiresAt = session.expiresAt || Math.floor(Date.now() / 1000) + ttl

    const sessionWithExpiry: UserSession = {
      ...session,
      expiresAt,
    }

    await kv.set(key, JSON.stringify(sessionWithExpiry), {
      ex: ttl,
    })

    console.log(`[SessionStore] Created session: ${key} with TTL: ${ttl}s`)
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    const key = this.getKey(sessionId)

    try {
      const data = await kv.get<string>(key)

      if (!data) {
        return null
      }

      if (typeof data === "object") {
        return data as UserSession
      }

      const parsed = JSON.parse(data) as UserSession

      // Check if session is expired
      if (parsed.expiresAt && parsed.expiresAt < Math.floor(Date.now() / 1000)) {
        await this.deleteSession(sessionId)
        return null
      }

      return parsed
    } catch (error) {
      console.error(`[SessionStore] Error retrieving session ${key}:`, error)
      return null
    }
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    const existing = await this.getSession(sessionId)

    if (!existing) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const updated: UserSession = {
      ...existing,
      ...updates,
    }

    await this.createSession(sessionId, updated)
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = this.getKey(sessionId)
    await kv.del(key)
    console.log(`[SessionStore] Deleted session: ${key}`)
  }

  async exists(sessionId: string): Promise<boolean> {
    const key = this.getKey(sessionId)
    const exists = await kv.exists(key)
    return exists === 1
  }
}

export const sessionStore = SessionStoreService.getInstance()

