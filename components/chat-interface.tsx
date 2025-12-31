"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VerificationCard } from "./verification-card"
import type { VerificationResult } from "@/lib/api-client"
import { Send, Lock } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  systemPrompt?: string
  onVerified?: (result: VerificationResult) => void
}

export function ChatInterface({ systemPrompt, onVerified }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setLoading(true)

    try {
      // In a real app, this would call an AI API
      // For now, we'll show a placeholder response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: isVerified
          ? `Thanks for your message: "${inputValue}". Since you're verified, I can provide premium features now!`
          : `Thanks for your message: "${inputValue}". To unlock premium features, please verify your transaction first.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleVerified = (result: VerificationResult) => {
    if (result.valid) {
      setIsVerified(true)
      onVerified?.(result)
      const verifiedMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Excellent! Your transaction has been verified. You now have access to all premium features.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, verifiedMessage])
    }
  }

  return (
    <div className="space-y-4">
      {!isVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Unlock Premium Features</h3>
              <p className="text-sm text-amber-800 mt-1">Verify your payment to access all premium content</p>
            </div>
          </div>
        </div>
      )}

      <Card className="h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Start a conversation to get began</p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground/70"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">Typing...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSendMessage()
                }
              }}
              disabled={loading}
            />
            <Button onClick={handleSendMessage} disabled={loading || !inputValue.trim()} size="icon">
              {loading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isVerified && <VerificationCard onVerified={handleVerified} />}
    </div>
  )
}
