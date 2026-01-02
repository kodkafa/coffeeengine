export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}


export type UIComponentType = string

export interface UIComponent {
  type: UIComponentType
  props?: Record<string, unknown>
}

export interface StepUI {
  component: string
  props?: Record<string, unknown>
}

export interface Provider {
  id: string
  name: string
  url?: string
}

export interface ChatContext {
  currentStepId: string
  messageCount: number
  history: ChatMessage[]
  provider?: Provider
  session?: {
    id: string
    expiresAt: number
    verifiedAt?: string
    payerEmail?: string
    transactionId?: string
    providerId?: string
    amountMinor?: number
    currency?: string
  }
  errorContext?: {
    message?: string
    step?: string
    details?: string
  }
}

export interface StepResult {
  messages?: ChatMessage[]
  components?: UIComponent[] // Legacy - prefer using ui field
  ui?: StepUI // New: Generic UI component specification
  nextStepId?: string
  ctxPatch?: Partial<ChatContext>
}

import type { ComponentType } from "react"

export interface Step {
  id: string
  /**
   * Components used by this step.
   * Maps component ID (returned in ui.component) to the React Component.
   */
  components?: Record<string, ComponentType<any>>
  run: (ctx: ChatContext, input?: string) => StepResult | Promise<StepResult>
}

