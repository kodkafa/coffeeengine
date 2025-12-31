// Health check endpoint (no authentication required)

import { NextResponse } from "next/server"
import { config } from "@/config"

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Coffee Engine",
    version: "1.0.0",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  })
}
