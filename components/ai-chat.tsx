"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import chatSettings from "@/config/chat-messages.json"
import { getAllProviderMetadata } from "@/config/providers"
import { getRandomMessage } from "@/lib/utils"
import { AlertTriangle, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CoffeeTimer } from "./coffee-timer"
import { ProviderSelector, type ProviderOption } from "./steps/provider-selector"
import { SupportCard } from "./steps/support-card"
import { VerificationCard } from "./verification-card"

/**
 * Message from Step Engine API
 */
interface StepMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string | Date
}

/**
 * UI Component from Step Engine (legacy)
 */
interface StepComponent {
  type: "faq_buttons" | "provider_buttons" | "verification_card" | string
  props?: Record<string, unknown>
}

/**
 * Step UI configuration (new)
 */
interface StepUI {
  component: "provider-selector" | "support-card" | "verification-status" | "faq_buttons" | "verification_card"
  props?: Record<string, unknown>
}

/**
 * Step Engine API Response
 */
interface StepEngineResponse {
  success: boolean
  result: {
    messages?: StepMessage[]
    components?: StepComponent[] // Legacy
    ui?: StepUI // New: Generic UI component specification
  }
  metadata?: {
    currentStepId?: string
    messageCount?: number
    hasSession?: boolean
  }
  rateLimit?: {
    remaining?: number
    resetAt?: number
  }
  error?: string
}

interface AIChatProps {
  systemPrompt?: string
}

/**
 * Generates a unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gets or creates a conversation ID from localStorage
 */
function getConversationId(): string {
  if (typeof window === "undefined") {
    return generateConversationId()
  }

  const stored = localStorage.getItem("coffee_engine_conversation_id")
  if (stored) {
    return stored
  }

  const newId = generateConversationId()
  localStorage.setItem("coffee_engine_conversation_id", newId)
  return newId
}

export function AIChat({ systemPrompt }: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [conversationId] = useState<string>(getConversationId)
  const [messages, setMessages] = useState<StepMessage[]>([])
  const [components, setComponents] = useState<StepComponent[]>([])
  const [ui, setUI] = useState<StepUI | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null)

  // Load initial conversation state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/chat?conversationId=${conversationId}`)

        if (!response.ok) {
          throw new Error("Failed to load conversation")
        }

        const data: StepEngineResponse = await response.json()

        if (data.success && data.result) {
          if (data.result.messages) {
            setMessages(data.result.messages)
          }
          if (data.result.components) {
            setComponents(data.result.components)
          }
          if (data.result.ui) {
            setUI(data.result.ui)
          }
          if (data.metadata?.hasSession) {
            setHasSession(true)
            // Note: verifiedAt would need to come from session data if available
            setVerifiedAt(new Date())
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialState()
  }, [conversationId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput("")
    await sendMessage(userInput)
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || "Failed to send message")
      }

      const data: StepEngineResponse = await response.json()

      if (data.success && data.result) {
        // Add new messages
        if (data.result.messages) {
          setMessages((prev) => [...prev, ...data.result.messages!])
        }

        // Update components (legacy)
        if (data.result.components) {
          setComponents(data.result.components)
        } else {
          setComponents([])
        }

        // Update UI (new)
        if (data.result.ui) {
          setUI(data.result.ui)
        } else {
          setUI(null)
        }

        // Update session state
        if (data.metadata?.hasSession) {
          setHasSession(true)
          if (!verifiedAt) {
            setVerifiedAt(new Date())
          }
        } else {
          setHasSession(false)
          setVerifiedAt(null)
        }
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFAQClick = async (faq: { id: string; label: string; question: string; answer: string }) => {
    await sendMessage(faq.question)
  }

  const handleProviderSelect = async (providerId: string) => {
    // Send provider selection to step engine
    await sendMessage(`provider:${providerId}`)
  }

  const handleVerificationSuccess = async (transactionId: string) => {
    // Send transaction ID as a message - the step engine will handle verification
    await sendMessage(transactionId)
  }

  /**
   * Converts provider metadata to ProviderOption format
   */
  const getProviderOptions = (): ProviderOption[] => {
    const metadata = getAllProviderMetadata()
    return metadata.map((config) => ({
      id: config.providerId,
      name: config.name,
      url: config.url || "#",
      icon: config.icon,
    }))
  }

  /**
   * Renders a UI component based on the new ui field
   */
  const renderUIComponent = (uiConfig: StepUI) => {
    switch (uiConfig.component) {
      case "provider-selector": {
        const providers = (uiConfig.props?.providers as ProviderOption[] | undefined) || getProviderOptions()
        return (
          <div className="mt-4">
            <ProviderSelector
              providers={providers}
              onProviderSelect={handleProviderSelect}
            />
          </div>
        )
      }

      case "support-card": {
        return (
          <div className="mt-4">
            <SupportCard
              title={uiConfig.props?.title as string | undefined}
              description={uiConfig.props?.description as string | undefined}
              errorContext={uiConfig.props?.errorContext as { message?: string; step?: string; details?: string } | undefined}
            />
          </div>
        )
      }

      case "verification_card":
      case "verification-status": {
        return (
          <div className="mt-4">
            <VerificationCard
              defaultTransactionId={uiConfig.props?.defaultTransactionId as string | undefined}
              onVerified={(result) => {
                if (result.valid && result.externalId) {
                  handleVerificationSuccess(result.externalId)
                }
              }}
            />
          </div>
        )
      }

      case "faq_buttons": {
        return (
          <div className="flex flex-wrap gap-2 mt-4">
            {chatSettings.faq.map((faq) => (
              <Button
                key={faq.id}
                variant="outline"
                size="sm"
                onClick={() => handleFAQClick(faq)}
                disabled={isLoading}
              >
                {faq.label}
              </Button>
            ))}
          </div>
        )
      }

      default:
        return null
    }
  }

  /**
   * Renders legacy component (for backward compatibility)
   */
  const renderLegacyComponent = (component: StepComponent, index: number) => {
    switch (component.type) {
      case "faq_buttons":
        return (
          <div key={`component-${index}`} className="flex flex-wrap gap-2 mt-4">
            {chatSettings.faq.map((faq) => (
              <Button
                key={faq.id}
                variant="outline"
                size="sm"
                onClick={() => handleFAQClick(faq)}
                disabled={isLoading}
              >
                {faq.label}
              </Button>
            ))}
          </div>
        )

      case "provider_buttons": {
        // Legacy: convert to new provider-selector
        const providers = getProviderOptions()
        return (
          <div key={`component-${index}`} className="mt-4">
            <ProviderSelector
              providers={providers}
              onProviderSelect={handleProviderSelect}
            />
          </div>
        )
      }

      case "verification_card":
        return (
          <div key={`component-${index}`} className="mt-4">
            <VerificationCard
              onVerified={(result) => {
                if (result.valid && result.externalId) {
                  handleVerificationSuccess(result.externalId)
                }
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Coffee Timer - Show if session exists */}
      {hasSession && verifiedAt && (
        <div className="absolute top-4 right-4 z-10">
          <CoffeeTimer
            verifiedAt={verifiedAt}
            durationMinutes={chatSettings.session.durationMinutes}
            onExpire={() => {
              setHasSession(false)
              setVerifiedAt(null)
            }}
          />
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  {getRandomMessage(chatSettings.messages.welcome)}
                </p>
              </CardContent>
            </Card>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user"
            const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)

            return (
              <div key={message.id || index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <Card className={`max-w-[80%] ${isUser ? "bg-primary text-primary-foreground" : ""}`}>
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
          })}

          {/* Render UI component (new) */}
          {ui && (
            <div className="space-y-4">
              {renderUIComponent(ui)}
            </div>
          )}

          {/* Render legacy components (backward compatibility) */}
          {!ui && components.length > 0 && (
            <div className="space-y-4">
              {components.map((component, index) => renderLegacyComponent(component, index))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-muted-foreground">{chatSettings.messages.ai_thinking}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              hasSession
                ? chatSettings.messages.input_placeholder_verified
                : chatSettings.messages.input_placeholder_unverified
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
