"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StepComponentProps } from "@/types/chat-ui"
import { AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface VerificationCardProps extends StepComponentProps {
  defaultTransactionId?: string
  providerId?: string
  error?: string
}

export function VerificationCard({ onSendMessage, defaultTransactionId = "", providerId, error }: VerificationCardProps) {
  const [transactionId, setTransactionId] = useState(defaultTransactionId)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (defaultTransactionId) {
      setTransactionId(defaultTransactionId)
    }
  }, [defaultTransactionId])

  const handleVerify = async () => {
    if (!transactionId.trim() || loading) {
      return
    }

    setLoading(true)
    try {
      // Send transaction ID to step engine via onSendMessage
      // The step will handle verification and return result via messages
      await onSendMessage(transactionId.trim())
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
        <CardDescription>Verify your transaction to continue the conversation</CardDescription>
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

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Verification Failed</strong>
              <p className="text-sm mt-1">{error}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
