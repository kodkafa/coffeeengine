export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

/**
 * UI Component types that can be rendered by the chat interface
 */
export type UIComponentType =
  | "faq_buttons"
  | "provider_buttons" // Legacy - use provider-selector instead
  | "provider-selector"
  | "support-card"
  | "verification_card"
  | "verification-status"
  | "timer"
  | string

export interface UIComponent {
  type: UIComponentType
  props?: Record<string, unknown>
}

/**
 * UI configuration from step engine
 * Steps can return this to specify which component to render with what props
 */
export interface StepUI {
  component: "provider-selector" | "support-card" | "verification-status" | "faq_buttons" | "verification_card"
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

export interface Step {
  id: string
  run: (ctx: ChatContext, input?: string) => StepResult | Promise<StepResult>
}

