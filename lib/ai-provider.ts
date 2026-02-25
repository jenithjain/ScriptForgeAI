/**
 * AI Provider Configuration
 * 
 * Centralized AI SDK configuration with:
 * - Google Gemini provider setup
 * - Model configurations
 * - Error handling & retry logic
 * - Timeout management
 * - Type-safe structured outputs
 * - Production-grade logging
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject, streamText, LanguageModel } from 'ai';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

// Create dedicated logger for AI provider
const log = createLogger('ai-provider');

// Environment validation
const ENV_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// Singleton provider (env var) – used as default fallback
let _defaultProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

/**
 * Get or create a Google Generative AI provider.
 * If apiKey is supplied, a fresh per-user provider is created.
 * Otherwise falls back to the env-var singleton.
 */
export function getGoogleProvider(apiKey?: string) {
  if (apiKey) {
    return createGoogleGenerativeAI({ apiKey });
  }
  if (!ENV_API_KEY) {
    // Return a provider with a placeholder key.
    // It won't crash at import time — the error surfaces at actual API call time,
    // which is correct since per-user keys are injected at request time.
    console.warn('[ai-provider] No GOOGLE_GEMINI_API_KEY env var set. Per-user keys required.');
    return createGoogleGenerativeAI({ apiKey: 'MISSING_KEY' });
  }
  if (!_defaultProvider) {
    _defaultProvider = createGoogleGenerativeAI({ apiKey: ENV_API_KEY });
  }
  return _defaultProvider;
}

// Initialize Google Generative AI provider (backward-compatible alias)
const google = new Proxy(function(){} as unknown as ReturnType<typeof createGoogleGenerativeAI>, {
  apply(_target: any, _thisArg: any, args: any[]) {
    return (getGoogleProvider() as any)(...args);
  },
  get(_target, prop, receiver) {
    if (prop === 'prototype' || prop === 'constructor') return undefined;
    return Reflect.get(getGoogleProvider(), prop, receiver);
  },
}) as ReturnType<typeof createGoogleGenerativeAI>;

// ============================================================================
// MODEL CONFIGURATIONS
// ============================================================================

/**
 * Models available in ScriptForgeAI
 * Updated: February 2026 - Optimized for cost/performance
 */
export const models = {
  // Fast model for general tasks - cost-effective
  flash: google('gemini-2.0-flash'),
  
  // Pro model for complex reasoning (Knowledge Graph, etc.)
  pro: google('gemini-2.5-pro'),
  
  // Alias for backwards compatibility
  reasoning: google('gemini-2.0-flash'),
  knowledgeGraph: google('gemini-2.5-pro'),
};

/**
 * Create a per-user model set from a user's API key.
 */
export function createModels(apiKey?: string) {
  if (!apiKey) return models; // use defaults
  const provider = getGoogleProvider(apiKey);
  return {
    flash: provider('gemini-2.0-flash'),
    pro: provider('gemini-2.5-pro'),
    reasoning: provider('gemini-2.0-flash'),
    knowledgeGraph: provider('gemini-2.5-pro'),
  };
}

export type ModelType = keyof typeof models;

// ============================================================================
// GENERATION OPTIONS
// ============================================================================

export interface GenerationOptions {
  /** Maximum retries on failure (default: 3) */
  maxRetries?: number;
  /** Timeout in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
  /** Temperature for generation (default: varies by use case) */
  temperature?: number;
  /** Max output tokens (default: varies by model) */
  maxTokens?: number;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

const DEFAULT_OPTIONS: Required<GenerationOptions> = {
  maxRetries: 3,
  timeout: 120000, // 2 minutes
  temperature: 0.8,
  maxTokens: 8192,
  abortSignal: undefined as any, // Will be created per-request
};

// ============================================================================
// SAFE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate text with automatic retry, timeout, and error handling
 */
export async function safeGenerateText(
  prompt: string,
  options: GenerationOptions & { model?: ModelType; apiKey?: string } = {}
): Promise<{ text: string; success: boolean; error?: string }> {
  const {
    model: modelType = 'flash',
    apiKey,
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    timeout = DEFAULT_OPTIONS.timeout,
    temperature = DEFAULT_OPTIONS.temperature,
    maxTokens = DEFAULT_OPTIONS.maxTokens,
  } = options;

  const modelSet = createModels(apiKey);
  const model = modelSet[modelType];
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.debug(`generateText attempt ${attempt}/${maxRetries}`, { model: modelType, timeout });
      
      const result = await generateText({
        model,
        prompt,
        temperature,
        abortSignal: AbortSignal.timeout(timeout),
      });

      const elapsed = Date.now() - startTime;
      log.info(`generateText success`, { model: modelType, attempt, duration: elapsed });

      return {
        text: result.text,
        success: true,
      };
    } catch (error) {
      lastError = error as Error;
      const elapsed = Date.now() - startTime;
      log.warn(`generateText attempt ${attempt} failed`, { 
        model: modelType, 
        duration: elapsed, 
        error: (error as Error).message 
      });

      // Don't retry on certain errors
      if (error instanceof Error) {
        // Timeout - retry once more
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
          if (attempt >= 2) {
            log.warn('Timeout on second attempt, giving up');
            break;
          }
        }
        
        // Rate limit - wait longer before retry
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          log.warn('Rate limited, waiting 5 seconds...');
          await delay(5000);
        }
        
        // Invalid API key - don't retry
        if (error.message.includes('401') || error.message.includes('API key')) {
          log.error('Invalid API key, not retrying', error as Error);
          break;
        }
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        log.debug(`Waiting ${backoffMs}ms before retry...`);
        await delay(backoffMs);
      }
    }
  }

  return {
    text: '',
    success: false,
    error: lastError?.message || 'Unknown error after retries',
  };
}

/**
 * Generate structured JSON output with Zod schema validation
 * This GUARANTEES the output matches your schema - no parsing errors!
 */
export async function safeGenerateObject<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options: GenerationOptions & { model?: ModelType; apiKey?: string } = {}
): Promise<{ object: T | null; success: boolean; error?: string }> {
  const {
    model: modelType = 'flash',
    apiKey,
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    timeout = DEFAULT_OPTIONS.timeout,
    temperature = 0.7, // Lower for structured output
    maxTokens = DEFAULT_OPTIONS.maxTokens,
  } = options;

  const modelSet = createModels(apiKey);
  const model = modelSet[modelType];
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.debug(`generateObject attempt ${attempt}/${maxRetries}`, { model: modelType, timeout });
      
      const result = await generateObject({
        model,
        prompt,
        schema,
        temperature,
        abortSignal: AbortSignal.timeout(timeout),
      });

      const elapsed = Date.now() - startTime;
      log.info(`generateObject success`, { model: modelType, attempt, duration: elapsed });

      return {
        object: result.object,
        success: true,
      };
    } catch (error) {
      lastError = error as Error;
      log.warn(`generateObject attempt ${attempt} failed`, { 
        model: modelType, 
        error: (error as Error).message 
      });

      // Handle specific errors
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' && attempt >= 2) break;
        if (error.message.includes('401') || error.message.includes('API key')) break;
        
        if (error.message.includes('429')) {
          await delay(5000);
        }
      }

      if (attempt < maxRetries) {
        await delay(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
      }
    }
  }

  return {
    object: null,
    success: false,
    error: lastError?.message || 'Failed to generate structured output',
  };
}

/**
 * Stream text generation with real-time output
 */
export async function safeStreamText(
  prompt: string,
  options: GenerationOptions & { model?: ModelType; apiKey?: string; onChunk?: (chunk: string) => void } = {}
) {
  const {
    model: modelType = 'flash',
    apiKey,
    timeout = DEFAULT_OPTIONS.timeout,
    temperature = DEFAULT_OPTIONS.temperature,
    maxTokens = DEFAULT_OPTIONS.maxTokens,
    onChunk,
  } = options;

  const modelSet = createModels(apiKey);
  const model = modelSet[modelType];

  try {
    const result = streamText({
      model,
      prompt,
      temperature,
      abortSignal: AbortSignal.timeout(timeout),
    });

    let fullText = '';
    
    for await (const chunk of result.textStream) {
      fullText += chunk;
      onChunk?.(chunk);
    }

    return {
      text: fullText,
      success: true,
    };
  } catch (error) {
    console.error('[AI SDK] streamText failed:', error);
    return {
      text: '',
      success: false,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// SCHEMA DEFINITIONS FOR AGENTS
// ============================================================================

/**
 * Story Context schema (Story Intelligence Agent output)
 */
export const StoryContextSchema = z.object({
  genre: z.string().describe('Specific genre (e.g., dark fantasy, cozy mystery)'),
  themes: z.array(z.string()).describe('3-5 major themes'),
  tone: z.object({
    formality: z.enum(['formal', 'informal', 'mixed']),
    sentiment: z.enum(['dark', 'light', 'neutral', 'complex']),
    pacing: z.enum(['slow', 'steady', 'fast', 'variable']),
  }),
  narrativeStructure: z.object({
    type: z.enum(['three-act', 'hero-journey', 'nonlinear', 'episodic', 'frame-narrative']),
    currentAct: z.number(),
    totalActs: z.number(),
  }),
  writingStyle: z.object({
    perspective: z.enum(['first-person', 'third-person-limited', 'third-person-omniscient', 'second-person']),
    tense: z.enum(['past', 'present', 'mixed']),
    voice: z.string().describe('Description of narrative voice'),
  }),
  mainConflict: z.string(),
  setting: z.string(),
  timePeriod: z.string(),
});

export type StoryContextOutput = z.infer<typeof StoryContextSchema>;

/**
 * Character schema for Knowledge Graph
 */
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  description: z.string(),
  traits: z.array(z.string()),
  motivations: z.array(z.string()),
  relationships: z.array(z.string()),
  firstAppearance: z.string(),
  status: z.string(),
});

/**
 * Full Knowledge Graph schema
 */
export const KnowledgeGraphSchema = z.object({
  characters: z.array(CharacterSchema),
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string(),
    significance: z.string(),
    connectedLocations: z.array(z.string()),
  })),
  objects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string(),
    significance: z.string(),
    currentLocation: z.string(),
    owner: z.string(),
  })),
  events: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    chapter: z.number(),
    timestamp: z.string(),
    participants: z.array(z.string()),
    location: z.string(),
    causedBy: z.array(z.string()),
    effects: z.array(z.string()),
    type: z.enum(['action', 'dialogue', 'revelation', 'conflict', 'resolution']),
  })),
  relationships: z.array(z.object({
    id: z.string(),
    from: z.string(),
    to: z.string(),
    type: z.string(),
    description: z.string(),
    strength: z.number(),
    evolution: z.array(z.string()),
  })),
  plotThreads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'resolved', 'dormant', 'foreshadowed']),
    startChapter: z.number(),
    endChapter: z.number().optional(),
    relatedCharacters: z.array(z.string()),
    relatedEvents: z.array(z.string()),
  })),
});

export type KnowledgeGraphOutput = z.infer<typeof KnowledgeGraphSchema>;

/**
 * Timeline/Temporal data schema
 */
export const TimelineSchema = z.object({
  chronologicalEvents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    chapter: z.number(),
    timestamp: z.string(),
    participants: z.array(z.string()),
    location: z.string(),
  })),
  flashbacks: z.array(z.object({
    eventId: z.string(),
    narrativePosition: z.number(),
    description: z.string(),
  })),
  flashForwards: z.array(z.object({
    eventId: z.string(),
    narrativePosition: z.number(),
    description: z.string(),
  })),
  causalChains: z.array(z.object({
    cause: z.string(),
    effects: z.array(z.string()),
    validated: z.boolean(),
  })),
  temporalIssues: z.array(z.object({
    id: z.string(),
    type: z.enum(['paradox', 'inconsistency', 'gap', 'overlap']),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    affectedEvents: z.array(z.string()),
    suggestion: z.string(),
  })),
  storyDuration: z.string(),
  narrativePace: z.string(),
});

export type TimelineOutput = z.infer<typeof TimelineSchema>;

/**
 * Continuity Report schema
 */
export const ContinuityReportSchema = z.object({
  contradictions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    locations: z.array(z.string()),
    isIntentional: z.boolean(),
  })),
  intentionalChoices: z.array(z.string()),
  errors: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    suggestion: z.string(),
  })),
  warnings: z.array(z.string()),
  continuityScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});

export type ContinuityReportOutput = z.infer<typeof ContinuityReportSchema>;

/**
 * Creative Suggestions schema
 */
export const CreativeSuggestionsSchema = z.object({
  sceneSuggestions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    placement: z.string(),
    characters: z.array(z.string()),
    purpose: z.string(),
    emotionalBeat: z.string(),
  })),
  plotDevelopments: z.array(z.object({
    idea: z.string(),
    rationale: z.string(),
    impact: z.string(),
    relatedThreads: z.array(z.string()),
  })),
  dialogueImprovements: z.array(z.object({
    original: z.string().optional(),
    improved: z.string(),
    character: z.string(),
    context: z.string(),
    reason: z.string(),
  })),
  characterArcGuidance: z.array(z.object({
    character: z.string(),
    currentStage: z.string(),
    nextSteps: z.array(z.string()),
    emotionalJourney: z.string(),
    potentialConflicts: z.array(z.string()),
  })),
  themeReinforcements: z.array(z.string()),
  alternativeScenarios: z.array(z.string()),
});

export type CreativeSuggestionsOutput = z.infer<typeof CreativeSuggestionsSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create fallback response when generation completely fails
 */
export function createFallbackResponse(agentType: string): any {
  console.warn(`[AI SDK] Creating fallback response for ${agentType}`);
  
  switch (agentType) {
    case 'story-intelligence':
      return {
        genre: 'unknown',
        themes: ['analysis pending'],
        tone: { formality: 'mixed', sentiment: 'neutral', pacing: 'steady' },
        narrativeStructure: { type: 'three-act', currentAct: 1, totalActs: 3 },
        writingStyle: { perspective: 'third-person-limited', tense: 'past', voice: 'neutral' },
        mainConflict: 'Unable to analyze - please retry',
        setting: 'unknown',
        timePeriod: 'unknown',
      };
    case 'knowledge-graph':
      return {
        characters: [],
        locations: [],
        objects: [],
        events: [],
        relationships: [],
        plotThreads: [],
      };
    case 'temporal-reasoning':
      return {
        chronologicalEvents: [],
        flashbacks: [],
        flashForwards: [],
        causalChains: [],
        temporalIssues: [],
        storyDuration: 'unknown',
        narrativePace: 'unknown',
      };
    case 'continuity-validator':
      return {
        contradictions: [],
        intentionalChoices: [],
        errors: [],
        warnings: ['Analysis incomplete - please retry'],
        continuityScore: 0,
        recommendations: ['Retry analysis for accurate results'],
      };
    case 'creative-coauthor':
      return {
        sceneSuggestions: [],
        plotDevelopments: [],
        dialogueImprovements: [],
        characterArcGuidance: [],
        themeReinforcements: [],
        alternativeScenarios: [],
      };
    default:
      return { error: 'Analysis failed', message: 'Please retry' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { google, generateText, generateObject, streamText, z };
