"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import messagesConfig from "@/config/messages.json"
import type { VerificationResult } from "@/lib/api-client"
import { AlertTriangle, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { SupportLink } from "./support-link"
import { VerificationCard } from "./verification-card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isDummy?: boolean // Flag to distinguish dummy messages from real AI messages
}

interface AIChatProps {
  systemPrompt?: string
}

type VerificationState = "idle" | "asking_completion" | "ready_to_verify"

export function AIChat({ systemPrompt }: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedUser, setVerifiedUser] = useState<VerificationResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [transactionId, setTransactionId] = useState("")
  const [supportLinkClicked, setSupportLinkClicked] = useState(false)
  const [showSupportMessage, setShowSupportMessage] = useState(false)
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
            } else {
              // Session expired or invalid, remove it
              localStorage.removeItem("coffee_engine_session")
            }
          } else {
            // Session not found, remove it
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
  }, [messages, verificationState])

  const handleVerified = (result: VerificationResult) => {
    if (result.valid) {
      setIsVerified(true)
      setVerifiedUser(result)
      setVerificationState("idle")
      
      // Save session ID if provided
      if (result.sessionId) {
        setSessionId(result.sessionId)
        if (typeof window !== "undefined") {
          localStorage.setItem("coffee_engine_session", result.sessionId)
        }
      }
      
      // Add a personalized success message as a chat message that stays in the chat history
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Verified! Thanks for your support, ${result.payerEmail || "supporter"}! Let's continue chatting.`,
        timestamp: new Date(),
        isDummy: false, // This is a real message, not a dummy
      }
      setMessages((prev) => [...prev, successMessage])
    }
  }

  const isAffirmative = (text: string): boolean => {
    const lower = text.toLowerCase().trim()
    return ["yes", "y", "yeah", "yep", "sure", "ok", "okay", "done", "completed", "finished"].includes(lower)
  }

  const looksLikeTransactionId = (text: string): boolean => {
    // Check if it looks like a transaction ID (contains TXN, numbers, letters, etc.)
    return /txn|transaction|^[a-z0-9_-]{8,}/i.test(text.trim())
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

    // If not verified, handle conversation flow
    if (!isVerified) {
      setTimeout(() => {
        let assistantMessage: Message

        if (verificationState === "idle") {
          // First message - ask about coffee support
          assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: messagesConfig.firstMessage,
            timestamp: new Date(),
            isDummy: true, // Mark as dummy message
          }
          setVerificationState("asking_completion")
        } else if (verificationState === "asking_completion") {
          // User responded to "have you completed transaction?"
          // If support link was clicked, skip to asking for transaction ID
          if (supportLinkClicked) {
            assistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: messagesConfig.askTransactionId,
              timestamp: new Date(),
              isDummy: true, // Mark as dummy message
            }
            setVerificationState("ready_to_verify")
            setSupportLinkClicked(false) // Reset flag
          } else if (isAffirmative(userInput)) {
            assistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: messagesConfig.askTransactionId,
              timestamp: new Date(),
              isDummy: true, // Mark as dummy message
            }
            setVerificationState("ready_to_verify")
          } else {
            assistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: messagesConfig.transactionNotCompleted,
              timestamp: new Date(),
              isDummy: true, // Mark as dummy message
            }
            setVerificationState("asking_completion")
          }
        } else {
          // Fallback
          assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: messagesConfig.fallback,
            timestamp: new Date(),
            isDummy: true, // Mark as dummy message
          }
          setVerificationState("asking_completion")
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1000)
      return
    }

    // If verified, make actual API call
    // Note: API keys are handled server-side via environment variables
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "x-session-id": sessionId }),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .filter((m) => !m.isDummy) // Filter out dummy messages before sending to AI
            .map((m) => ({
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
        isDummy: false, // Real AI message
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSupportClick = () => {
    setSupportLinkClicked(true)
    // Show the message below the support button after a short delay
    setTimeout(() => {
      setShowSupportMessage(true)
    }, 300)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {error && (
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Chat Error</strong>
            <p className="text-sm mt-1">{error.message}</p>
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="text-lg">AI Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pb-4 pr-4">
              {messages.length === 0 && verificationState === "idle" && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-8">
                  <p className="text-sm">Start chatting to begin</p>
                </div>
              )}
              {messages.map((message, index) => {
                const isFirstAssistantMessage = message.role === "assistant" && 
                  messages.findIndex(m => m.role === "assistant") === index
                const shouldShowSupportAfterThis = isFirstAssistantMessage && !isVerified && verificationState !== "idle"
                const isAskTransactionIdMessage = message.role === "assistant" && 
                  message.content === messagesConfig.askTransactionId
                const shouldShowVerificationAfterThis = isAskTransactionIdMessage && 
                  verificationState === "ready_to_verify" && !isVerified
                
                return (
                  <div key={message.id}>
                    <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.isDummy
                              ? "bg-muted/50 text-muted-foreground/70" // Dummy messages with reduced opacity
                              : "bg-muted text-muted-foreground" // Real AI messages with full opacity
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span
                        className={`text-xs mt-1 px-1 ${
                          message.isDummy ? "text-muted-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {/* Support button - appears right after first AI message and stays there */}
                    {shouldShowSupportAfterThis && (
                      <div className="flex flex-col justify-start space-y-3 mt-3">
                        <div className="max-w-md w-full">
                          <SupportLink className="justify-start" onSupportClick={handleSupportClick} />
                        </div>
                        {showSupportMessage && (
                          <div className="flex flex-col items-start">
                            <div className="max-w-xs px-4 py-2 rounded-lg bg-muted/50 text-muted-foreground/70">
                              <p className="text-sm whitespace-pre-wrap">{messagesConfig.supportButtonClicked}</p>
                            </div>
                            <span className="text-xs text-muted-foreground/70 mt-1 px-1">
                              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Verification card - appears right after the message asking for transaction ID */}
                    {shouldShowVerificationAfterThis && (
                      <div className="flex justify-start mt-3">
                        <div className="max-w-md w-full">
                          <VerificationCard onVerified={handleVerified} defaultTransactionId={transactionId} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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
              placeholder={isVerified ? "Ask your AI anything..." : "Type your message..."}
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
