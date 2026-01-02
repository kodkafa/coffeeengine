// Verification API endpoint with auth middleware

import { type NextRequest, NextResponse } from "next/server"
import { getDefaultProviderId } from "@/config/providers"
import { verificationService } from "@/services/verification.service"
import { withAuth } from "@/lib/auth-middleware"
import { logger } from "@/lib/logger"

async function handler(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { transactionId, providerId = getDefaultProviderId(), contextId } = body

    if (!transactionId) {
      return NextResponse.json({ error: "Bad Request", message: "transactionId is required" }, { status: 400 })
    }

    logger.debug({ providerId }, "Verifying transaction")

    // Call verification service
    const result = await verificationService.verify(transactionId, providerId)

    // Return result
    return NextResponse.json(
      {
        ok: true,
        ...result,
        contextId,
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error({ error }, "Verify API error")
    return NextResponse.json({ error: "Internal Server Error", message: "Verification failed" }, { status: 500 })
  }
}

export const POST = withAuth(handler)
