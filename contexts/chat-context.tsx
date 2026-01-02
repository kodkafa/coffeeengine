"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ChatContextType {
  hasSession: boolean
  verifiedAt: Date | null
  setSession: (hasSession: boolean, verifiedAt: Date | null) => void
  onTimerExpire?: () => void
  setOnTimerExpire: (callback: (() => void) | undefined) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [hasSession, setHasSession] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null)
  const [onTimerExpire, setOnTimerExpire] = useState<(() => void) | undefined>(undefined)

  const setSession = (hasSession: boolean, verifiedAt: Date | null) => {
    setHasSession(hasSession)
    setVerifiedAt(verifiedAt)
  }

  return (
    <ChatContext.Provider value={{ hasSession, verifiedAt, setSession, onTimerExpire, setOnTimerExpire }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}

