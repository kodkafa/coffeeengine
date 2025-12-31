// Higher-order function to protect routes without repetitive checks

import { type NextRequest, NextResponse } from "next/server"
import { config } from "@/config"

/**
 * Higher-order function to protect API routes with API key authentication
 * Usage: export const POST = withAuth(async (req) => { ... })
 */
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const apiKey = req.headers.get("x-coffee-api-key")

    if (!apiKey || apiKey !== config.coffeeApiKey) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid x-coffee-api-key header required",
        },
        { status: 401 },
      )
    }

    return handler(req)
  }
}
