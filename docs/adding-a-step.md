# Adding a New Step

This guide explains how to add a new step to the Coffee Engine step-based conversation flow. Steps are self-contained modules that handle specific parts of the user journey.

## Overview

Steps are the building blocks of the conversation flow. Each step:
- Has a unique ID
- Contains its own business logic
- Can render UI components
- Can transition to other steps
- Can update the chat context
- Can communicate via system messages

## Step Architecture

### Step Interface

```typescript
interface Step {
  id: string
  components?: Record<string, ComponentType<any>>  // UI components used by this step
  run: (ctx: ChatContext, input?: string) => StepResult | Promise<StepResult>
}
```

### StepResult Interface

```typescript
interface StepResult {
  messages?: ChatMessage[]        // Messages to display
  ui?: StepUI                     // UI component to render
  nextStepId?: string             // Step to transition to
  ctxPatch?: Partial<ChatContext> // Context updates
}
```

## Step-by-Step Guide

### 1. Create Step File

Create a new file in the `steps/` directory:

```typescript
// steps/your-step.ts

import { createChatMessage } from "@/engine/utils/message"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const yourStep: Step = {
  id: "your_step",
  
  // Optional: Define UI components used by this step
  components: {
    "your_component": YourComponent, // Import your component
  },

  async run(ctx: ChatContext, input?: string): Promise<StepResult> {
    // Step logic here
  },
}
```

### 2. Add Step ID to Enum

Add your step ID to `config/steps.ts`:

```typescript
// config/steps.ts

export enum StepId {
  FAQ = "faq",
  FIRST_COFFEE = "first_coffee",
  COFFEE_BREAK = "coffee_break",
  SUPPORT = "support",
  VERIFY = "verify",
  AI_CHAT = "ai_chat",
  PROVIDER_MESSAGE = "provider_message",
  YOUR_STEP = "your_step", // Add here
}
```

### 3. Register Step

Add your step to the step registry in `config/steps.ts`:

```typescript
// config/steps.ts

import { yourStep } from "@/steps/your-step" // Add import

export const stepRegistry: Record<StepId, Step> = {
  [StepId.FAQ]: faqStep,
  [StepId.FIRST_COFFEE]: firstCoffeeStep,
  [StepId.COFFEE_BREAK]: coffeeBreakStep,
  [StepId.PROVIDER_MESSAGE]: providerMessageStep,
  [StepId.VERIFY]: verifyStep,
  [StepId.AI_CHAT]: aiChatStep,
  [StepId.SUPPORT]: supportStep,
  [StepId.YOUR_STEP]: yourStep, // Add here
}
```

### 4. Implement Step Logic

Here's a complete example step:

```typescript
// steps/your-step.ts

import { YourComponent } from "@/components/steps/your-component"
import { createChatMessage } from "@/engine/utils/message"
import { getRandomMessage } from "@/lib/utils"
import type { ChatContext, Step, StepResult } from "@/types/engine"

export const YourComponent = YourComponent

export const yourStep: Step = {
  id: "your_step",
  components: {
    "your_component": YourComponent,
  },

  async run(ctx: ChatContext, input?: string): Promise<StepResult> {
    // Initial load: show UI and message
    if (!input) {
      return {
        messages: [
          createChatMessage("assistant", "Welcome to this step!"),
        ],
        ui: {
          component: "your_component",
          props: {
            // Props passed to your component
            title: "Step Title",
            description: "Step description",
          },
        },
      }
    }

    // Handle user input
    if (input) {
      // Process input
      const processed = processInput(input)

      // Update context
      const ctxPatch: Partial<ChatContext> = {
        // Update context fields
        provider: {
          id: "bmc",
          name: "Buy Me a Coffee",
        },
      }

      // Transition to next step
      return {
        messages: [
          createChatMessage("assistant", "Processing complete!"),
        ],
        ctxPatch,
        nextStepId: "verify", // Transition to verify step
      }
    }

    // Fallback
    return {
      messages: [
        createChatMessage("assistant", "Please provide input."),
      ],
    }
  },
}
```

## Common Patterns

### Pattern 1: Initial Load with UI

Show a UI component when the step first loads:

```typescript
async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  if (!input) {
    return {
      messages: [
        createChatMessage("assistant", "Please fill out the form below."),
      ],
      ui: {
        component: "form_component",
        props: {
          fields: ["name", "email"],
        },
      },
    }
  }
  // ... handle input
}
```

### Pattern 2: Conditional Transitions

Transition based on context or input:

```typescript
async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  if (!input) {
    return {
      messages: [createChatMessage("assistant", "What would you like to do?")],
    }
  }

  // Check if user has session
  if (ctx.session) {
    return {
      messages: [createChatMessage("assistant", "You're already verified!")],
      nextStepId: "ai_chat",
    }
  }

  // No session - go to verification
  return {
    messages: [createChatMessage("assistant", "Please verify first.")],
    nextStepId: "verify",
  }
}
```

### Pattern 3: System Messages

Use system messages for internal communication:

```typescript
async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  // Store provider selection as system message
  const systemMessage = createChatMessage("system", "provider:bmc")

  return {
    messages: [
      createChatMessage("assistant", "Provider selected!"),
      systemMessage, // Hidden from UI
    ],
    nextStepId: "provider_message",
  }
}
```

**Note**: System messages are automatically filtered from the UI display.

### Pattern 4: Context Updates

Update context without transitioning:

```typescript
async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  return {
    messages: [
      createChatMessage("assistant", "Context updated!"),
    ],
    ctxPatch: {
      provider: {
        id: "bmc",
        name: "Buy Me a Coffee",
      },
      // Other context updates
    },
    // No nextStepId - stays in current step
  }
}
```

### Pattern 5: API Calls

Make API calls from steps:

```typescript
async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  if (!input) {
    return {
      messages: [createChatMessage("assistant", "Please enter transaction ID.")],
      ui: {
        component: "verification_card",
      },
    }
  }

  // Call API
  try {
    const response = await fetch("/api/coffee/verify-public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: input,
        providerId: ctx.provider?.id || "bmc",
      }),
    })

    const result = await response.json()

    if (result.valid) {
      return {
        messages: [
          createChatMessage("assistant", "Verification successful!"),
        ],
        ctxPatch: {
          session: {
            id: generateSessionId(),
            expiresAt: Date.now() + 3600000,
            verifiedAt: new Date().toISOString(),
            transactionId: result.externalId,
          },
        },
        nextStepId: "ai_chat",
      }
    } else {
      return {
        messages: [
          createChatMessage("assistant", "Verification failed. Please try again."),
        ],
        ui: {
          component: "verification_card",
          props: {
            error: result.reason,
          },
        },
      }
    }
  } catch (error) {
    return {
      messages: [
        createChatMessage("assistant", "An error occurred. Please try again."),
      ],
    }
  }
}
```

### Pattern 6: Using Random Messages

Use random messages from config:

```typescript
import chatSettings from "@/config/chat-messages.json"
import { getRandomMessage } from "@/lib/utils"

async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  const message = getRandomMessage(chatSettings.messages.welcome)
  
  return {
    messages: [
      createChatMessage("assistant", message),
    ],
  }
}
```

## Creating UI Components for Steps

Steps can render custom UI components. Components must:

1. Accept `StepComponentProps`:

```typescript
// components/steps/your-component.tsx

import type { StepComponentProps } from "@/types/chat-ui"

export function YourComponent({ onSendMessage, ...props }: StepComponentProps) {
  // Component implementation
  return (
    <div>
      {/* Your UI */}
    </div>
  )
}
```

2. Be registered in the step's `components` field:

```typescript
export const yourStep: Step = {
  id: "your_step",
  components: {
    "your_component": YourComponent, // Register here
  },
  // ...
}
```

3. Be referenced in `StepResult.ui`:

```typescript
return {
  ui: {
    component: "your_component", // Reference registered component
    props: {
      // Props passed to component
    },
  },
}
```

## Step Transitions

Steps can transition to other steps using `nextStepId`:

```typescript
return {
  messages: [...],
  nextStepId: "verify", // Transition to verify step
}
```

The StepEngine automatically:
- Saves context updates to Redis
- Transitions to the next step
- Executes the next step's `run()` method if it has no UI

## Context Management

Steps can read and update context:

### Reading Context

```typescript
async run(ctx: ChatContext, input?: string): Promise<StepResult> {
  // Read from context
  const hasSession = !!ctx.session
  const currentProvider = ctx.provider
  const messageCount = ctx.messageCount
  const history = ctx.history // All messages (including system)
}
```

### Updating Context

```typescript
return {
  ctxPatch: {
    provider: {
      id: "bmc",
      name: "Buy Me a Coffee",
    },
    session: {
      id: "sess_123",
      expiresAt: Date.now() + 3600000,
    },
  },
}
```

## Best Practices

1. **Keep Steps Focused**: Each step should handle one specific part of the flow.

2. **Use System Messages**: For internal communication between steps, use system messages (they're hidden from UI).

3. **Handle Errors Gracefully**: Always return a valid `StepResult`, even on errors.

4. **Validate Input**: Validate user input before processing.

5. **Update Context Carefully**: Only update context fields that are necessary.

6. **Use Type Safety**: Use TypeScript types for all step inputs and outputs.

7. **Log Important Events**: Use the logger for debugging:

```typescript
import { logger } from "@/lib/logger"

logger.debug({ stepId: "your_step", input }, "Processing input")
```

## Example: Complete Step Implementation

See existing steps for reference:
- `steps/faq.ts` - FAQ step with button selection
- `steps/verify.ts` - Verification step with API calls
- `steps/ai-chat.ts` - AI chat step with session validation
- `steps/coffee-break.ts` - Coffee break step with provider selection

## Testing Your Step

1. **Test Initial Load**: Verify UI and messages appear correctly.

2. **Test Input Handling**: Test with various inputs.

3. **Test Transitions**: Verify transitions to next steps work.

4. **Test Context Updates**: Verify context is updated correctly.

5. **Test Error Cases**: Test error handling and edge cases.

## Next Steps

After creating your step:
1. Test it in the UI
2. Verify transitions work correctly
3. Check context updates are saved
4. Test error cases
5. Update documentation if needed

For more details, see the [Implementation Guide](./implementation-guide.md).

