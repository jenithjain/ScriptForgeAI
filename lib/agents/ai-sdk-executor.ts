/**
 * AI SDK Agent Executor - Robust execution engine with crash prevention
 * 
 * This executor uses Vercel AI SDK for:
 * - Automatic retry with exponential backoff
 * - Timeout handling (no more hanging requests)
 * - Structured output validation (no more JSON parse errors)
 * - Graceful degradation with fallbacks
 * - Production-grade logging
 */

import {
  safeGenerateText,
  safeGenerateObject,
  createFallbackResponse,
  StoryContextSchema,
  KnowledgeGraphSchema,
  TimelineSchema,
  ContinuityReportSchema,
  CreativeSuggestionsSchema,
  type StoryContextOutput,
  type KnowledgeGraphOutput,
  type TimelineOutput,
  type ContinuityReportOutput,
  type CreativeSuggestionsOutput,
} from '@/lib/ai-provider';
import { z } from 'zod';
import { updateGraph, getGraphOverview, clearGraph } from './story-knowledge-graph';
import { agentLogger, createLogger } from '@/lib/logger';

// Create dedicated logger for this module
const log = createLogger('ai-sdk-executor');

// Re-export types from the original executor for compatibility
export type {
  AgentContext,
  StoryContext,
  KnowledgeGraphData,
  TimelineData,
  ContinuityReport,
  CreativeSuggestions,
  RecallAnswer,
  TeaserContent,
} from './agent-executor';

import type {
  AgentContext,
  StoryContext,
  KnowledgeGraphData,
  TimelineData,
  ContinuityReport,
  CreativeSuggestions,
  RecallAnswer,
  TeaserContent,
  VisualPrompt,
} from './agent-executor';

// ============================================================================
// CONSTANTS
// ============================================================================

const AGENT_TIMEOUT = 120000; // 2 minutes
const MAX_RETRIES = 3;

// ============================================================================
// PROMPTS (extracted for maintainability)
// ============================================================================

const PROMPTS = {
  storyIntelligence: (context: AgentContext) => `You are the Story Intelligence Core - the brain of the story analysis system.

STORY/MANUSCRIPT TO ANALYZE:
${context.storyBrief}
${context.manuscript ? `\n\nFULL MANUSCRIPT:\n${context.manuscript}` : ''}

YOUR TASK:
Perform comprehensive story analysis to extract:
1. Genre identification (be specific: dark fantasy, cozy mystery, space opera, etc.)
2. Major themes (list 3-5 key themes)
3. Tone analysis (formality, sentiment, pacing)
4. Narrative structure (three-act, hero's journey, nonlinear, etc.)
5. Writing style (perspective, tense, voice characteristics)
6. Main conflict identification
7. Setting and time period

Analyze the story thoroughly and provide detailed analysis.`,

  knowledgeGraph: (context: AgentContext) => `You are the Story Knowledge Graph Agent - the comprehensive memory system for narrative analysis.

STORY/MANUSCRIPT TO ANALYZE:
${context.storyBrief}
${context.manuscript ? `\n\nFULL MANUSCRIPT:\n${context.manuscript}` : ''}

YOUR MISSION: Extract ALL story elements and create a complete knowledge graph.

EXTRACTION REQUIREMENTS:
1. CHARACTERS: Extract EVERY named character with their role, personality traits, motivations, and current status
2. LOCATIONS: Extract ALL named places, buildings, cities, and geographic locations
3. OBJECTS: Extract important items, artifacts, keys, documents, or symbolic objects
4. EVENTS: Extract major plot events, revelations, confrontations, and turning points
5. RELATIONSHIPS: Map connections between characters (family, romantic, professional, rivalry, etc.)
6. PLOT THREADS: Identify main plot and all subplots

Use descriptive IDs like "char-maya-chen" not just "char-1". Include all details from the text.`,

  temporalReasoning: (context: AgentContext) => `You are the Temporal & Causal Reasoning Agent - the timeline police.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

KNOWLEDGE GRAPH (Events & Characters):
${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

STORY:
${context.storyBrief}

YOUR TASK:
Analyze the temporal structure and causal relationships:
1. Build a chronological timeline of events (story time, not narrative order)
2. Identify flashbacks (events shown out of chronological order, referring to past)
3. Identify flash-forwards (events shown out of order, referring to future)
4. Map cause-effect relationships between events
5. Detect any temporal issues (paradoxes, inconsistencies, gaps)
6. Assess story duration and pacing`,

  continuityValidator: (context: AgentContext) => `You are the Continuity & Intent Validator - the meticulous editor.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

KNOWLEDGE GRAPH:
${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

TIMELINE ANALYSIS:
${JSON.stringify(context.timeline || {}, null, 2)}

STORY:
${context.storyBrief}

YOUR TASK:
Validate story continuity and detect issues:
1. Find contradictions (character traits, facts, locations, objects)
2. Distinguish intentional narrative choices from errors
3. Classify errors by severity
4. Check for plot holes
5. Validate character consistency
6. Provide recommendations`,

  creativeCoAuthor: (context: AgentContext) => `You are the Creative Co-Author Agent - the inspiring muse.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

KNOWLEDGE GRAPH:
${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

CONTINUITY REPORT:
${JSON.stringify(context.continuityReport || {}, null, 2)}

STORY:
${context.storyBrief}

YOUR TASK:
Provide creative suggestions to enhance the story:
1. Suggest compelling new scenes (2-3 suggestions)
2. Propose plot developments (2-3 ideas)
3. Improve dialogue opportunities (2-3 examples)
4. Guide character arcs (for main characters)
5. Reinforce themes
6. Offer alternative scenarios

Be creative, specific, and actionable!`,
};

// ============================================================================
// AGENT EXECUTION FUNCTIONS
// ============================================================================

/**
 * Execute Story Intelligence Agent with structured output
 */
async function executeStoryIntelligence(
  context: AgentContext
): Promise<{ result: StoryContext; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Story Intelligence Agent');
  
  const { object, success, error } = await safeGenerateObject(
    PROMPTS.storyIntelligence(context),
    StoryContextSchema,
    { model: 'flash', timeout: AGENT_TIMEOUT, maxRetries: MAX_RETRIES }
  );

  if (!success || !object) {
    console.warn('[AI SDK Executor] Story Intelligence failed, using fallback');
    const fallback = createFallbackResponse('story-intelligence') as StoryContext;
    return {
      result: fallback,
      updatedContext: {
        ...context,
        storyContext: fallback,
        previousResults: { ...context.previousResults, 'story-intelligence': fallback }
      }
    };
  }

  const storyContext: StoryContext = {
    genre: object.genre,
    themes: object.themes,
    tone: object.tone,
    narrativeStructure: object.narrativeStructure,
    writingStyle: object.writingStyle,
    mainConflict: object.mainConflict,
    setting: object.setting,
    timePeriod: object.timePeriod,
  };

  console.log('[AI SDK Executor] Story Intelligence complete:', storyContext.genre);

  return {
    result: storyContext,
    updatedContext: {
      ...context,
      storyContext,
      previousResults: { ...context.previousResults, 'story-intelligence': storyContext }
    }
  };
}

/**
 * Execute Knowledge Graph Agent with structured output
 */
async function executeKnowledgeGraph(
  context: AgentContext
): Promise<{ result: KnowledgeGraphData; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Knowledge Graph Agent (using Pro model)');
  
  // Use Pro model for complex graph extraction (higher token limit)
  const { object, success, error } = await safeGenerateObject(
    PROMPTS.knowledgeGraph(context),
    KnowledgeGraphSchema,
    { model: 'pro', timeout: AGENT_TIMEOUT, maxRetries: MAX_RETRIES, maxTokens: 32768 }
  );

  if (!success || !object) {
    console.warn('[AI SDK Executor] Knowledge Graph failed, using fallback. Error:', error);
    const fallback = createFallbackResponse('knowledge-graph') as KnowledgeGraphData;
    return {
      result: fallback,
      updatedContext: {
        ...context,
        knowledgeGraph: fallback,
        previousResults: { ...context.previousResults, 'knowledge-graph': fallback }
      }
    };
  }

  // Convert to internal format
  const knowledgeGraph: KnowledgeGraphData = {
    characters: object.characters.map(c => ({
      ...c,
      relationships: c.relationships || [],
    })),
    locations: object.locations,
    objects: object.objects,
    events: object.events.map(e => ({
      ...e,
      causedBy: e.causedBy || [],
      effects: e.effects || [],
    })),
    relationships: object.relationships.map(r => ({
      ...r,
      evolution: r.evolution || [],
    })),
    plotThreads: object.plotThreads.map(p => ({
      ...p,
      endChapter: p.endChapter,
    })),
  };

  console.log('[AI SDK Executor] Knowledge Graph complete:', {
    characters: knowledgeGraph.characters.length,
    locations: knowledgeGraph.locations.length,
    events: knowledgeGraph.events.length,
    relationships: knowledgeGraph.relationships.length,
  });

  // Store in Neo4j
  await storeKnowledgeGraphInNeo4j(context, knowledgeGraph);

  return {
    result: knowledgeGraph,
    updatedContext: {
      ...context,
      knowledgeGraph,
      previousResults: { ...context.previousResults, 'knowledge-graph': knowledgeGraph }
    }
  };
}

/**
 * Store knowledge graph data in Neo4j
 */
async function storeKnowledgeGraphInNeo4j(
  context: AgentContext,
  knowledgeGraph: KnowledgeGraphData
): Promise<void> {
  const hasData = knowledgeGraph.characters.length > 0 || 
                  knowledgeGraph.locations.length > 0 || 
                  knowledgeGraph.events.length > 0;

  if (!hasData) {
    console.warn('[AI SDK Executor] No knowledge graph data to store in Neo4j');
    return;
  }

  try {
    const chapterId = context.workflowId ? `workflow-${context.workflowId}` : 'workflow-analysis';
    
    await updateGraph({
      chapterId,
      chapterNumber: 1,
      summary: context.storyBrief.substring(0, 200),
      workflowId: context.workflowId,
      characters: knowledgeGraph.characters,
      locations: knowledgeGraph.locations,
      objects: knowledgeGraph.objects,
      events: knowledgeGraph.events.map(e => ({
        ...e,
        characters: e.participants || [],
        type: e.type || 'action'
      })),
      relationships: knowledgeGraph.relationships.map(r => ({
        id: r.id,
        source: r.from,
        sourceType: 'Character' as const,
        target: r.to,
        targetType: 'Character' as const,
        type: r.type,
        description: r.description,
        strength: r.strength
      })),
      plotThreads: knowledgeGraph.plotThreads.map(p => ({
        ...p,
        status: p.status === 'active' ? 'developing' : 
                p.status === 'resolved' ? 'resolved' :
                p.status === 'dormant' ? 'abandoned' : 'introduced'
      })),
      stateChanges: [],
      temporalMarkers: [],
      version: 1,
      timestamp: new Date().toISOString(),
      context: {
        activeCharacters: knowledgeGraph.characters.map(c => c.name),
        currentLocation: knowledgeGraph.locations[0]?.name || null,
        currentTimeline: 'present',
        recentEvents: knowledgeGraph.events.slice(0, 5).map(e => e.name),
        openPlotThreads: knowledgeGraph.plotThreads.filter(p => p.status === 'active').map(p => p.name),
        mood: 'neutral',
        tension: 'medium' as const
      }
    });
    console.log('[AI SDK Executor] Neo4j storage successful');
  } catch (error) {
    console.warn('[AI SDK Executor] Neo4j storage failed (non-fatal):', error);
  }
}

/**
 * Execute Temporal Reasoning Agent
 */
async function executeTemporalReasoning(
  context: AgentContext
): Promise<{ result: TimelineData; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Temporal Reasoning Agent');
  
  const { object, success, error } = await safeGenerateObject(
    PROMPTS.temporalReasoning(context),
    TimelineSchema,
    { model: 'flash', timeout: AGENT_TIMEOUT, maxRetries: MAX_RETRIES }
  );

  if (!success || !object) {
    console.warn('[AI SDK Executor] Temporal Reasoning failed, using fallback');
    const fallback = createFallbackResponse('temporal-reasoning') as TimelineData;
    return {
      result: fallback,
      updatedContext: {
        ...context,
        timeline: fallback,
        previousResults: { ...context.previousResults, 'temporal-reasoning': fallback }
      }
    };
  }

  // Convert to internal format
  const timeline: TimelineData = {
    chronologicalEvents: object.chronologicalEvents.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      chapter: e.chapter,
      timestamp: e.timestamp,
      participants: e.participants,
      location: e.location,
      causedBy: [],
      effects: [],
      type: 'action' as const,
    })),
    flashbacks: object.flashbacks.map(f => ({
      event: { id: f.eventId, name: '', description: f.description, chapter: 0, timestamp: '', participants: [], location: '', causedBy: [], effects: [], type: 'action' as const },
      narrativePosition: f.narrativePosition,
    })),
    flashForwards: object.flashForwards.map(f => ({
      event: { id: f.eventId, name: '', description: f.description, chapter: 0, timestamp: '', participants: [], location: '', causedBy: [], effects: [], type: 'action' as const },
      narrativePosition: f.narrativePosition,
    })),
    causalChains: object.causalChains,
    temporalIssues: object.temporalIssues,
    storyDuration: object.storyDuration,
    narrativePace: object.narrativePace,
  };

  console.log('[AI SDK Executor] Temporal Reasoning complete:', {
    events: timeline.chronologicalEvents.length,
    issues: timeline.temporalIssues.length,
  });

  return {
    result: timeline,
    updatedContext: {
      ...context,
      timeline,
      previousResults: { ...context.previousResults, 'temporal-reasoning': timeline }
    }
  };
}

/**
 * Execute Continuity Validator Agent
 */
async function executeContinuityValidator(
  context: AgentContext
): Promise<{ result: ContinuityReport; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Continuity Validator Agent');
  
  const { object, success, error } = await safeGenerateObject(
    PROMPTS.continuityValidator(context),
    ContinuityReportSchema,
    { model: 'flash', timeout: AGENT_TIMEOUT, maxRetries: MAX_RETRIES }
  );

  if (!success || !object) {
    console.warn('[AI SDK Executor] Continuity Validator failed, using fallback');
    const fallback = createFallbackResponse('continuity-validator') as ContinuityReport;
    return {
      result: fallback,
      updatedContext: {
        ...context,
        continuityReport: fallback,
        previousResults: { ...context.previousResults, 'continuity-validator': fallback }
      }
    };
  }

  const report: ContinuityReport = {
    contradictions: object.contradictions,
    intentionalChoices: object.intentionalChoices,
    errors: object.errors,
    warnings: object.warnings,
    continuityScore: object.continuityScore,
    recommendations: object.recommendations,
  };

  console.log('[AI SDK Executor] Continuity Validator complete:', {
    score: report.continuityScore,
    errors: report.errors.length,
  });

  return {
    result: report,
    updatedContext: {
      ...context,
      continuityReport: report,
      previousResults: { ...context.previousResults, 'continuity-validator': report }
    }
  };
}

/**
 * Execute Creative Co-Author Agent
 */
async function executeCreativeCoAuthor(
  context: AgentContext
): Promise<{ result: CreativeSuggestions; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Creative Co-Author Agent');
  
  const { object, success, error } = await safeGenerateObject(
    PROMPTS.creativeCoAuthor(context),
    CreativeSuggestionsSchema,
    { model: 'flash', timeout: AGENT_TIMEOUT, maxRetries: MAX_RETRIES }
  );

  if (!success || !object) {
    console.warn('[AI SDK Executor] Creative Co-Author failed, using fallback');
    const fallback = createFallbackResponse('creative-coauthor') as CreativeSuggestions;
    return {
      result: fallback,
      updatedContext: {
        ...context,
        suggestions: fallback,
        previousResults: { ...context.previousResults, 'creative-coauthor': fallback }
      }
    };
  }

  const suggestions: CreativeSuggestions = object;

  console.log('[AI SDK Executor] Creative Co-Author complete:', {
    scenes: suggestions.sceneSuggestions.length,
    plots: suggestions.plotDevelopments.length,
  });

  return {
    result: suggestions,
    updatedContext: {
      ...context,
      suggestions,
      previousResults: { ...context.previousResults, 'creative-coauthor': suggestions }
    }
  };
}

/**
 * Execute Intelligent Recall Agent
 */
async function executeIntelligentRecall(
  context: AgentContext
): Promise<{ result: RecallAnswer[]; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Intelligent Recall Agent');

  // Schema for recall answers
  const RecallAnswerSchema = z.object({
    query: z.string(),
    answer: z.string(),
    confidence: z.number().min(0).max(1),
    references: z.array(z.object({
      type: z.string(),
      id: z.string(),
      excerpt: z.string(),
    })),
    relatedInfo: z.array(z.string()),
  });

  const QueriesSchema = z.array(z.string());

  // Generate queries
  const queryPrompt = `Based on this story knowledge, generate 5 insightful questions a writer might ask:
  
STORY: ${context.storyBrief}
KNOWLEDGE GRAPH: ${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

Generate 5 specific, useful questions about the story.`;

  const { object: queries, success: queriesSuccess } = await safeGenerateObject(
    queryPrompt,
    QueriesSchema,
    { model: 'flash', timeout: 60000, maxRetries: 2 }
  );

  const questionList = queriesSuccess && queries ? queries : [
    "What are the key character relationships?",
    "What are the unresolved plot threads?",
    "What are the main conflicts?",
    "How do the themes manifest?",
    "What are potential story weaknesses?"
  ];

  // Answer each query
  const answers: RecallAnswer[] = [];
  
  for (const query of questionList.slice(0, 5)) {
    const answerPrompt = `You are the Intelligent Recall Agent - the story's memory.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

KNOWLEDGE GRAPH:
${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

QUESTION: ${query}

Provide a comprehensive answer with references from the story.`;

    const { object: answer, success } = await safeGenerateObject(
      answerPrompt,
      RecallAnswerSchema,
      { model: 'flash', timeout: 60000, maxRetries: 2 }
    );

    if (success && answer) {
      answers.push(answer);
    } else {
      answers.push({
        query,
        answer: "Unable to process this query at the moment.",
        confidence: 0,
        references: [],
        relatedInfo: []
      });
    }
  }

  console.log('[AI SDK Executor] Intelligent Recall complete:', answers.length, 'answers');

  return {
    result: answers,
    updatedContext: {
      ...context,
      recallAnswers: answers,
      previousResults: { ...context.previousResults, 'intelligent-recall': answers }
    }
  };
}

/**
 * Execute Cinematic Teaser Agent
 */
async function executeCinematicTeaser(
  context: AgentContext
): Promise<{ result: TeaserContent; updatedContext: AgentContext }> {
  console.log('[AI SDK Executor] Starting Cinematic Teaser Agent');

  // Schema for teaser content
  const TeaserSchema = z.object({
    essence: z.object({
      genre: z.string(),
      mainConflict: z.string(),
      mood: z.string(),
      hook: z.string(),
      keyMoments: z.array(z.string()),
    }),
    teaserScript: z.object({
      duration: z.number(),
      narration: z.array(z.string()),
      structure: z.array(z.string()),
      musicSuggestion: z.string(),
      pacing: z.string(),
    }),
    visualPrompts: z.array(z.object({
      scene: z.string(),
      prompt: z.string(),
      duration: z.number(),
      cameraAngle: z.string(),
      mood: z.string(),
      characters: z.array(z.string()),
    })),
    hooks: z.array(z.string()),
    tagline: z.string(),
  });

  const storyContext = context.storyContext || {};
  const knowledgeGraph = context.knowledgeGraph || {};

  const prompt = `You are the Cinematic Teaser Generator - create an epic, story-specific trailer.

STORY BRIEF:
${context.storyBrief}

STORY CONTEXT:
${JSON.stringify(storyContext, null, 2)}

KNOWLEDGE GRAPH:
${JSON.stringify(knowledgeGraph, null, 2)}

Create a cinematic teaser/trailer that:
1. Uses ACTUAL character names, locations, and events from the story
2. Creates visual prompts specific to THIS story
3. Includes 4-6 visual scenes with detailed prompts for AI generation
4. Has a memorable tagline

Make the visual prompts detailed enough for AI video generation (50-100 words each).`;

  const { object: teaser, success, error } = await safeGenerateObject(
    prompt,
    TeaserSchema,
    { model: 'flash', timeout: AGENT_TIMEOUT, maxRetries: MAX_RETRIES }
  );

  if (!success || !teaser) {
    console.warn('[AI SDK Executor] Cinematic Teaser failed, using fallback');
    const fallback: TeaserContent = {
      essence: {
        genre: 'Unknown',
        mainConflict: 'Unable to analyze',
        mood: 'Unknown',
        hook: 'Please retry analysis',
        keyMoments: [],
      },
      teaserScript: {
        duration: 60,
        narration: [],
        structure: [],
        musicSuggestion: '',
        pacing: '',
      },
      visualPrompts: [],
      hooks: [],
      tagline: 'Analysis pending...',
    };
    return {
      result: fallback,
      updatedContext: {
        ...context,
        teaserContent: fallback,
        previousResults: { ...context.previousResults, 'cinematic-teaser': fallback }
      }
    };
  }

  // Convert to internal format
  const teaserContent: TeaserContent = {
    essence: teaser.essence,
    teaserScript: teaser.teaserScript,
    visualPrompts: teaser.visualPrompts.map(v => ({
      ...v,
      location: '',
    })) as VisualPrompt[],
    hooks: teaser.hooks,
    tagline: teaser.tagline,
  };

  console.log('[AI SDK Executor] Cinematic Teaser complete:', teaserContent.tagline);

  return {
    result: teaserContent,
    updatedContext: {
      ...context,
      teaserContent,
      previousResults: { ...context.previousResults, 'cinematic-teaser': teaserContent }
    }
  };
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

/**
 * Execute a specific agent with the given context
 * This is the main entry point - same interface as original for compatibility
 */
export async function executeAgentWithAISDK(
  agentType: string,
  context: AgentContext
): Promise<{ result: any; updatedContext: AgentContext }> {
  // Input validation
  if (!context) {
    throw new Error('Agent context is required');
  }
  
  // Validate storyBrief for agents that need it
  const needsStoryBrief = ['story-intelligence', 'knowledge-graph', 'temporal-reasoning', 
                           'continuity-validator', 'creative-coauthor', 'intelligent-recall', 
                           'cinematic-teaser'];
  
  if (needsStoryBrief.includes(agentType)) {
    if (!context.storyBrief || typeof context.storyBrief !== 'string' || context.storyBrief.trim().length === 0) {
      throw new Error(`Agent '${agentType}' requires a non-empty storyBrief in context`);
    }
  }

  // Start logging execution
  const executionId = agentLogger.startExecution(agentType, context.workflowId, {
    storyBrief: context.storyBrief?.substring(0, 200) + '...',
    hasManuscript: !!context.manuscript,
    previousAgents: Object.keys(context.previousResults || {}),
  });
  
  log.debug(`Executing agent: ${agentType}`, { executionId });
  const startTime = Date.now();
  
  try {
    let result: { result: any; updatedContext: AgentContext };
    
    switch (agentType) {
      case 'story-intelligence':
        result = await executeStoryIntelligence(context);
        break;
      case 'knowledge-graph':
        result = await executeKnowledgeGraph(context);
        break;
      case 'temporal-reasoning':
        result = await executeTemporalReasoning(context);
        break;
      case 'continuity-validator':
        result = await executeContinuityValidator(context);
        break;
      case 'creative-coauthor':
        result = await executeCreativeCoAuthor(context);
        break;
      case 'intelligent-recall':
        result = await executeIntelligentRecall(context);
        break;
      case 'cinematic-teaser':
        result = await executeCinematicTeaser(context);
        break;
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    const elapsed = Date.now() - startTime;
    
    // Log success
    agentLogger.endExecution(executionId, 'success', result.result, undefined, 'gemini-2.0-flash');
    log.info(`Agent ${agentType} completed`, { duration: elapsed, executionId });
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    // Log error
    agentLogger.endExecution(executionId, 'error', undefined, error as Error);
    log.error(`Agent ${agentType} failed`, error as Error, { duration: elapsed, executionId });
    
    // Return fallback instead of throwing (graceful degradation)
    const fallback = createFallbackResponse(agentType);
    agentLogger.endExecution(executionId, 'fallback', fallback);
    
    return {
      result: { ...fallback, _error: (error as Error).message },
      updatedContext: {
        ...context,
        previousResults: { ...context.previousResults, [agentType]: fallback }
      }
    };
  }
}

/**
 * Execute a full workflow with all agents in sequence
 */
export async function executeFullWorkflowWithAISDK(
  storyBrief: string,
  manuscript?: string,
  selectedAgents?: string[]
): Promise<{
  results: Record<string, any>;
  context: AgentContext;
  success: boolean;
  errors: string[];
}> {
  const allAgents = selectedAgents || [
    'story-intelligence',
    'knowledge-graph',
    'temporal-reasoning',
    'continuity-validator',
    'creative-coauthor',
    'intelligent-recall',
    'cinematic-teaser'
  ];

  let context: AgentContext = {
    storyBrief,
    manuscript,
    previousResults: {}
  };

  const results: Record<string, any> = {};
  const errors: string[] = [];

  for (const agentType of allAgents) {
    try {
      console.log(`[AI SDK Executor] Executing agent: ${agentType}`);
      const { result, updatedContext } = await executeAgentWithAISDK(agentType, context);
      
      // Check if result contains an error marker
      if (result._error) {
        errors.push(`${agentType}: ${result._error}`);
      }
      
      results[agentType] = result;
      context = updatedContext;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AI SDK Executor] Error in ${agentType}:`, error);
      errors.push(`${agentType}: ${errorMsg}`);
      results[agentType] = { error: errorMsg };
    }
  }

  return {
    results,
    context,
    success: errors.length === 0,
    errors
  };
}
