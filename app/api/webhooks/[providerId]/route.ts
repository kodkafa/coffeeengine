// Generic webhook intake route

import { type NextRequest, NextResponse } from "next/server"
import { providerRegistry } from "@/services/provider-registry.service"
import { eventRouter } from "@/services/event-router.service"
import { config } from "@/config"
import { bootstrap } from "@/lib/bootstrap"

// Ensure bootstrap runs before handling requests
bootstrap()

export async function POST(request: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params

  try {
    // Resolve provider
    const provider = providerRegistry.resolve(providerId)
    if (!provider) {
      return NextResponse.json({ error: "Provider not found", providerId }, { status: 404 })
    }

    // Read request body
    const body = await request.text()
    const headers = request.headers

    // Get provider secret
    const secret = config.getProviderSecret(providerId)
    if (!secret) {
      console.error(`[Webhook] No secret configured for provider: ${providerId}`)
      return NextResponse.json({ error: "Provider not configured" }, { status: 500 })
    }

    // Verify request signature
    const isValid = await provider.verifyRequest(headers, body, secret)
    if (!isValid) {
      console.warn(`[Webhook] Invalid signature for provider: ${providerId}`)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Parse and normalize payload
    const payload = JSON.parse(body)
    const normalizedEvent = await provider.normalizePayload(payload)

    console.log(`[Webhook] Received ${normalizedEvent.eventType} from ${providerId}: ${normalizedEvent.externalId}`)

    // Dispatch to event handlers
    await eventRouter.dispatch(normalizedEvent)

    // Acknowledge receipt to provider
    return NextResponse.json({ ok: true, received: true }, { status: 200 })
  } catch (error) {
    console.error(`[Webhook] Error processing webhook from ${providerId}:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
