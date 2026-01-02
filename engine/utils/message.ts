/**
 * Message Utility
 * 
 * Provides utilities for creating ChatMessage objects.
 */

import type { ChatMessage } from "../types"

/**
 * Creates a ChatMessage from role and content.
 * 
 * @param role - The message role (user, assistant, or system)
 * @param content - The message content
 * @returns A ChatMessage object with generated ID and current timestamp
 */
export function createChatMessage(role: "user" | "assistant" | "system", content: string): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date(),
  }
}

