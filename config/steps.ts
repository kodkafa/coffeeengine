import type { Step } from "@/types/engine"

export enum StepId {
  FAQ = "faq",
  FIRST_COFFEE = "first_coffee",
  COFFEE_BREAK = "coffee_break",
  SUPPORT = "support",
  VERIFY = "verify",
  AI_CHAT = "ai_chat",
  PROVIDER_MESSAGE = "provider_message",
}

import { aiChatStep } from "@/steps/ai-chat"
import { coffeeBreakStep } from "@/steps/coffee-break"
import { faqStep } from "@/steps/faq"
import { firstCoffeeStep } from "@/steps/first-coffee"
import { providerMessageStep } from "@/steps/provider-message"
import { supportStep } from "@/steps/support"
import { verifyStep } from "@/steps/verify"

export const stepRegistry: Record<StepId, Step> = {
  [StepId.FAQ]: faqStep,  // First step = default
  [StepId.FIRST_COFFEE]: firstCoffeeStep,
  [StepId.COFFEE_BREAK]: coffeeBreakStep,
  [StepId.PROVIDER_MESSAGE]: providerMessageStep,
  [StepId.VERIFY]: verifyStep,
  [StepId.AI_CHAT]: aiChatStep,
  [StepId.SUPPORT]: supportStep,
}
