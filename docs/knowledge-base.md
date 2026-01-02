# Coffee Engine - AI Integration Knowledge Base

This document contains instructions for AI agents (Custom GPTs, Claude, etc.) on how to integrate with Coffee Engine to gate premium features behind verified transactions.

## Overview

Coffee Engine is a payment verification system that turns real transactions (from Buy Me a Coffee, etc.) into verifiable tokens. AI agents can use the verification API to ensure users have paid for premium features before executing high-effort operations.

## Integration Pattern

### 1. Identify Premium Features

First, define which features require payment verification:

- Deep code analysis
- Long-form content generation
- Complex problem solving
- Personalized reports
- Extended conversations
- Custom integrations

### 2. User Flow

When a user requests a premium feature:

1. **Check if already verified**: If the user has already provided a valid transaction ID in this session, proceed directly.

2. **Request support**: If not verified, explain the premium feature requirement:
   \`\`\`
   "This feature requires supporting the project on Buy Me a Coffee. 
   Please visit [Buy Me a Coffee Link] to support, then provide your 
   transaction ID from the receipt email."
   \`\`\`

3. **Collect transaction ID**: Ask the user to paste their transaction ID (e.g., `TXN_12345ABC`).

4. **Verify**: Call the Coffee Engine verification API.

5. **Proceed or deny**: 
   - If valid: Thank the user and execute the premium feature
   - If invalid: Explain the issue and offer to retry

### 3. API Usage

**Endpoint**: `POST /api/coffee/verify`

**Headers**:
\`\`\`
X-COFFEE-API-KEY: your_api_key
Content-Type: application/json
\`\`\`

**Request Body**:
\`\`\`json
{
  "transactionId": "TXN_12345ABC",
  "providerId": "bmc",
  "contextId": "optional_tracking_id"
}
\`\`\`

**Response** (success):
\`\`\`json
{
  "ok": true,
  "valid": true,
  "reason": "Transaction verified successfully",
  "providerId": "bmc",
  "externalId": "TXN_12345ABC",
  "amountMinor": 500,
  "currency": "USD",
  "occurredAt": "2025-01-01T12:00:00Z"
}
\`\`\`

**Response** (not found):
\`\`\`json
{
  "ok": true,
  "valid": false,
  "reason": "Transaction not found or expired"
}
\`\`\`

### 4. Conversation Management

**Store verification state**: Once verified, remember the user is "premium" for the current session.

**Example conversation flow**:

\`\`\`
User: Can you do a deep analysis of my codebase?

AI: I'd be happy to help with that! This deep analysis feature requires 
    supporting the project. Please visit [BMC Link] to buy me a coffee, 
    then paste your transaction ID here.

User: TXN_12345ABC

AI: [Calls verification API]
    Thank you for your support! Your transaction is verified. 
    Let me start the deep analysis now...
    [Proceeds with premium feature]
\`\`\`

### 5. Error Handling

- **Invalid transaction ID**: "That transaction ID couldn't be verified. Please check and try again."
- **Expired token**: "That transaction has expired. Please make a new support to continue."
- **API error**: "There was an issue verifying the transaction. Please try again later."

## Feature Tiers

### Free Tier
- Basic questions
- General guidance
- Quick answers
- Documentation lookup

### Premium Tier (Requires Verification)
- Deep code analysis
- Custom implementations
- Extended conversations
- Personalized reports
- Complex problem solving

## Best Practices

1. **Be transparent**: Always explain why payment is required
2. **Make it easy**: Provide direct links and clear instructions
3. **Remember state**: Don't ask repeatedly in the same session
4. **Show value**: Deliver exceptional premium features
5. **Handle errors gracefully**: Help users troubleshoot issues

## OpenAPI Specification

The full OpenAPI spec is available at: `/api/openapi`

This can be imported directly into Custom GPT Actions or other API clients.

## Security Notes

- Never expose the `COFFEE_API_KEY` to users
- Transaction IDs are single-use verification tokens
- Tokens expire after 30 days (configurable)
- All API calls must include the API key header
