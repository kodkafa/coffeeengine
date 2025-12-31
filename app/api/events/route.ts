// Events API - Query stored events

import { type NextRequest, NextResponse } from "next/server"
import { eventStore } from "@/services/event-store.service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const providerId = searchParams.get("providerId") || "bmc"
    const eventType = searchParams.get("eventType")
    const email = searchParams.get("email")
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

    let events

    if (email) {
      // Query by user email
      events = await eventStore.getUserEvents(email, limit, offset)
    } else if (eventType) {
      // Query by event type
      events = await eventStore.getEventsByType(providerId, eventType, limit, offset)
    } else {
      // Query all events for provider
      events = await eventStore.getProviderEvents(providerId, limit, offset)
    }

    return NextResponse.json({
      events,
      count: events.length,
      providerId,
      eventType,
      email,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[EventsAPI] Error:", error)
    return NextResponse.json({ error: "Failed to fetch events", details: String(error) }, { status: 500 })
  }
}
