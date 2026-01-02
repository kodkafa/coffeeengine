import { logger } from "@/lib/logger"
import { eventStore } from "@/services/event-store.service"
import { tokenStore } from "@/services/token-store.service"
import type { NormalizedEvent } from "@/types"

export async function handleDonation(event: NormalizedEvent): Promise<void> {
  logger.info(
    {
      externalId: event.externalId,
      amount: event.amountMinor / 100,
      currency: event.currency,
    },
    "Processing donation"
  )

  await tokenStore.store(event)
  await eventStore.storeEvent(event)

  logger.debug({ externalId: event.externalId }, "Token and event stored successfully")
}

export async function handleGenericEvent(event: NormalizedEvent): Promise<void> {
  logger.debug({ eventType: event.eventType, externalId: event.externalId }, "Processing generic event")

  await eventStore.storeEvent(event)

  logger.debug({ eventType: event.eventType }, "Event stored successfully")
}

