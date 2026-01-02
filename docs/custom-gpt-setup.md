# Setting Up Coffee Engine with Custom GPT

This guide walks through setting up a Custom GPT that uses Coffee Engine to gate premium features.

## Prerequisites

- A Coffee Engine instance deployed (e.g., on Vercel)
- Your `COFFEE_API_KEY` configured
- A Buy Me a Coffee account and webhook configured

## Step 1: Create Your Custom GPT

1. Go to [ChatGPT Custom GPT Builder](https://chat.openai.com/gpts/editor)
2. Click "Create a GPT"
3. Configure your GPT's name, description, and personality

## Step 2: Add the Coffee Engine Action

1. In the GPT editor, go to the "Actions" section
2. Click "Create new action"
3. Choose "Import from URL"
4. Enter your OpenAPI spec URL: `https://your-domain.com/api/openapi`

Alternatively, manually configure:

**Authentication**:
- Type: API Key
- Auth Type: Custom
- Custom Header Name: `X-COFFEE-API-KEY`
- API Key: Your Coffee Engine API key

**Schema**: Import from `/api/openapi` or paste the OpenAPI JSON

## Step 3: Configure Instructions

Add these instructions to your GPT's system prompt:

\`\`\`
You are an AI assistant that offers both free and premium features.

Premium features require users to support the project via Buy Me a Coffee.

When a user requests a premium feature:
1. Check if they've already verified in this conversation
2. If not, explain they need to support and provide their transaction ID
3. Use the verifyTransaction action to validate their transaction ID
4. If valid, mark them as premium for this session and proceed
5. If invalid, explain the issue and offer help

Premium features include:
- Deep code analysis
- Extended problem solving
- Custom implementations
- Personalized reports

Always be helpful and transparent about the premium model.

Buy Me a Coffee link: [Your BMC Link]
\`\`\`

## Step 4: Add Knowledge Base

Upload the `knowledge-base.md` file to your GPT's knowledge base for detailed integration patterns.

## Step 5: Test Your GPT

1. Start a conversation
2. Request a premium feature
3. The GPT should prompt for support
4. Simulate with a test transaction ID
5. Verify the premium feature executes after validation

## Example Conversation

\`\`\`
User: Can you analyze my entire codebase?

GPT: I'd love to help with that deep analysis! This is a premium feature 
     that requires supporting the project. 

     Please visit https://buymeacoffee.com/yourpage to buy me a coffee,
     then paste your transaction ID here to unlock premium features.

User: TXN_TEST_999

GPT: [Verifies transaction via Coffee Engine API]
     
     Thank you so much for your support! Your transaction is verified.
     Let me dive into that codebase analysis for you now...
     
     [Proceeds with premium analysis]
\`\`\`

## Troubleshooting

### "Transaction not found"
- User may have entered wrong ID
- Transaction might not have been received by webhook yet (wait 1-2 minutes)
- Check your KV storage is configured correctly

### "Unauthorized" errors
- Verify your API key is correct in the Action configuration
- Check that `COFFEE_API_KEY` environment variable is set

### Webhook not receiving events
- Verify your webhook URL in BMC dashboard: `https://your-domain.com/api/webhooks/bmc`
- Check `WEBHOOK_SECRET_BMC` is configured
- Use BMC's "Send test" feature to debug

## Next Steps

- Customize premium feature definitions
- Adjust token TTL in configuration
- Add more payment providers
- Implement MCP integration for local AI clients
