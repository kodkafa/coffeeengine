"use client"

import { AlertTriangle, Send } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"

import { StepId, stepRegistry } from "@/config/steps"
import { useChatContext } from "@/contexts/chat-context"
import { StepEngine } from "@/engine/step-engine"
import { handleAutoAdvance } from "@/engine/utils/auto-advance"
import { getConversationId } from "@/lib/chat-utils"
import type { AIChatProps, StepComponent, StepMessage, StepUI } from "@/types/chat-ui"
import type { ChatContext, ChatMessage } from "@/types/engine"


/**
 * Converts ChatMessage (engine type) to StepMessage (UI type)
 */
function chatMessageToStepMessage(msg: ChatMessage): StepMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
  }
}

/**
 * Creates initial ChatContext
 */
function createInitialContext(): ChatContext {
  const defaultStepId = Object.keys(stepRegistry)[0] || "faq"
  return {
    currentStepId: defaultStepId,
    messageCount: 0,
    history: [],
  }
}

export function Chat({ systemPrompt, components, config, onSessionChange, onSendMessageReady }: AIChatProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [conversationId] = useState<string>(getConversationId)
  const { setOnTimerExpire } = useChatContext()
  
  // StepEngine instance - works everywhere (browser and server)
  const engine = useMemo(() => new StepEngine(stepRegistry), [])
  
  // In-memory context
  const [localContext, setLocalContext] = useState<ChatContext>(createInitialContext)
  
  // UI state
  const [messages, setMessages] = useState<StepMessage[]>([])
  const [legacyComponents, setLegacyComponents] = useState<StepComponent[]>([])
  const [ui, setUI] = useState<StepUI | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Mark as mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load initial conversation state from Redis
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true)
        
        // Load minimal state from Redis
        let savedState: { session?: ChatContext["session"]; verifiedAt?: string; currentStepId?: string } = {}
        try {
          const response = await fetch(`/api/chat/state?conversationId=${conversationId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.state) {
              savedState = data.state
            }
          }
        } catch (err) {
          console.warn("Failed to load state from Redis:", err)
          // Continue with default state
        }
        
        // Initialize context with saved state or defaults
        const savedStepId = savedState.currentStepId || Object.keys(stepRegistry)[0] || "faq"
        const initialContext: ChatContext = {
          currentStepId: savedStepId,
          messageCount: 0,
          history: [],
          ...(savedState.session && { session: savedState.session }),
        }
        
        // Set verifiedAt from Redis if available
        // Priority: savedState.verifiedAt > savedState.session.verifiedAt
        let initialVerifiedAt: Date | null = null
        let initialHasSession = false
        
        if (savedState.verifiedAt) {
          initialVerifiedAt = new Date(savedState.verifiedAt)
          initialHasSession = true
        } else if (savedState.session?.verifiedAt) {
          // If session exists, use session.verifiedAt
          initialVerifiedAt = new Date(savedState.session.verifiedAt)
          initialHasSession = true
        } else if (savedState.session) {
          // Session exists but no verifiedAt - still set hasSession
          initialHasSession = true
        }
        
        setVerifiedAt(initialVerifiedAt)
        setHasSession(initialHasSession)
        
        // Notify parent of initial session state
        if (onSessionChange) {
          onSessionChange(initialHasSession, initialVerifiedAt)
        }
        
        // Get initial UI for the saved step
        const dispatchResult = await engine.dispatch(initialContext, undefined)
        
        // CRITICAL: Always preserve the saved step ID from Redis
        // This ensures refresh doesn't reset to default step
        let finalResult = dispatchResult.output
        let finalContext: ChatContext = {
          ...dispatchResult.ctx,
          currentStepId: savedStepId, // Always use saved step ID from Redis
        }
        
        // If step wants to transition but has no UI, auto-advance
        // But still preserve savedStepId
        if (dispatchResult.output.nextStepId && !dispatchResult.output.messages?.length && !dispatchResult.output.components?.length && !dispatchResult.output.ui) {
          // Step wants to transition but has no UI - auto-advance
          const autoAdvanceResult = await handleAutoAdvance(engine, dispatchResult.ctx)
          finalResult = autoAdvanceResult.result
          // But keep the saved step ID, don't let auto-advance change it
          finalContext = {
            ...autoAdvanceResult.ctx,
            currentStepId: savedStepId, // Preserve saved step ID
          }
        }
        
        setLocalContext(finalContext)
        
        // Update UI from result
        if (finalResult.messages) {
          setMessages(
            finalResult.messages
              .map(chatMessageToStepMessage)
              .filter((msg: StepMessage) => msg.role !== "system")
          )
        }
        if (finalResult.components) {
          setLegacyComponents(finalResult.components)
        }
        if (finalResult.ui) {
          setUI(finalResult.ui)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialState()
  }, [engine, conversationId])

  // Register timer expire callback to transition to coffee_break step
  // Use refs to avoid dependency on values that change every render (prevents infinite loop)
  const localContextRef = useRef(localContext)
  const onSessionChangeRef = useRef(onSessionChange)
  const setOnTimerExpireRef = useRef(setOnTimerExpire)
  
  useEffect(() => {
    localContextRef.current = localContext
  }, [localContext])
  
  useEffect(() => {
    onSessionChangeRef.current = onSessionChange
  }, [onSessionChange])
  
  useEffect(() => {
    setOnTimerExpireRef.current = setOnTimerExpire
  }, [setOnTimerExpire])

  useEffect(() => {
    const handleTimerExpire = async () => {
      // Clear session from context
      if (onSessionChangeRef.current) {
        onSessionChangeRef.current(false, null)
      }
      
      // Get current context from ref
      const currentCtx = localContextRef.current
      
      // Transition to coffee_break step
      const updatedContext: ChatContext = {
        ...currentCtx,
        currentStepId: StepId.COFFEE_BREAK,
        session: undefined, // Clear session
      }
      
      // Dispatch to coffee_break step to get UI
      const dispatchResult = await engine.dispatch(updatedContext, undefined)
      
      // Handle auto-advance if needed
      let finalResult = dispatchResult.output
      let finalContext = dispatchResult.ctx
      
      if (dispatchResult.output.nextStepId && !dispatchResult.output.messages?.length && !dispatchResult.output.components?.length && !dispatchResult.output.ui) {
        const autoAdvanceResult = await handleAutoAdvance(engine, dispatchResult.ctx)
        finalContext = autoAdvanceResult.ctx
        finalResult = autoAdvanceResult.result
      }
      
      setLocalContext(finalContext)
      
      // Update UI
      if (finalResult.messages) {
        setMessages((prev) => [
          ...prev,
          ...finalResult.messages!
            .map(chatMessageToStepMessage)
            .filter((msg: StepMessage) => msg.role !== "system"),
        ])
      }
      
      if (finalResult.ui) {
        setUI(finalResult.ui)
      } else {
        setUI(null)
      }
    }
    
    setOnTimerExpireRef.current(() => handleTimerExpire)
    
    return () => {
      setOnTimerExpireRef.current(undefined)
    }
  }, [engine]) // Only depend on engine, which is stable

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      const viewport = scrollContainerRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      if (viewport) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            viewport.scrollTop = viewport.scrollHeight
          })
        })
      }
    }
    
    // Delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100)
    
    return () => clearTimeout(timeoutId)
  }, [messages, ui, legacyComponents, isLoading])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput("")
    await sendMessage(userInput)
  }

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Dispatch to StepEngine
      const dispatchResult = await engine.dispatch(localContext, message.trim())

      // Handle step transition with auto-advance if needed
      let finalResult = dispatchResult.output
      let finalContext = dispatchResult.ctx

      if (dispatchResult.output.nextStepId) {
        // Check if we need to auto-advance (step transitioned but no UI)
        const hasUI =
          dispatchResult.output.messages?.length ||
          dispatchResult.output.components?.length ||
          !!dispatchResult.output.ui

        if (!hasUI) {
          // Auto-advance to get UI from next step
          const autoAdvanceResult = await handleAutoAdvance(engine, dispatchResult.ctx)
          finalContext = autoAdvanceResult.ctx
          finalResult = autoAdvanceResult.result
        }
      }

      // Update local context
      setLocalContext(finalContext)

      // Add user message first
      const userMessage: StepMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message.trim(),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Update UI state - filter system messages
      if (finalResult.messages) {
        setMessages((prev) => [
          ...prev,
          ...finalResult.messages!
            .map(chatMessageToStepMessage)
            .filter((msg: StepMessage) => msg.role !== "system"),
        ])
      }

      if (finalResult.components) {
        setLegacyComponents(finalResult.components)
      } else {
        setLegacyComponents([])
      }

      if (finalResult.ui) {
        setUI(finalResult.ui)
      } else {
        setUI(null)
      }

      // Update session state from context
      const previousStepId = localContext.currentStepId
      const newStepId = finalContext.currentStepId
      const stepChanged = previousStepId !== newStepId
      const hadSession = hasSession
      
      if (finalContext.session) {
        setHasSession(true)
        const sessionVerifiedAt = finalContext.session.verifiedAt
        if (sessionVerifiedAt) {
          const verifiedAtDate = new Date(sessionVerifiedAt)
          setVerifiedAt(verifiedAtDate)
          
          // Notify parent of session change
          if (onSessionChange) {
            onSessionChange(true, verifiedAtDate)
          }
          
          // Save to Redis: session, verifiedAt, currentStepId
          // Save if session is new OR step changed (verify sonrası veya step transition)
          if (!hadSession || stepChanged) {
            try {
              await fetch("/api/chat/state", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  conversationId,
                  session: finalContext.session,
                  verifiedAt: sessionVerifiedAt,
                  currentStepId: newStepId,
                }),
              })
            } catch (err) {
              console.warn("Failed to save state to Redis:", err)
            }
          }
        }
      } else {
        setHasSession(false)
        setVerifiedAt(null)
        
        // Notify parent of session change
        if (onSessionChange) {
          onSessionChange(false, null)
        }
      }
      
      // Save currentStepId to Redis if step changed (but no session update needed)
      if (stepChanged && !finalContext.session) {
        try {
          await fetch("/api/chat/state", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversationId,
              currentStepId: newStepId,
            }),
          })
        } catch (err) {
          console.warn("Failed to save step to Redis:", err)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, engine, localContext, conversationId, onSessionChange])

  // Expose sendMessage to parent via callback
  useEffect(() => {
    if (onSendMessageReady) {
      onSendMessageReady(sendMessage)
    }
  }, [onSendMessageReady, sendMessage])

  /**
   * Renders a UI component based on the new ui field
   */
  const renderUIComponent = (uiConfig: StepUI) => {
    if (!components) return null
    if (!config) return null

    // Check if we have a component in the registry
    const Component = components[uiConfig.component]

    if (Component) {
      // Merge step-provided props with generic handlers
      // Step-specific handlers come from uiConfig.props (e.g., onHandle, onProviderSelect)
      // Generic handler (onSendMessage) is always provided
      const injectedProps = {
        ...uiConfig.props,
        config,
        onSendMessage: sendMessage,
      }

      return (
        <div className="mt-4">
          <Component {...injectedProps} />
        </div>
      )
    }

    // No fallback. If it's not in the registry, it doesn't render.
    console.warn(`Component "${uiConfig.component}" not found in registry.`)
    return null
  }

  /**
   * Renders legacy component (for backward compatibility)
   */
  const renderLegacyComponent = (component: StepComponent, index: number) => {
    // Map legacy types to new UI structure
    const uiConfig: StepUI = {
      component: component.type as unknown as string,
      props: component.props
    }
    // Reuse renderUIComponent
    const rendered = renderUIComponent(uiConfig)
    if (rendered) {
      return <div key={`component-${index}`}>{rendered}</div>
    }
    return null
  }

  return (
    <div className="flex flex-col h-full">


      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0">
        {isMounted ? (
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-4">
              {messages.length === 0 && !isLoading && config?.messages && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">{config.messages.welcome[0] || "Welcome!"}</p>
            </div>
          )}

          {messages
            .filter((msg) => msg.role !== "system")
            .map((message, index) => {
              const isUser = message.role === "user"
              const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)

            return (
              <div key={message.id || index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          code: ({ children, className }) => {
                            const isInline = !className
                            return isInline ? (
                              <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                            ) : (
                              <code className={className}>{children}</code>
                            )
                          },
                          pre: ({ children }) => (
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>
                          ),
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      isUser ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    }`}
                  >
                    {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
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
          {!ui && legacyComponents.length > 0 && (
            <div className="space-y-4">
              {legacyComponents.map((component, index) => renderLegacyComponent(component, index))}
            </div>
          )}

          {/* Conversation Starters - Show after verification (ai_chat step) */}
          {hasSession && localContext.currentStepId === "ai_chat" && config?.starters && config.starters.length > 0 && !isLoading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {config.starters.map((starter, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(starter)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isLoading && config?.messages && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">{config.messages.ai_thinking}</span>
              </div>
            </div>
          )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full w-full overflow-auto">
            <div className="p-4 space-y-4">
              {messages.length === 0 && !isLoading && config?.messages && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">{config.messages.welcome[0] || "Welcome!"}</p>
                </div>
              )}

              {messages
                .filter((msg) => msg.role !== "system")
                .map((message, index) => {
                  const isUser = message.role === "user"
                  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)

                  return (
                    <div key={message.id || index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="ml-2">{children}</li>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              code: ({ children, className }) => {
                                const isInline = !className
                                return isInline ? (
                                  <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                                ) : (
                                  <code className={className}>{children}</code>
                                )
                              },
                              pre: ({ children }) => (
                                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>
                              ),
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          isUser ? "text-primary-foreground/70" : "text-muted-foreground/70"
                        }`}
                      >
                        {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
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
              {!ui && legacyComponents.length > 0 && (
                <div className="space-y-4">
                  {legacyComponents.map((component, index) => renderLegacyComponent(component, index))}
                </div>
              )}

              {/* Conversation Starters - Show after verification (ai_chat step) */}
              {hasSession && localContext.currentStepId === "ai_chat" && config?.starters && config.starters.length > 0 && !isLoading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {config.starters.map((starter, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(starter)}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        {starter}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && config?.messages && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{config.messages.ai_thinking}</span>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              config?.messages
                ? (hasSession
                  ? config.messages.input_placeholder_verified
                  : config.messages.input_placeholder_unverified)
                : "Type a message..."
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

