/**
 * StepEngine - A minimal orchestrator for step-based conversation flows.
 * 
 * The engine:
 * - Locates the active step
 * - Executes it
 * - Applies context updates
 * - Advances to the next step if requested
 * 
 * The engine does not interpret input semantics.
 * All behavior lives inside steps.
 */

import type { ChatContext, Step, StepResult } from "./types"

export interface EngineDispatchResult {
  /**
   * The step execution result (messages, components, transitions).
   */
  output: StepResult

  /**
   * The full updated ChatContext after step execution.
   * This includes:
   * - Applied ctxPatch updates
   * - Updated currentStepId (if transition occurred)
   * - Incremented messageCount
   * - Appended messages to history
   * 
   * This can be saved to the database for persistence.
   */
  ctx: ChatContext
}

export class StepEngine {
  private steps: Record<string, Step>
  private initialStepId: string
  
  constructor(steps: Record<string, Step>) {
    this.steps = steps
    this.initialStepId = this.getDefaultStepId()
  }

  /**
   * Dispatches user input to the active step and returns the result.
   * 
   * @param ctx - The current chat context
   * @param input - Optional user input (chat message string)
   * @returns EngineDispatchResult with output and full updated context
   * @throws Error if the active step is not found
   */
  async dispatch(ctx: ChatContext, input?: string): Promise<EngineDispatchResult> {
    // Determine the active step ID (fallback to initial if not set)
    const activeStepId = ctx.currentStepId ?? this.initialStepId

    // Locate the active step
    const step = this.steps[activeStepId]

    if (!step) {
      throw new Error(`Active step not found: ${activeStepId}`)
    }

    // Execute the step
    const result = await step.run(ctx, input)

    // Build the updated context
    const updatedCtx: ChatContext = {
      ...ctx,
      // Apply context patches from step result
      ...result.ctxPatch,
      // Update current step ID (transition if nextStepId is provided, otherwise stay)
      currentStepId: result.nextStepId ?? activeStepId,
      // Increment message count
      messageCount: ctx.messageCount + (result.messages?.length ?? 0),
      // Append new messages to history
      history: [
        ...ctx.history,
        ...(result.messages ?? []),
      ],
    }

    return {
      output: result,
      ctx: updatedCtx,
    }
  }

  /**
   * Gets the current step definition.
   * Useful for debugging or introspection.
   */
  getCurrentStep(ctx: ChatContext): Step | undefined {
    const activeStepId = ctx.currentStepId ?? this.initialStepId
    return this.steps[activeStepId]
  }

  /**
   * Gets all registered step IDs.
   */
  getStepIds(): string[] {
    return Object.keys(this.steps)
  }


  getDefaultStepId(): string {
    return Object.keys(this.steps)[0]
  }
}

