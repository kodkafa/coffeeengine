import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[Middleware] ${request.method} ${pathname}`)

  const hasAuth = request.headers.has("x-coffee-api-key")
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/openapi") && !pathname.startsWith("/api/mcp")) {
    console.log(`[Middleware] Protected route - Auth header present: ${hasAuth}`)
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
