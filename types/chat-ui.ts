import { StepUI, UIComponent } from "@/types/engine"
export type { StepUI }

export interface StepMessage {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: string | Date
}

export interface StepComponent {
    type: string
    props?: Record<string, unknown>
}

export interface StepEngineResponse {
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

export interface AIChatProps {
    systemPrompt?: string
    /**
     * Registry of components to be rendered by the chat interface.
     * Maps component names (from step configuration) to React components.
     * 
     * Components will receive:
     * - All props defined in step configuration
     * - onSendMessage: (message: string) => Promise<void>
     * - onProviderSelect: (providerId: string) => Promise<void>
     * - onVerified: (result: any) => void
     */
    components?: Record<string, React.ComponentType<any>>
    /**
     * Configuration for the chat interface
     */
    config?: AIChatConfig
    /**
     * Callback when session state changes (for timer display)
     */
    onSessionChange?: (hasSession: boolean, verifiedAt: Date | null) => void
    /**
     * Callback to expose sendMessage function to parent components (e.g., timer)
     */
    onSendMessageReady?: (sendMessage: (message: string) => Promise<void>) => void
}

export interface StepComponentProps {
    config?: AIChatConfig
    onSendMessage: (message: string) => Promise<void>
    onProviderSelect: (providerId: string) => Promise<void>
    onVerified: (result: any) => void
    [key: string]: any // allow other props from step definition, but base is typed
}

export interface ProviderOption {
    id: string
    name: string
    url: string
    icon?: string
}

export interface AIChatConfig {
    messages: {
        welcome: string[]
        ai_thinking: string
        input_placeholder_verified: string
        input_placeholder_unverified: string
    }
    session: {
        durationMinutes: number
    }
    faq: Array<{
        id: string
        label: string
        question: string
        answer: string
    }>
    providers?: ProviderOption[]
    starters?: string[]
}
