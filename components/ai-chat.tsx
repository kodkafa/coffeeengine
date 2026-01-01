"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import chatSettings from "@/config/chat-settings.json"
import type { VerificationResult } from "@/lib/api-client"
import { getRandomMessage } from "@/lib/utils"
import { AlertTriangle, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CoffeeTimer } from "./coffee-timer"
import { SupportLink } from "./support-link"
import { VerificationCard } from "./verification-card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  showVerification?: boolean // Flag to show verification card inline
  showFAQButtons?: boolean // Flag to show FAQ buttons after this message
  showSupportButtons?: boolean // Flag to show support buttons after this message
}

interface AIChatProps {
  systemPrompt?: string
}

export function AIChat({ systemPrompt }: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedUser, setVerifiedUser] = useState<VerificationResult | null>(null)
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (typeof window === "undefined") return

      const storedSessionId = localStorage.getItem("coffee_engine_session")
      if (storedSessionId) {
        try {
          const response = await fetch(`/api/coffee/session?sessionId=${storedSessionId}`)
          if (response.ok) {
            const sessionData = await response.json()
            if (sessionData.valid) {
              setSessionId(storedSessionId)
              setIsVerified(true)
              setVerifiedUser({
                ok: true,
                valid: true,
                reason: "Session valid",
                payerEmail: sessionData.payerEmail,
                providerId: sessionData.providerId,
                externalId: sessionData.transactionId,
                amountMinor: sessionData.amountMinor,
                currency: sessionData.currency,
              })
              if (sessionData.verifiedAt) {
                setVerifiedAt(new Date(sessionData.verifiedAt))
              } else {
                setVerifiedAt(new Date())
              }
              const successMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: getRandomMessage(chatSettings.messages.tx_success),
                timestamp: new Date(),
              }
              setMessages([successMessage])
            } else {
              localStorage.removeItem("coffee_engine_session")
            }
          } else {
            localStorage.removeItem("coffee_engine_session")
          }
        } catch (error) {
          console.error("[AIChat] Error checking session:", error)
          localStorage.removeItem("coffee_engine_session")
        }
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleVerified = (result: VerificationResult) => {
    if (result.valid) {
      const now = new Date()
      setIsVerified(true)
      setVerifiedUser(result)
      setVerifiedAt(now)

      if (result.sessionId) {
        setSessionId(result.sessionId)
        if (typeof window !== "undefined") {
          localStorage.setItem("coffee_engine_session", result.sessionId)
        }
      }

      // Remove verification flag from messages
      setMessages((prev) =>
        prev.map((m) => {
          if (m.showVerification) {
            return { ...m, showVerification: false }
          }
          return m
        }),
      )

      // Add success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: getRandomMessage(chatSettings.messages.tx_success),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } else {
      // Verification failed
      const failMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: getRandomMessage(chatSettings.messages.tx_fail),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, failMessage])
    }
  }

  const handleTimerExpire = () => {
    setIsVerified(false)
    setVerifiedUser(null)
    setVerifiedAt(null)
    setSessionId(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("coffee_engine_session")
    }
    const expireMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: getRandomMessage(chatSettings.messages.session_expired),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, expireMessage])
  }

  // Mode A: Pre-Verification FAQ Click Handler (Free Tier - Instant Answers)
  const handleFAQClick = (faq: { id: string; label: string; question: string; answer: string }) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: faq.question,
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: faq.answer,
      timestamp: new Date(),
      showFAQButtons: true, // Show FAQ buttons after this answer
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
  }

  // Mode B: Post-Verification Starter Click Handler (Premium Tier - AI Powered)
  const handleStarterClick = async (starterText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: starterText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "x-session-id": sessionId }),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt,
          sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(err instanceof Error ? err.message : "An error occurred"),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    // Mode C: Manual Typing - Check if user is verified
    if (!isVerified) {
      // Step 1: Show support buttons first
      setTimeout(() => {
        const supportMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
          showSupportButtons: true,
        }
        setMessages((prev) => [...prev, supportMessage])
        
        // Step 2: Show paywall trigger message after support buttons
        setTimeout(() => {
          const paywallMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: getRandomMessage(chatSettings.messages.paywall_trigger),
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, paywallMessage])
          
          // Step 3: Show verification card after paywall message
          setTimeout(() => {
            const verificationMessage: Message = {
              id: (Date.now() + 3).toString(),
              role: "assistant",
              content: "",
              timestamp: new Date(),
              showVerification: true,
            }
            setMessages((prev) => [...prev, verificationMessage])
          }, 500)
        }, 500)
        
        setIsLoading(false)
      }, 1000)
      return
    }

    // If verified, send to AI API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "x-session-id": sessionId }),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt,
          sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(err instanceof Error ? err.message : "An error occurred"),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {error && (
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{chatSettings.messages.chat_error}</strong>
            <p className="text-sm mt-1">{error.message}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Coffee Timer - only show when verified */}
      {isVerified && verifiedAt && (
        <CoffeeTimer
          verifiedAt={verifiedAt}
          durationMinutes={chatSettings.session.durationMinutes}
          onExpire={handleTimerExpire}
        />
      )}

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="text-lg">{chatSettings.agent.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pb-4 pr-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-8">
                  <p className="text-sm">{getRandomMessage(chatSettings.messages.welcome)}</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={message.id}>
                  {message.content && (
                    <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                  {/* Support Buttons after user message */}
                  {message.showSupportButtons && !isVerified && (
                    <div className="flex justify-start mt-3">
                      <SupportLink />
                    </div>
                  )}
                  {/* FAQ Buttons after FAQ answer */}
                  {message.showFAQButtons && !isVerified && chatSettings.faq && chatSettings.faq.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {chatSettings.faq.map((faq) => (
                        <Button
                          key={faq.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFAQClick(faq)}
                          className="text-xs"
                          disabled={isLoading}
                        >
                          {faq.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {/* VerificationCard inline as part of message flow */}
                  {message.showVerification && !isVerified && (
                    <div className="flex justify-start mt-3">
                      <div className="max-w-md w-full">
                        <VerificationCard onVerified={handleVerified} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{chatSettings.messages.ai_thinking}</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* FAQ Buttons - shown above input only when chat is empty and not verified */}
          {!isVerified && messages.length === 0 && chatSettings.faq && chatSettings.faq.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {chatSettings.faq.map((faq) => (
                <Button
                  key={faq.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleFAQClick(faq)}
                  className="text-xs"
                  disabled={isLoading}
                >
                  {faq.label}
                </Button>
              ))}
            </div>
          )}

          {/* Starter Buttons - shown above input when verified and chat is empty */}
          {isVerified && messages.length === 0 && chatSettings.starters && chatSettings.starters.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {chatSettings.starters.map((starter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStarterClick(starter)}
                  className="text-xs"
                  disabled={isLoading}
                >
                  {starter}
                </Button>
              ))}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              placeholder={
                isVerified
                  ? chatSettings.messages.input_placeholder_verified
                  : chatSettings.messages.input_placeholder_unverified
              }
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
