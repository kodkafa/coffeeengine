# Customizing Messages

This guide explains how to customize and add new messages in Coffee Engine. Messages are stored in JSON configuration files and can be templated with variables.

## Message Configuration Files

### Main Chat Messages (`config/chat-messages.json`)

This file contains all chat-related messages used in the step engine:

```json
{
  "agent": {
    "name": "Coffee Engine Mentor",
    "role": "Setup Assistant",
    "systemPrompt": "You are the setup assistant..."
  },
  "session": {
    "durationMinutes": 45
  },
  "messages": {
    "welcome": [...],
    "paywall_trigger": [...],
    "coffee_break": [...],
    // ... more message types
  },
  "faq": [...],
  "starters": [...]
}
```

### Provider Messages (`providers/{provider}/config.ts`)

Each provider can define its own messages:

```typescript
export const bmcMessages = {
  thanks: [
    "☕ Thanks for {coffeeCount} coffee(s), {supporterName}!",
    // ... more templates
  ],
}
```

## Message Types

### Chat Messages (`config/chat-messages.json`)

#### Single Messages

Messages that return a single string:

```json
{
  "messages": {
    "ai_thinking": "AI is thinking...",
    "chat_error": "Chat Error",
    "input_placeholder_verified": "Ask your AI anything...",
    "input_placeholder_unverified": "Type your message..."
  }
}
```

**Usage in code:**

```typescript
import chatSettings from "@/config/chat-messages.json"

const message = chatSettings.messages.ai_thinking
```

#### Array Messages (Random Selection)

Messages that return a random string from an array:

```json
{
  "messages": {
    "welcome": [
      "👋 Hi! I can help you setup your monetization.",
      "👋 Ready to turn your code into cash?"
    ],
    "coffee_break": [
      "☕ I need another coffee!",
      "🔋 My energy is depleted, I need a coffee.",
      "🧠 My brain stopped, coffee is essential!"
    ]
  }
}
```

**Usage in code:**

```typescript
import { getRandomMessage } from "@/lib/utils"
import chatSettings from "@/config/chat-messages.json"

const message = getRandomMessage(chatSettings.messages.welcome)
```

#### Templated Messages

Messages with template variables:

```json
{
  "messages": {
    "provider_confirm": "Great! I see you've selected {providerName}. Please complete your support and then paste your Transaction ID below."
  }
}
```

**Usage in code:**

```typescript
import { template } from "@/lib/template"
import chatSettings from "@/config/chat-messages.json"

const message = template(chatSettings.messages.provider_confirm, {
  providerName: "Buy Me a Coffee",
})
```

### Provider Messages (`providers/{provider}/config.ts`)

Provider-specific messages with template variables:

```typescript
export const bmcMessages = {
  thanks: [
    "☕ Thanks for {coffeeCount} coffee(s), {supporterName}! You're all set.",
    "🎉 {coffeeCount} coffee(s) received from {supporterName}! Let's build something amazing.",
    "✨ Thank you {supporterName} for {coffeeCount} coffee(s)! Your support means everything.",
  ],
}
```

**Usage in provider:**

```typescript
import { template } from "@/lib/template"
import { getRandomMessage } from "@/lib/utils"
import { bmcMessages } from "./config"

const messageTemplate = getRandomMessage(bmcMessages.thanks)
const thanksMessage = template(messageTemplate, {
  coffeeCount: "5",
  supporterName: "John Doe",
  amount: "25.00",
  currency: "USD",
})
```

## Template Variables

### Available Variables

Template variables are defined using `{variableName}` syntax:

- `{providerName}` - Provider name (e.g., "Buy Me a Coffee")
- `{coffeeCount}` - Number of coffees/payment units
- `{supporterName}` - Supporter's name
- `{amount}` - Payment amount
- `{currency}` - Currency code (e.g., "USD")
- `{payerEmail}` - Payer's email address
- `{transactionId}` - Transaction ID

### Using Templates

```typescript
import { template } from "@/lib/template"

const message = template(
  "Thanks for {coffeeCount} coffee(s), {supporterName}!",
  {
    coffeeCount: "5",
    supporterName: "John Doe",
  }
)
// Result: "Thanks for 5 coffee(s), John Doe!"
```

## Adding New Messages

### 1. Add to Chat Messages

Edit `config/chat-messages.json`:

```json
{
  "messages": {
    "welcome": [...],
    "your_new_message": [
      "Message option 1",
      "Message option 2",
      "Message option 3"
    ],
    "your_templated_message": "Hello {name}, welcome to {service}!"
  }
}
```

### 2. Use in Steps

```typescript
// steps/your-step.ts

import chatSettings from "@/config/chat-messages.json"
import { getRandomMessage, template } from "@/lib/utils"

async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  // Use random message
  const message = getRandomMessage(chatSettings.messages.your_new_message)
  
  // Or use templated message
  const templated = template(chatSettings.messages.your_templated_message, {
    name: "John",
    service: "Coffee Engine",
  })
  
  return {
    messages: [
      createChatMessage("assistant", message),
    ],
  }
}
```

### 3. Add Provider Messages

Edit `providers/{provider}/config.ts`:

```typescript
export const yourProviderMessages = {
  thanks: [
    "✅ Thank you for your {amount} {currency} payment!",
    "🎉 Payment of {amount} {currency} received!",
  ],
  error: [
    "❌ Payment verification failed.",
    "⚠️ Unable to verify payment.",
  ],
}
```

Use in provider's `controlEvent` method:

```typescript
async controlEvent(event: NormalizedEvent): Promise<EventControlResult> {
  const messageTemplate = getRandomMessage(yourProviderMessages.thanks)
  const thanksMessage = template(messageTemplate, {
    amount: (event.amountMinor / 100).toFixed(2),
    currency: event.currency,
  })
  
  return {
    verifiedAt: new Date().toISOString(),
    TTL: 3600,
    thanksMessage,
  }
}
```

## Modifying Existing Messages

### Change Welcome Message

Edit `config/chat-messages.json`:

```json
{
  "messages": {
    "welcome": [
      "Your custom welcome message 1",
      "Your custom welcome message 2"
    ]
  }
}
```

### Change FAQ Answers

Edit `config/chat-messages.json`:

```json
{
  "faq": [
    {
      "id": "q1",
      "label": "🤔 What is this?",
      "question": "What is Coffee Engine?",
      "answer": "Your custom answer here..."
    }
  ]
}
```

### Change Provider Thanks Messages

Edit `providers/{provider}/config.ts`:

```typescript
export const bmcMessages = {
  thanks: [
    "Your custom thanks message 1",
    "Your custom thanks message 2",
  ],
}
```

## Message Best Practices

### 1. Use Arrays for Variety

Instead of a single message, use arrays to provide variety:

```json
{
  "welcome": [
    "Option 1",
    "Option 2",
    "Option 3"
  ]
}
```

### 2. Use Emojis Sparingly

Emojis can make messages more friendly, but don't overuse them:

```json
{
  "coffee_break": [
    "☕ I need another coffee!",
    "🔋 My energy is depleted."
  ]
}
```

### 3. Keep Messages Concise

Messages should be clear and concise:

```json
{
  "tx_success": [
    "✅ Verified! You're all set.",
    "🎉 Payment received! Let's build."
  ]
}
```

### 4. Use Templates for Dynamic Content

Use templates for content that changes:

```json
{
  "provider_confirm": "Great! I see you've selected {providerName}. Please complete your support."
}
```

### 5. Provide Fallbacks

Always provide fallback messages for error cases:

```json
{
  "tx_fail": [
    "❌ Invalid ID. Try again.",
    "⚠️ Verification failed."
  ]
}
```

## Internationalization (i18n)

While Coffee Engine doesn't have built-in i18n support, you can implement it by:

1. Creating separate message files per language:

```
config/
├── chat-messages.json      # Default (English)
├── chat-messages.tr.json   # Turkish
└── chat-messages.es.json   # Spanish
```

2. Loading messages based on user preference:

```typescript
const locale = getUserLocale() // Get from context, cookie, etc.
const messages = locale === "tr" 
  ? require("@/config/chat-messages.tr.json")
  : require("@/config/chat-messages.json")
```

## Testing Messages

### 1. Test Random Selection

Verify random messages are selected correctly:

```typescript
const messages = ["Message 1", "Message 2", "Message 3"]
for (let i = 0; i < 10; i++) {
  console.log(getRandomMessage(messages))
}
```

### 2. Test Templates

Verify templates work correctly:

```typescript
const result = template("Hello {name}!", { name: "John" })
console.assert(result === "Hello John!")
```

### 3. Test in UI

Test messages in the actual UI to ensure they display correctly.

## Common Message Locations

### Chat Messages
- `config/chat-messages.json` - All chat-related messages

### Provider Messages
- `providers/bmc/config.ts` - Buy Me a Coffee messages
- `providers/{provider}/config.ts` - Other provider messages

### System Messages
- System messages (like `"provider:bmc"`) are hardcoded in steps
- They're not user-visible, so they don't need configuration

## Example: Complete Message Customization

```json
// config/chat-messages.json
{
  "messages": {
    "welcome": [
      "👋 Welcome! How can I help you today?",
      "👋 Hi there! Ready to get started?",
      "👋 Hello! What would you like to know?"
    ],
    "custom_message": "This is a custom message with {variable} support."
  }
}
```

```typescript
// In your step
import chatSettings from "@/config/chat-messages.json"
import { getRandomMessage, template } from "@/lib/utils"

const welcome = getRandomMessage(chatSettings.messages.welcome)
const custom = template(chatSettings.messages.custom_message, {
  variable: "template",
})
```

## Next Steps

After customizing messages:
1. Test messages in the UI
2. Verify templates work correctly
3. Check random selection provides variety
4. Update provider messages if needed
5. Test error messages

For more details, see the [Implementation Guide](./implementation-guide.md).

