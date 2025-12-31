import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Coffee Engine</h1>
          <p className="text-xl text-muted-foreground">A modular, provider-agnostic payment verification system</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Development Tools</CardTitle>
              <CardDescription>Test webhooks and verification without real payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dev/webhook-tester">Webhook Tester</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dev/verify-tester">Verification Tester</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dev/events">Event Browser</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>OpenAPI specification and integration guides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/api/openapi">OpenAPI Spec</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/api/coffee/health">Health Check</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/api/events?providerId=bmc&limit=10">Events API</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Architecture Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="font-semibold">Phase 0: Setup</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Config service</li>
                  <li>✓ Type definitions</li>
                  <li>✓ KV integration</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Phase 1: Webhooks</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Provider registry</li>
                  <li>✓ BMC adapter (16+ events)</li>
                  <li>✓ Token & event storage</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Phase 2: API</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Verification endpoint</li>
                  <li>✓ OpenAPI spec</li>
                  <li>✓ Custom GPT ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Set environment variables (see .env.local.example)</li>
              <li>
                Test webhook processing at{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">/dev/webhook-tester</code>
              </li>
              <li>
                Verify transactions at <code className="text-xs bg-muted px-1 py-0.5 rounded">/dev/verify-tester</code>
              </li>
              <li>
                Browse all events at <code className="text-xs bg-muted px-1 py-0.5 rounded">/dev/events</code>
              </li>
              <li>Integrate with Custom GPT using the OpenAPI spec</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
