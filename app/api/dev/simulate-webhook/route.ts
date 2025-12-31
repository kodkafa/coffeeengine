// Development-only webhook simulator

import { type NextRequest, NextResponse } from "next/server"
import { config } from "@/config"
import { providerRegistry } from "@/services/provider-registry.service"
import { eventRouter } from "@/services/event-router.service"
import { bootstrap } from "@/lib/bootstrap"

bootstrap()

export async function POST(request: NextRequest) {
  // Only allow in development
  if (!config.isDevelopment) {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  try {
    const { providerId, payload } = await request.json()

    if (!providerId || !payload) {
      return NextResponse.json({ error: "Missing providerId or payload" }, { status: 400 })
    }

    // Resolve provider
    const provider = providerRegistry.resolve(providerId)
    if (!provider) {
      return NextResponse.json({ error: "Provider not found", providerId }, { status: 404 })
    }

    // Normalize payload (skip signature verification in dev mode)
    const normalizedEvent = await provider.normalizePayload(payload)

    console.log(`[DevSimulator] Simulating ${normalizedEvent.eventType} from ${providerId}`)

    // Dispatch to handlers
    await eventRouter.dispatch(normalizedEvent)

    return NextResponse.json({
      ok: true,
      simulated: true,
      event: normalizedEvent,
    })
  } catch (error) {
    console.error("[DevSimulator] Error:", error)
    return NextResponse.json({ error: "Simulation failed", details: String(error) }, { status: 500 })
  }
}
