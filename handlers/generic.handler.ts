// Generic handler for all event types - stores in event store

import { logger } from "@/lib/logger"
import type { NormalizedEvent } from "@/types"
import { eventStore } from "@/services/event-store.service"

export async function handleGenericEvent(event: NormalizedEvent): Promise<void> {
  logger.debug({ eventType: event.eventType, externalId: event.externalId }, "Processing generic event")

  // Store all events in the event store for historical records
  await eventStore.storeEvent(event)

  logger.debug({ eventType: event.eventType }, "Event stored successfully")
}
