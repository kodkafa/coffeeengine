// Event Router Service - maps (providerId, eventType) to handlers

import type { NormalizedEvent } from "@/types"

type EventHandler = (event: NormalizedEvent) => Promise<void>

export class EventRouterService {
  private static instance: EventRouterService
  private routes: Map<string, EventHandler[]> = new Map()

  private constructor() {}

  static getInstance(): EventRouterService {
    if (!EventRouterService.instance) {
      EventRouterService.instance = new EventRouterService()
    }
    return EventRouterService.instance
  }

  private getRouteKey(providerId: string, eventType: string): string {
    return `${providerId}:${eventType}`
  }

  registerHandler(providerId: string, eventType: string, handler: EventHandler): void {
    const key = this.getRouteKey(providerId, eventType)
    const handlers = this.routes.get(key) || []
    handlers.push(handler)
    this.routes.set(key, handlers)
    console.log(`[EventRouter] Registered handler for ${key}`)
  }

  async dispatch(event: NormalizedEvent): Promise<void> {
    const key = this.getRouteKey(event.providerId, event.eventType)
    const handlers = this.routes.get(key) || []

    if (handlers.length === 0) {
      console.warn(`[EventRouter] No handlers for ${key}`)
      return
    }

    console.log(`[EventRouter] Dispatching ${key} to ${handlers.length} handler(s)`)

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event)
        } catch (error) {
          console.error(`[EventRouter] Handler error for ${key}:`, error)
        }
      }),
    )
  }
}

export const eventRouter = EventRouterService.getInstance()
