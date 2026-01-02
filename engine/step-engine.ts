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
import { createChatMessage } from "./utils/message"

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

    // Add user input to history BEFORE step execution
    // Note: Step receives original input for processing, but we store it as system message
    // if it's an internal command (like "provider:bmc") to hide it from UI
    let inputMessage: ReturnType<typeof createChatMessage> | null = null
    if (input) {
      const normalizedInput = input.toLowerCase().trim()
      // Detect internal command patterns - these are for step communication, not user display
      const isInternalCommand = normalizedInput.startsWith("provider:")
      
      // Store as system message to hide from UI, but step still receives original input
      inputMessage = createChatMessage(
        isInternalCommand ? "system" : "user",
        input
      )
    }

    // Execute the step with original input (step needs to process it)
    // Step will handle the input and may transition based on it
    const result = await step.run(ctx, input)

    // Build the updated context
    const updatedCtx: ChatContext = {
      ...ctx,
      // Apply context patches from step result
      ...result.ctxPatch,
      // Update current step ID (transition if nextStepId is provided, otherwise stay)
      currentStepId: result.nextStepId ?? activeStepId,
      // Increment message count (include input message if present)
      messageCount: ctx.messageCount + (inputMessage ? 1 : 0) + (result.messages?.length ?? 0),
      // Append input message and step output messages to history
      history: [
        ...ctx.history,
        ...(inputMessage ? [inputMessage] : []),
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

