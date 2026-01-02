export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export interface UIComponent {
  type: "faq_buttons" | "provider_buttons" | "verification_card" | "timer" | string
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
}

export interface StepResult {
  messages?: ChatMessage[]
  components?: UIComponent[]
  nextStepId?: string
  ctxPatch?: Partial<ChatContext>
}

export interface Step {
  id: string
  run: (ctx: ChatContext, input?: string) => StepResult | Promise<StepResult>
}

