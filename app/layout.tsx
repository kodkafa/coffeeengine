import Version from "@/components/common/version"
import { Logo } from "@/components/logo"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import "@/styles/globals.css"
import { Analytics } from "@vercel/analytics/next"
import { Github } from "lucide-react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import type React from "react"

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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="font-sans antialiased h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="border-b border-border shrink-0">
            <div className="px-4 py-4 flex items-center justify-between">
              <Logo />
              <nav className="flex items-center gap-4">
                <Button variant="default" asChild>
                  <Link href="/privacy">Privacy</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/api/openapi">API Docs</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="https://chatgpt.com/g/g-695529d612d08191af7f52a9f5424ccb-coffee-engine" target="_blank" rel="noopener noreferrer">
                    Custom GPT
                  </Link>
                </Button>
                <Button variant="default" size="icon" asChild>
                  <Link href="https://github.com/kodkafa/coffeeengine" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub Repository</span>
                  </Link>
                </Button>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
          <Version />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
