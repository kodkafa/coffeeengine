"use client"

import { Chat } from "@/components/chat"
import { CoffeeTimer } from "@/components/coffee-timer"
import type { ProviderOption } from "@/components/steps/provider-selector"
import chatSettings from "@/config/chat-messages.json"
import { getAllProviderMetadata } from "@/config/providers"
import { stepRegistry } from "@/config/steps"
import { ChatProvider, useChatContext } from "@/contexts/chat-context"
import type { AIChatConfig, StepComponentProps } from "@/types/chat-ui"
import type React from "react"
import { useRef } from "react"

function ChatPageContent() {
  const { verifiedAt, setSession } = useChatContext()
  const sendMessageRef = useRef<((message: string) => Promise<void>) | undefined>(undefined)

  // Map providers to configuration format
  const parsedProviders: ProviderOption[] = getAllProviderMetadata().map((p) => ({
    id: p.providerId,
    name: p.name,
    url: p.url || "#",
    icon: p.icon,
  }))

  const chatConfig: AIChatConfig = {
    messages: chatSettings.messages,
    session: chatSettings.session,
    faq: chatSettings.faq,
    providers: parsedProviders,
    starters: chatSettings.starters,
  }

  // Build component registry dynamically from registered steps
  // This satisfies the requirement that components are defined "in the step"
  // and we don't maintain a separate registry file.
  const componentRegistry = Object.values(stepRegistry).reduce((acc, step) => {
    if (step.components) {
      return { ...acc, ...step.components }
    }
    return acc
  }, {} as Record<string, React.ComponentType<StepComponentProps>>)

  const handleSessionChange = (hasSession: boolean, verifiedAt: Date | null) => {
    setSession(hasSession, verifiedAt)
  }

  const handleSendMessageReady = (sendMessage: (message: string) => Promise<void>) => {
    sendMessageRef.current = sendMessage
  }

  return (
    <div className="w-full h-full relative">
      <div className="p-6 w-full h-full">
        {/* Timer - always visible, gray if not verified */}
        <CoffeeTimer
          verifiedAt={verifiedAt}
          durationMinutes={chatConfig.session?.durationMinutes || 60}
          onExpire={() => {
            setSession(false, null)
          }}
          providers={parsedProviders}
          onSendMessage={sendMessageRef.current}
        />

        <Chat
          systemPrompt={chatSettings.agent.systemPrompt}
          config={chatConfig}
          components={componentRegistry}
          onSessionChange={handleSessionChange}
          onSendMessageReady={handleSendMessageReady}
        />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  )
}
