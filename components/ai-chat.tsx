"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { VerificationResult } from "@/lib/api-client"
import { useChat } from "@ai-sdk/react"
import { AlertTriangle, CheckCircle2, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { VerificationCard } from "./verification-card"

interface AIChatProps {
  apiKey?: string
  systemPrompt?: string
}

export function AIChat({ apiKey, systemPrompt }: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedUser, setVerifiedUser] = useState<VerificationResult | null>(null)
  const [showVerificationError, setShowVerificationError] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      systemPrompt:
        systemPrompt ||
        `You are a helpful premium AI assistant. 
         The user has verified their payment, so you can provide premium features and content.
         Be personable, helpful, and insightful. Answer questions thoroughly.`,
      verificationContext: isVerified ? verifiedUser : null,
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleVerified = (result: VerificationResult) => {
    if (result.valid) {
      setIsVerified(true)
      setVerifiedUser(result)
      setShowVerificationError(false)
    } else {
      setShowVerificationError(true)
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isVerified) {
      setShowVerificationError(true)
      return
    }
    handleSubmit(e)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Chat Error</strong>
            <p className="text-sm mt-1">{error.message}</p>
          </AlertDescription>
        </Alert>
      )}

      {isVerified && verifiedUser && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Premium Access Granted</strong>
            <p className="text-sm mt-1">
              Verified as {verifiedUser.payerEmail || "supporter"}. You have full access to premium features.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {showVerificationError && !isVerified && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Verification Required</strong>
            <p className="text-sm mt-1">Please verify your payment to unlock premium features</p>
          </AlertDescription>
        </Alert>
      )}

      <Card className="h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Premium AI Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Verify your payment to start chatting with your personal AI</p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              placeholder={isVerified ? "Ask your AI anything..." : "Verify payment to chat"}
              value={input}
              onChange={handleInputChange}
              disabled={!isVerified || isLoading}
            />
            <Button type="submit" disabled={!isVerified || isLoading || !input.trim()} size="icon">
              {isLoading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!isVerified && <VerificationCard onVerified={handleVerified} />}
    </div>
  )
}
