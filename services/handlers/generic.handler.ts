// Generic handler for all event types - stores in event store

import type { NormalizedEvent } from "@/types"
import { eventStore } from "@/services/event-store.service"

export async function handleGenericEvent(event: NormalizedEvent): Promise<void> {
  console.log(`[GenericHandler] Processing ${event.eventType}: ${event.externalId}`)

  // Store all events in the event store for historical records
  await eventStore.storeEvent(event)

  console.log(`[GenericHandler] Event stored successfully`)
}
