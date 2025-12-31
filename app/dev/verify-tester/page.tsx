"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function VerifyTesterPage() {
  const [transactionId, setTransactionId] = useState("TXN_TEST_999")
  const [providerId, setProviderId] = useState("bmc")
  const [apiKey, setApiKey] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch("/api/coffee/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Coffee-API-Key": apiKey || "test-key",
        },
        body: JSON.stringify({
          transactionId,
          providerId,
        }),
      })

      const data = await res.json()
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      })
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        data: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  const isValid = response?.data?.valid === true

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Verification API Tester</h1>
      <p className="text-muted-foreground mb-8">Test the Coffee Engine verification API endpoint</p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification Request</CardTitle>
            <CardDescription>Enter transaction details to verify a payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., TXN_TEST_999"
              />
              <p className="text-xs text-muted-foreground">
                Use TXN_TEST_999 if you've run the webhook tester with default values
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerId">Provider ID</Label>
              <Input
                id="providerId"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                placeholder="bmc"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional for dev)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave empty to use default dev key"
              />
            </div>

            <Button onClick={handleVerify} disabled={loading} className="w-full">
              {loading ? "Verifying..." : "Verify Transaction"}
            </Button>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Response</span>
                <Badge variant={isValid ? "default" : "destructive"}>
                  {response.status} {response.statusText}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.data?.valid !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={response.data.valid ? "default" : "secondary"}>
                    {response.data.valid ? "✓ Valid" : "✗ Invalid"}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <Label>Full Response</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  <code>{JSON.stringify(response.data, null, 2)}</code>
                </pre>
              </div>

              {response.data?.valid && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="text-base text-green-900 dark:text-green-100">Transaction Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{response.data.providerId}</span>

                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-xs">{response.data.externalId}</span>

                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">
                        {response.data.currency} {(response.data.amountMinor / 100).toFixed(2)}
                      </span>

                      <span className="text-muted-foreground">Occurred At:</span>
                      <span className="text-xs">{new Date(response.data.occurredAt).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Testing Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                First, go to{" "}
                <a href="/dev/webhook-tester" className="text-primary hover:underline">
                  /dev/webhook-tester
                </a>{" "}
                to simulate a payment
              </li>
              <li>Note the transaction ID from the sample payload (default: TXN_TEST_999)</li>
              <li>Return here and verify that transaction using the form above</li>
              <li>The token will expire after 30 days (or your configured TTL)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
