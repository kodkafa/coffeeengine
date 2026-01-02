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

  // Store the token for verification (with TTL)
  await tokenStore.store(event)

  // Store the event permanently for historical records
  await eventStore.storeEvent(event)

  logger.debug({ externalId: event.externalId }, "Token and event stored successfully")
}
