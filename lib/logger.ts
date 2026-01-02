/**
 * Simple Logging Wrapper
 * 
 * Provides a centralized logger instance with:
 * - Sensitive data sanitization
 * - Structured logging with context
 */

/**
 * Sanitizes sensitive data from log objects
 */
function sanitizeData(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }

  const sanitized: Record<string, unknown> = {}
  const sensitiveKeys = [
    "apiKey",
    "api_key",
    "token",
    "secret",
    "password",
    "authorization",
    "x-coffee-api-key",
    "transactionId",
    "transaction_id",
    "txn",
  ]

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Formats log message with context
 */
function formatMessage(message: string, context?: unknown): string {
  if (!context) {
    return message
  }

  const sanitizedContext = sanitizeData(context)
  const contextStr = JSON.stringify(sanitizedContext, null, 2)
  return `${message}\n${contextStr}`
}

/**
 * Simple logger implementation
 */
export const logger = {
  trace: (context: unknown, message: string) => {
    if (process.env.LOG_LEVEL === "trace" || process.env.NODE_ENV === "development") {
      console.log(`[TRACE] ${formatMessage(message, context)}`)
    }
  },
  debug: (context: unknown, message: string) => {
    if (process.env.LOG_LEVEL === "debug" || process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${formatMessage(message, context)}`)
    }
  },
  info: (context: unknown, message: string) => {
    console.info(`[INFO] ${formatMessage(message, context)}`)
  },
  warn: (context: unknown, message: string) => {
    console.warn(`[WARN] ${formatMessage(message, context)}`)
  },
  error: (context: unknown, message: string) => {
    console.error(`[ERROR] ${formatMessage(message, context)}`)
  },
  fatal: (context: unknown, message: string) => {
    console.error(`[FATAL] ${formatMessage(message, context)}`)
  },
}

