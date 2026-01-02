import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  logger.debug({ method: request.method, pathname }, "Middleware request")

  const hasAuth = request.headers.has("x-coffee-api-key")
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/openapi") && !pathname.startsWith("/api/mcp")) {
    logger.debug({ pathname, hasAuth }, "Protected route check")
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes except those that don't need auth
    "/api/:path*",
    // Match dev routes
    "/dev/:path*",
  ],
}
