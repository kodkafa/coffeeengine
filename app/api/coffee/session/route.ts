// Session validation API endpoint for frontend

import { sessionStore } from "@/services/session-store.service"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Bad Request", message: "sessionId is required" }, { status: 400 })
    }

    const session = await sessionStore.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          valid: false,
          reason: "Session not found or expired",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        valid: session.verified,
        payerEmail: session.payerEmail,
        transactionId: session.transactionId,
        providerId: session.providerId,
        amountMinor: session.amountMinor,
        currency: session.currency,
        verifiedAt: session.verifiedAt,
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error({ error }, "Session API GET error")
    return NextResponse.json({ error: "Internal Server Error", message: "Session validation failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Bad Request", message: "sessionId is required" }, { status: 400 })
    }

    await sessionStore.deleteSession(sessionId)

    return NextResponse.json(
      {
        ok: true,
        message: "Session deleted successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error({ error }, "Session API DELETE error")
    return NextResponse.json({ error: "Internal Server Error", message: "Session deletion failed" }, { status: 500 })
  }
}

