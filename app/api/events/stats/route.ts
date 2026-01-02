// Event statistics API

import { type NextRequest, NextResponse } from "next/server"
import { getDefaultProviderId } from "@/config/providers"
import { eventStore } from "@/services/event-store.service"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const providerId = searchParams.get("providerId") || getDefaultProviderId()

    const stats = await eventStore.getEventStats(providerId)

    return NextResponse.json({
      providerId,
      ...stats,
      totalRevenueFormatted: `$${(stats.totalRevenue / 100).toFixed(2)}`,
    })
  } catch (error) {
    logger.error({ error }, "Event stats API error")
    return NextResponse.json({ error: "Failed to fetch stats", details: String(error) }, { status: 500 })
  }
}
