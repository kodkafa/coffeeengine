import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Coffee Engine - Payment Verification System",
  description:
    "A modular, provider-agnostic payment verification system for gating premium features with AI integration",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold hover:opacity-80 transition">
              ☕ Coffee Engine
            </Link>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/premium">Premium</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/privacy">Privacy</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/api/openapi">API Docs</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-border bg-muted mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-3">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-foreground transition">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/premium" className="hover:text-foreground transition">
                      Premium
                    </Link>
                  </li>
                  <li>
                    <Link href="/api/openapi" className="hover:text-foreground transition">
                      API Docs
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Developers</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/dev/webhook-tester" className="hover:text-foreground transition">
                      Webhook Tester
                    </Link>
                  </li>
                  <li>
                    <Link href="/dev/events" className="hover:text-foreground transition">
                      Event Browser
                    </Link>
                  </li>
                  <li>
                    <Link href="/api/coffee/health" className="hover:text-foreground transition">
                      Health Check
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/privacy" className="hover:text-foreground transition">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Status</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="https://status.coffee-engine.local" className="hover:text-foreground transition">
                      System Status
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>Coffee Engine v2.0 - Modular Payment Verification for AI-Gated Features</p>
              <p className="mt-2">Built with Next.js 16, Zod, Vercel KV, and Shadcn/UI</p>
            </div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  )
}
