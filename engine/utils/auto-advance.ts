/**
 * Auto-Advance Utility
 * 
 * Handles automatic step transitions when a step doesn't provide UI.
 * This is orchestration logic, not business logic - it just advances
 * through steps until one provides UI or reaches max depth.
 */

import type { ChatContext, StepResult } from "@/types/engine"
import { StepEngine } from "../step-engine"

const DEFAULT_MAX_DEPTH = 5

/**
 * Automatically advances through steps until one provides UI or max depth is reached.
 * 
 * @param engine - StepEngine instance
 * @param ctx - Current chat context
 * @param maxDepth - Maximum number of steps to advance (default: 5)
 * @returns Updated context and final step result
 */
export async function handleAutoAdvance(
  engine: StepEngine,
  ctx: ChatContext,
  maxDepth = DEFAULT_MAX_DEPTH,
): Promise<{ ctx: ChatContext; result: StepResult }> {
  let currentCtx = ctx
  let depth = 0

  while (depth < maxDepth) {
    const dispatchResult = await engine.dispatch(currentCtx, undefined)

    // If the step doesn't transition, we're done
    if (!dispatchResult.output.nextStepId) {
      return {
        ctx: dispatchResult.ctx,
        result: dispatchResult.output,
      }
    }

    // If the step transitions but already has messages/components/ui, we're done
    if (
      dispatchResult.output.messages?.length ||
      dispatchResult.output.components?.length ||
      !!dispatchResult.output.ui
    ) {
      return {
        ctx: dispatchResult.ctx,
        result: dispatchResult.output,
      }
    }

    // Step transitioned but no UI yet - continue to next step
    currentCtx = dispatchResult.ctx
    depth++
  }

  // Max depth reached
  return {
    ctx: currentCtx,
    result: {
      messages: [],
      components: [],
    },
  }
}

