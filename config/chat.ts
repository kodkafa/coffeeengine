/**
 * Chat Configuration Constants
 * 
 * Centralized constants for the Step Engine and chat functionality.
 */

/**
 * Maximum depth for auto-advance logic when steps transition.
 * Prevents infinite loops if steps keep transitioning without user input.
 */
export const AUTO_ADVANCE_MAX_DEPTH = 5

/**
 * Rate limiting constants for chat API.
 * These can be overridden via environment variables if needed.
 */
export const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "30",
  10
)
export const RATE_LIMIT_WINDOW_SECONDS = Number.parseInt(
  process.env.RATE_LIMIT_WINDOW_SECONDS || "60",
  10
)

/**
 * AI API call timeout in milliseconds.
 * Used when calling external AI providers.
 */
export const AI_CALL_TIMEOUT_MS = Number.parseInt(
  process.env.AI_CALL_TIMEOUT_MS || "30000",
  10
)

/**
 * UI delay in milliseconds.
 * Used for artificial delays in UI interactions (if needed).
 */
export const UI_DELAY_MS = Number.parseInt(
  process.env.UI_DELAY_MS || "1000",
  10
)

/**
 * Mock AI call delay in milliseconds.
 * Used for simulating AI API calls during development.
 */
export const MOCK_AI_DELAY_MS = 1500


