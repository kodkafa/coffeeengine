
/**
 * Generates a unique conversation ID
 */
export function generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gets or creates a conversation ID from localStorage
 */
export function getConversationId(): string {
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
