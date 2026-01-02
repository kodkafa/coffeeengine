// Public verification API endpoint for frontend (no auth required)
// Creates a secure session upon successful verification

import { getDefaultProviderId } from "@/config/providers"
import { sessionStore } from "@/services/session-store.service"
import { verificationService } from "@/services/verification.service"
import { logger } from "@/lib/logger"
import { randomBytes } from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { transactionId, providerId = getDefaultProviderId(), contextId, createSession = true } = body

    if (!transactionId) {
      return NextResponse.json({ error: "Bad Request", message: "transactionId is required" }, { status: 400 })
    }

    logger.debug({ providerId }, "Verifying transaction (public)")

    // Call verification service
    const result = await verificationService.verify(transactionId, providerId)

    // If verification successful and session creation requested, create a session
    let sessionId: string | undefined
    if (result.valid && createSession) {
      // Generate a secure session ID
      sessionId = randomBytes(32).toString("hex")

      // Create session with verification data
      // expiresAt will be calculated automatically by createSession
      await sessionStore.createSession(sessionId, {
        verified: true,
        payerEmail: result.payerEmail,
        transactionId: result.externalId,
        providerId: result.providerId,
        amountMinor: result.amountMinor,
        currency: result.currency,
        verifiedAt: new Date().toISOString(),
        expiresAt: 0, // Will be calculated by createSession
      })

      logger.info({ sessionId }, "Created session")
    }

    // Return result with optional session ID
    return NextResponse.json(
      {
        ok: true,
        ...result,
        contextId,
        ...(sessionId && { sessionId }),
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error({ error }, "Verify public API error")
    return NextResponse.json({ error: "Internal Server Error", message: "Verification failed" }, { status: 500 })
  }
}

