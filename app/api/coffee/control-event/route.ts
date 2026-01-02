// Event Control API endpoint
// Calls provider's controlEvent method to process verified transaction

import { getDefaultProviderId } from "@/config/providers"
import { providerRegistry } from "@/services/provider-registry.service"
import { tokenStore } from "@/services/token-store.service"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { transactionId, providerId = getDefaultProviderId() } = body

    if (!transactionId) {
      return NextResponse.json({ error: "Bad Request", message: "transactionId is required" }, { status: 400 })
    }

    logger.debug({ providerId, transactionId }, "Controlling event")

    // Retrieve the normalized event from token store
    const event = await tokenStore.retrieve(providerId, transactionId)

    if (!event) {
      return NextResponse.json(
        { error: "Not Found", message: "Transaction not found or expired" },
        { status: 404 }
      )
    }

    // Resolve provider from registry
    const provider = providerRegistry.resolve(providerId)

    if (!provider) {
      return NextResponse.json(
        { error: "Internal Server Error", message: "Provider not found" },
        { status: 500 }
      )
    }

    // Check if transaction has already been used
    const isUsed = await tokenStore.isUsed(providerId, transactionId)
    if (isUsed) {
      return NextResponse.json(
        { error: "Bad Request", message: "This transaction has already been verified and used" },
        { status: 400 }
      )
    }

    // Call provider's controlEvent method
    const controlResult = await provider.controlEvent(event)

    // Mark transaction as used after successful control
    await tokenStore.markAsUsed(providerId, transactionId)

    logger.info({ providerId, transactionId, TTL: controlResult.TTL }, "Event controlled successfully")

    return NextResponse.json(
      {
        ok: true,
        ...controlResult,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Control event API error")
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to control event" },
      { status: 500 }
    )
  }
}

