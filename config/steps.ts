import type { Step } from "@/types/engine"

export enum StepId {
  FAQ = "faq",
  COFFEE_BREAK = "coffee_break",
  SUPPORT = "support",
  VERIFY = "verify",
  AI_CHAT = "ai_chat",
}

import { aiChatStep } from "@/steps/aiChat"
import { coffeeBreakStep } from "@/steps/coffeeBreak"
import { faqStep } from "@/steps/faq"
import { supportStep } from "@/steps/support"
import { verifyStep } from "@/steps/verify"

export const stepRegistry: Record<StepId, Step> = {
  [StepId.FAQ]: faqStep,  // First step = default
  [StepId.COFFEE_BREAK]: coffeeBreakStep,
  [StepId.SUPPORT]: supportStep,
  [StepId.VERIFY]: verifyStep,
  [StepId.AI_CHAT]: aiChatStep,
}
