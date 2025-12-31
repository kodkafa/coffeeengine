import type { NormalizedEvent } from "@/types"
import { tokenStore } from "@/services/token-store.service"
import { eventStore } from "@/services/event-store.service"

export async function handleDonation(event: NormalizedEvent): Promise<void> {
  console.log(
    `[DonationHandler] Processing donation: ${event.externalId} for ${event.amountMinor / 100} ${event.currency}`,
  )

  // Store the token for verification (with TTL)
  await tokenStore.store(event)

  // Store the event permanently for historical records
  await eventStore.storeEvent(event)

  console.log(`[DonationHandler] Token and event stored successfully`)
}
