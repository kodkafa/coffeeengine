// Event Store Service - persistent storage for all webhook events

import { kv } from "@/lib/kv"
import type { NormalizedEvent } from "@/types"

export class EventStoreService {
  private static instance: EventStoreService

  private constructor() {}

  static getInstance(): EventStoreService {
    if (!EventStoreService.instance) {
      EventStoreService.instance = new EventStoreService()
    }
    return EventStoreService.instance
  }

  // Store event with multiple index keys for flexible querying
  async storeEvent(event: NormalizedEvent): Promise<void> {
    const timestamp = Date.now()
    const eventKey = `event:${event.providerId}:${event.externalId}`
    const eventWithTimestamp = { ...event, storedAt: timestamp }

    // 1. Store the full event data
    await kv.set(eventKey, JSON.stringify(eventWithTimestamp))

    // 2. Add to provider-specific event list (for pagination)
    const providerListKey = `events:${event.providerId}`
    await kv.zadd(providerListKey, { score: timestamp, member: eventKey })

    // 3. Add to event-type-specific list
    const eventTypeListKey = `events:${event.providerId}:${event.eventType}`
    await kv.zadd(eventTypeListKey, { score: timestamp, member: eventKey })

    // 4. Add to user-specific list (if email exists)
    if (event.payerEmail) {
      const userListKey = `events:user:${event.payerEmail}`
      await kv.zadd(userListKey, { score: timestamp, member: eventKey })
    }

    console.log(`[EventStore] Stored event: ${eventKey} of type ${event.eventType}`)
  }

  // Retrieve a specific event
  async getEvent(providerId: string, externalId: string): Promise<NormalizedEvent | null> {
    const eventKey = `event:${providerId}:${externalId}`
    const data = await kv.get<string>(eventKey)

    if (!data) {
      return null
    }

    return JSON.parse(data) as NormalizedEvent
  }

  // Get all events for a provider (paginated)
  async getProviderEvents(providerId: string, limit = 50, offset = 0): Promise<NormalizedEvent[]> {
    const providerListKey = `events:${providerId}`
    const eventKeys = await kv.zrange(providerListKey, offset, offset + limit - 1, {
      rev: true,
    })

    return this.fetchEventsByKeys(eventKeys as string[])
  }

  // Get events by type
  async getEventsByType(providerId: string, eventType: string, limit = 50, offset = 0): Promise<NormalizedEvent[]> {
    const eventTypeListKey = `events:${providerId}:${eventType}`
    const eventKeys = await kv.zrange(eventTypeListKey, offset, offset + limit - 1, {
      rev: true,
    })

    return this.fetchEventsByKeys(eventKeys as string[])
  }

  // Get events by user email
  async getUserEvents(email: string, limit = 50, offset = 0): Promise<NormalizedEvent[]> {
    const userListKey = `events:user:${email}`
    const eventKeys = await kv.zrange(userListKey, offset, offset + limit - 1, { rev: true })

    return this.fetchEventsByKeys(eventKeys as string[])
  }

  // Get event statistics
  async getEventStats(providerId: string): Promise<{
    totalEvents: number
    eventTypeBreakdown: Record<string, number>
    totalRevenue: number
  }> {
    const providerListKey = `events:${providerId}`
    const totalEvents = await kv.zcard(providerListKey)

    const eventKeys = await kv.zrange(providerListKey, 0, -1)
    const events = await this.fetchEventsByKeys(eventKeys as string[])

    const eventTypeBreakdown: Record<string, number> = {}
    let totalRevenue = 0

    for (const event of events) {
      eventTypeBreakdown[event.eventType] = (eventTypeBreakdown[event.eventType] || 0) + 1
      totalRevenue += event.amountMinor
    }

    return {
      totalEvents: totalEvents || 0,
      eventTypeBreakdown,
      totalRevenue,
    }
  }

  // Helper: Fetch multiple events by keys
  private async fetchEventsByKeys(keys: string[]): Promise<NormalizedEvent[]> {
    if (keys.length === 0) return []

    const events: NormalizedEvent[] = []

    for (const key of keys) {
      const data = await kv.get<string>(key)
      if (data) {
        events.push(JSON.parse(data) as NormalizedEvent)
      }
    }

    return events
  }
}

export const eventStore = EventStoreService.getInstance()
