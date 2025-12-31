"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient, type VerificationResult } from "@/lib/api-client"
import { CheckCircle2, AlertTriangle, Copy } from "lucide-react"

interface VerificationCardProps {
  onVerified?: (result: VerificationResult) => void
}

export function VerificationCard({ onVerified }: VerificationCardProps) {
  const [transactionId, setTransactionId] = useState("")
  const [providerId, setProviderId] = useState("bmc")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async () => {
    if (!transactionId.trim()) {
      return
    }

    setLoading(true)
    try {
      const verificationResult = await apiClient.verifyTransaction(transactionId, providerId)
      setResult(verificationResult)
      onVerified?.(verificationResult)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleVerify()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verify Transaction</CardTitle>
        <CardDescription>Enter your transaction ID to verify payment and unlock premium features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="transaction-id" className="text-sm font-medium">
            Transaction ID
          </label>
          <Input
            id="transaction-id"
            placeholder="e.g., TXN_12345ABC"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="provider-id" className="text-sm font-medium">
            Payment Provider
          </label>
          <select
            id="provider-id"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="bmc">Buy Me a Coffee</option>
            <option value="stripe">Stripe</option>
            <option value="patreon">Patreon</option>
          </select>
        </div>

        <Button onClick={handleVerify} disabled={loading || !transactionId.trim()} className="w-full">
          {loading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Verifying...
            </>
          ) : (
            "Verify Transaction"
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            {result.valid ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Transaction Verified!</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    {result.amountMinor && (
                      <p>
                        Amount: {((result.amountMinor || 0) / 100).toFixed(2)} {result.currency || "USD"}
                      </p>
                    )}
                    {result.payerEmail && <p>Payer: {result.payerEmail}</p>}
                    {result.occurredAt && <p>Date: {new Date(result.occurredAt).toLocaleDateString()}</p>}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Verification Failed</strong>
                  <p className="text-sm mt-1">{result.reason}</p>
                </AlertDescription>
              </Alert>
            )}

            {result.externalId && (
              <div className="flex items-center justify-between rounded-md bg-muted p-2 text-xs">
                <code>{result.externalId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.externalId || "")
                  }}
                  className="ml-2 hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
