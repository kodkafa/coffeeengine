// Event Router Service - maps (providerId, eventType) to handlers

import { logger } from "@/lib/logger"
import type { NormalizedEvent } from "@/types"

export type EventHandler = (event: NormalizedEvent) => Promise<void>

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
    logger.debug({ key }, "Registered handler")
  }

  async dispatch(event: NormalizedEvent): Promise<void> {
    const key = this.getRouteKey(event.providerId, event.eventType)
    const handlers = this.routes.get(key) || []

    if (handlers.length === 0) {
      logger.warn({ key }, "No handlers for event")
      return
    }

    logger.debug({ key, handlerCount: handlers.length }, "Dispatching event")

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event)
        } catch (error) {
          logger.error({ key, error }, "Handler error")
        }
      }),
    )
  }
}

export const eventRouter = EventRouterService.getInstance()
