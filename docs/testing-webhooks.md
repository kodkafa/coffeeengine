# Testing Webhooks

## Development Simulator

Use the dev simulator to test webhook flows without requiring real payments.

### Simulate BMC Webhook

\`\`\`bash
curl -X POST http://localhost:3000/api/dev/simulate-webhook \
  -H "Content-Type: application/json" \
  -d @scripts/test-bmc-webhook.json
\`\`\`

### Expected Response

\`\`\`json
{
  "ok": true,
  "simulated": true,
  "event": {
    "providerId": "bmc",
    "eventType": "donation",
    "externalId": "TXN_TEST_999",
    "amountMinor": 500,
    "currency": "USD",
    "payerEmail": "supporter@example.com",
    "occurredAt": "2025-01-01T12:00:00Z",
    "rawPayload": { ... }
  }
}
\`\`\`

### Verify Token Storage

After simulating a webhook, verify the token was stored in KV:

\`\`\`bash
curl -X POST http://localhost:3000/api/coffee/verify \
  -H "X-COFFEE-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TXN_TEST_999"}'
\`\`\`

## Production Testing

Use Buy Me a Coffee's "Send Test" feature from their webhook dashboard to send real test events to your production endpoint:

\`\`\`
https://your-domain.com/api/webhooks/bmc
\`\`\`

Make sure your `WEBHOOK_SECRET_BMC` is configured correctly.
