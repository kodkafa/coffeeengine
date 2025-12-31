// Verification API endpoint

import { type NextRequest, NextResponse } from "next/server"
import { verificationService } from "@/services/verification.service"
import { config } from "@/config"

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get("x-coffee-api-key")
    if (!apiKey || apiKey !== config.coffeeApiKey) {
      return NextResponse.json({ error: "Unauthorized", message: "Invalid or missing API key" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { transactionId, providerId = "bmc", contextId } = body

    if (!transactionId) {
      return NextResponse.json({ error: "Bad Request", message: "transactionId is required" }, { status: 400 })
    }

    console.log(`[VerifyAPI] Verifying transaction: ${transactionId} (provider: ${providerId})`)

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
    console.error("[VerifyAPI] Error:", error)
    return NextResponse.json({ error: "Internal Server Error", message: "Verification failed" }, { status: 500 })
  }
}
