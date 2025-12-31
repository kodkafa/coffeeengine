// OpenAPI specification endpoint - dynamically generated

import { NextResponse } from "next/server"
import { config } from "@/config"

export async function GET() {
  const baseUrl = config.isDevelopment
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://coffee-engine.vercel.app"

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Coffee Engine API",
      version: "1.0.0",
      description:
        "A modular, provider-agnostic payment verification system for gating premium features with real transactions.",
      contact: {
        name: "Coffee Engine Support",
        url: `${baseUrl}`,
      },
    },
    servers: [
      {
        url: baseUrl,
        description: config.isDevelopment ? "Development server" : "Production server",
      },
    ],
    paths: {
      "/api/coffee/verify": {
        post: {
          summary: "Verify a transaction",
          description:
            "Verify a transaction ID from a payment provider (e.g., Buy Me a Coffee) to gate premium features.",
          operationId: "verifyTransaction",
          security: [
            {
              coffeeApiKey: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["transactionId"],
                  properties: {
                    transactionId: {
                      type: "string",
                      description: "The transaction ID to verify (e.g., from Buy Me a Coffee receipt)",
                      example: "TXN_12345ABC",
                    },
                    providerId: {
                      type: "string",
                      description: "The payment provider ID (defaults to 'bmc' for Buy Me a Coffee)",
                      default: "bmc",
                      example: "bmc",
                    },
                    contextId: {
                      type: "string",
                      description: "Optional context identifier for your application's tracking",
                      example: "user_123_request_456",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Verification result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: {
                        type: "boolean",
                        example: true,
                      },
                      valid: {
                        type: "boolean",
                        description: "Whether the transaction is valid",
                        example: true,
                      },
                      reason: {
                        type: "string",
                        description: "Human-readable reason for the result",
                        example: "Transaction verified successfully",
                      },
                      providerId: {
                        type: "string",
                        description: "The provider ID that processed this transaction",
                        example: "bmc",
                      },
                      externalId: {
                        type: "string",
                        description: "The transaction ID from the provider",
                        example: "TXN_12345ABC",
                      },
                      amountMinor: {
                        type: "integer",
                        description: "The amount in minor units (e.g., cents)",
                        example: 500,
                      },
                      currency: {
                        type: "string",
                        description: "ISO currency code",
                        example: "USD",
                      },
                      occurredAt: {
                        type: "string",
                        format: "date-time",
                        description: "When the transaction occurred",
                        example: "2025-01-01T12:00:00Z",
                      },
                      payerEmail: {
                        type: "string",
                        format: "email",
                        description: "The payer's email (if available)",
                        example: "supporter@example.com",
                      },
                      contextId: {
                        type: "string",
                        description: "The contextId from the request, if provided",
                        example: "user_123_request_456",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Bad request - missing or invalid parameters",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        example: "Bad Request",
                      },
                      message: {
                        type: "string",
                        example: "transactionId is required",
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized - invalid or missing API key",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        example: "Unauthorized",
                      },
                      message: {
                        type: "string",
                        example: "Invalid or missing API key",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        example: "Internal Server Error",
                      },
                      message: {
                        type: "string",
                        example: "Verification failed",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/coffee/health": {
        get: {
          summary: "Health check",
          description: "Check if the Coffee Engine API is running",
          operationId: "healthCheck",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: {
                        type: "boolean",
                        example: true,
                      },
                      service: {
                        type: "string",
                        example: "Coffee Engine",
                      },
                      version: {
                        type: "string",
                        example: "1.0.0",
                      },
                      environment: {
                        type: "string",
                        example: "production",
                      },
                      timestamp: {
                        type: "string",
                        format: "date-time",
                        example: "2025-01-01T12:00:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        coffeeApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-COFFEE-API-KEY",
          description: "API key for authenticating Coffee Engine verification requests",
        },
      },
    },
  }

  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}
