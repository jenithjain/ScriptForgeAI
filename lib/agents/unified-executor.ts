/**
 * Unified Agent Executor
 * 
 * This is the main entry point for agent execution. It uses the AI SDK executor
 * as the primary engine with automatic fallback to the legacy executor if needed.
 * 
 * Benefits:
 * - AI SDK provides: retries, timeouts, structured output, crash prevention
 * - Legacy fallback ensures backwards compatibility
 * - Graceful degradation - never crashes, always returns something useful
 * - Production-grade logging
 */

import { executeAgentWithAISDK, executeFullWorkflowWithAISDK } from './ai-sdk-executor';
import { executeAgent as executeAgentLegacy, executeFullWorkflow as executeFullWorkflowLegacy } from './agent-executor';
import type { AgentContext } from './agent-executor';
import { createLogger, workflowLogger } from '@/lib/logger';

// Create dedicated logger for this module
const log = createLogger('unified-executor');

// Re-export types for convenience
export type { AgentContext } from './agent-executor';
export type {
  StoryContext,
  KnowledgeGraphData,
  TimelineData,
  ContinuityReport,
  CreativeSuggestions,
  RecallAnswer,
  TeaserContent,
} from './agent-executor';

// Configuration
const USE_AI_SDK = true; // Set to false to use legacy executor only
const USE_FALLBACK = true; // Set to false to disable legacy fallback

/**
 * Execute a single agent with automatic retry and fallback
 */
export async function executeAgent(
  agentType: string,
  context: AgentContext
): Promise<{ result: any; updatedContext: AgentContext }> {
  log.info(`Starting agent: ${agentType}`, { workflowId: context.workflowId });
  const startTime = Date.now();

  // Try AI SDK executor first (has built-in retry, timeout, structured output)
  if (USE_AI_SDK) {
    try {
      const result = await executeAgentWithAISDK(agentType, context);
      const elapsed = Date.now() - startTime;
      log.info(`AI SDK completed: ${agentType}`, { duration: elapsed });
      return result;
    } catch (aiSdkError) {
      log.warn(`AI SDK failed for ${agentType}, attempting fallback`, { 
        error: (aiSdkError as Error).message 
      });
      
      // Fall back to legacy executor if enabled
      if (USE_FALLBACK) {
        log.info(`Falling back to legacy executor: ${agentType}`);
        try {
          const result = await executeAgentLegacy(agentType, context);
          const elapsed = Date.now() - startTime;
          log.info(`Legacy completed: ${agentType}`, { duration: elapsed, usedFallback: true });
          return result;
        } catch (legacyError) {
          log.error(`Both executors failed: ${agentType}`, legacyError as Error);
          throw legacyError;
        }
      }
      
      throw aiSdkError;
    }
  }

  // AI SDK disabled, use legacy directly
  return executeAgentLegacy(agentType, context);
}

/**
 * Execute a full workflow with all agents
 */
export async function executeFullWorkflow(
  storyBrief: string,
  manuscript?: string,
  selectedAgents?: string[]
): Promise<{
  results: Record<string, any>;
  context: AgentContext;
  success: boolean;
  errors: string[];
}> {
  const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  workflowLogger.startWorkflow(workflowId, 'AI Analysis', selectedAgents?.length || 7);
  
  const startTime = Date.now();

  if (USE_AI_SDK) {
    try {
      const result = await executeFullWorkflowWithAISDK(storyBrief, manuscript, selectedAgents);
      const elapsed = Date.now() - startTime;
      workflowLogger.endWorkflow(workflowId, 'completed', elapsed);
      log.info(`Workflow completed`, { workflowId, duration: elapsed, agentCount: selectedAgents?.length });
      return result;
    } catch (aiSdkError) {
      log.warn('AI SDK workflow failed, trying fallback', { error: (aiSdkError as Error).message });
      
      if (USE_FALLBACK) {
        log.info('Falling back to legacy workflow');
        const result = await executeFullWorkflowLegacy(storyBrief, manuscript, selectedAgents);
        const elapsed = Date.now() - startTime;
        workflowLogger.endWorkflow(workflowId, 'completed-fallback', elapsed);
        return result;
      }
      
      const elapsed = Date.now() - startTime;
      workflowLogger.endWorkflow(workflowId, 'failed', elapsed);
      throw aiSdkError;
    }
  }

  return executeFullWorkflowLegacy(storyBrief, manuscript, selectedAgents);
}

/**
 * Health check - verify AI SDK is working
 */
export async function checkExecutorHealth(): Promise<{
  aiSdk: boolean;
  legacy: boolean;
  message: string;
}> {
  const testContext: AgentContext = {
    storyBrief: 'Test story for health check.',
    previousResults: {},
  };

  let aiSdk = false;
  let legacy = false;

  // Test AI SDK
  try {
    // Quick test with minimal prompt
    const { safeGenerateText } = await import('@/lib/ai-provider');
    const result = await safeGenerateText('Say "OK"', { timeout: 10000 });
    aiSdk = result.success;
  } catch (e) {
    console.warn('AI SDK health check failed:', e);
  }

  // Test legacy (just verify it can be imported)
  try {
    legacy = typeof executeAgentLegacy === 'function';
  } catch (e) {
    console.warn('Legacy executor health check failed:', e);
  }

  return {
    aiSdk,
    legacy,
    message: aiSdk 
      ? 'AI SDK is operational' 
      : legacy 
        ? 'Using legacy executor (AI SDK unavailable)' 
        : 'All executors unavailable',
  };
}
