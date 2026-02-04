/**
 * Agent Executor - Unified execution engine for all Story Intelligence agents
 * Uses Gemini API for intelligent processing with specialized prompts per agent
 */

import { getReasoningModel, generateWithRetry, parseJSONFromResponse } from '@/lib/gemini';
import { AGENT_DEFINITIONS } from './definitions';
import { updateGraph, getGraphOverview, clearGraph } from './story-knowledge-graph';

// Shared context that flows between agents
export interface AgentContext {
  storyBrief: string;
  manuscript?: string;
  storyContext?: StoryContext;
  knowledgeGraph?: KnowledgeGraphData;
  timeline?: TimelineData;
  continuityReport?: ContinuityReport;
  suggestions?: CreativeSuggestions;
  recallAnswers?: RecallAnswer[];
  teaserContent?: TeaserContent;
  previousResults: Record<string, any>;
  customPrompt?: string | null; // User-provided custom prompt override
}

export interface StoryContext {
  genre: string;
  themes: string[];
  tone: { formality: string; sentiment: string; pacing: string };
  narrativeStructure: { type: string; currentAct: number; totalActs: number };
  writingStyle: { perspective: string; tense: string; voice: string };
  mainConflict: string;
  setting: string;
  timePeriod: string;
}

export interface KnowledgeGraphData {
  characters: Character[];
  locations: Location[];
  objects: StoryObject[];
  events: StoryEvent[];
  relationships: Relationship[];
  plotThreads: PlotThread[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  traits: string[];
  motivations: string[];
  relationships: string[];
  firstAppearance: string;
  status: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  significance: string;
  connectedLocations: string[];
}

export interface StoryObject {
  id: string;
  name: string;
  type: string;
  description: string;
  significance: string;
  currentLocation: string;
  owner: string;
}

export interface StoryEvent {
  id: string;
  name: string;
  description: string;
  chapter: number;
  timestamp: string;
  participants: string[];
  location: string;
  causedBy: string[];
  effects: string[];
  type: 'action' | 'dialogue' | 'revelation' | 'conflict' | 'resolution';
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: string;
  description: string;
  strength: number;
  evolution: string[];
}

export interface PlotThread {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'resolved' | 'dormant' | 'foreshadowed';
  startChapter: number;
  endChapter?: number;
  relatedCharacters: string[];
  relatedEvents: string[];
}

export interface TimelineData {
  chronologicalEvents: StoryEvent[];
  flashbacks: { event: StoryEvent; narrativePosition: number }[];
  flashForwards: { event: StoryEvent; narrativePosition: number }[];
  causalChains: { cause: string; effects: string[]; validated: boolean }[];
  temporalIssues: TemporalIssue[];
  storyDuration: string;
  narrativePace: string;
}

export interface TemporalIssue {
  id: string;
  type: 'paradox' | 'inconsistency' | 'gap' | 'overlap';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedEvents: string[];
  suggestion: string;
}

export interface ContinuityReport {
  contradictions: Contradiction[];
  intentionalChoices: string[];
  errors: ContinuityError[];
  warnings: string[];
  continuityScore: number;
  recommendations: string[];
}

export interface Contradiction {
  id: string;
  type: string;
  description: string;
  locations: string[];
  isIntentional: boolean;
}

export interface ContinuityError {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

export interface CreativeSuggestions {
  sceneSuggestions: SceneSuggestion[];
  plotDevelopments: PlotDevelopment[];
  dialogueImprovements: DialogueImprovement[];
  characterArcGuidance: CharacterArcGuidance[];
  themeReinforcements: string[];
  alternativeScenarios: string[];
}

export interface SceneSuggestion {
  title: string;
  description: string;
  placement: string;
  characters: string[];
  purpose: string;
  emotionalBeat: string;
}

export interface PlotDevelopment {
  idea: string;
  rationale: string;
  impact: string;
  relatedThreads: string[];
}

export interface DialogueImprovement {
  original?: string;
  improved: string;
  character: string;
  context: string;
  reason: string;
}

export interface CharacterArcGuidance {
  character: string;
  currentStage: string;
  nextSteps: string[];
  emotionalJourney: string;
  potentialConflicts: string[];
}

export interface RecallAnswer {
  query: string;
  answer: string;
  confidence: number;
  references: { type: string; id: string; excerpt: string }[];
  relatedInfo: string[];
}

export interface TeaserContent {
  essence: {
    genre: string;
    mainConflict: string;
    mood: string;
    hook: string;
    keyMoments: string[];
  };
  teaserScript: {
    duration: number;
    narration: string[];
    structure: string[];
    musicSuggestion: string;
    pacing: string;
  };
  visualPrompts: VisualPrompt[];
  hooks: string[];
  tagline: string;
}

export interface VisualPrompt {
  scene: string;
  prompt: string;
  duration: number;
  cameraAngle: string;
  mood: string;
  characters: string[];
}

/**
 * Build prompt with optional custom instructions
 */
function buildPrompt(defaultPrompt: string, customPrompt?: string | null): string {
  if (customPrompt && customPrompt.trim()) {
    return `${customPrompt.trim()}

--- DEFAULT CONTEXT (for reference) ---
${defaultPrompt}`;
  }
  return defaultPrompt;
}

/**
 * Execute a specific agent with the given context
 */
export async function executeAgent(
  agentType: string,
  context: AgentContext
): Promise<{ result: any; updatedContext: AgentContext }> {
  const model = getReasoningModel();
  
  switch (agentType) {
    case 'story-intelligence':
      return executeStoryIntelligence(model, context);
    case 'knowledge-graph':
      return executeKnowledgeGraph(model, context);
    case 'temporal-reasoning':
      return executeTemporalReasoning(model, context);
    case 'continuity-validator':
      return executeContinuityValidator(model, context);
    case 'creative-coauthor':
      return executeCreativeCoAuthor(model, context);
    case 'intelligent-recall':
      return executeIntelligentRecall(model, context);
    case 'cinematic-teaser':
      return executeCinematicTeaser(model, context);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Story Intelligence Core - The Brain
 */
async function executeStoryIntelligence(
  model: any,
  context: AgentContext
): Promise<{ result: StoryContext; updatedContext: AgentContext }> {
  const defaultPrompt = `You are the Story Intelligence Core - the brain of the story analysis system.

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

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "genre": "string",
  "themes": ["theme1", "theme2", "theme3"],
  "tone": {
    "formality": "formal|informal|mixed",
    "sentiment": "dark|light|neutral|complex",
    "pacing": "slow|steady|fast|variable"
  },
  "narrativeStructure": {
    "type": "three-act|hero-journey|nonlinear|episodic|frame-narrative",
    "currentAct": 1,
    "totalActs": 3
  },
  "writingStyle": {
    "perspective": "first-person|third-person-limited|third-person-omniscient|second-person",
    "tense": "past|present|mixed",
    "voice": "description of narrative voice"
  },
  "mainConflict": "brief description of central conflict",
  "setting": "description of primary setting",
  "timePeriod": "when the story takes place"
}`;

  const prompt = buildPrompt(defaultPrompt, context.customPrompt);
  const response = await generateWithRetry(model, prompt, 3);
  const storyContext = parseJSONFromResponse(response) as StoryContext;

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
 * Story Knowledge Graph Agent - The Memory
 */
async function executeKnowledgeGraph(
  model: any,
  context: AgentContext
): Promise<{ result: KnowledgeGraphData; updatedContext: AgentContext }> {
  const prompt = `You are the Story Knowledge Graph Agent - the memory of the story system.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

STORY/MANUSCRIPT:
${context.storyBrief}
${context.manuscript ? `\n\nFULL MANUSCRIPT:\n${context.manuscript}` : ''}

YOUR TASK:
Extract ALL story elements and create a comprehensive knowledge graph including:
1. Characters (name, role, traits, motivations, relationships)
2. Locations (name, type, description, significance)
3. Objects (important items, artifacts, tools)
4. Events (key plot points, actions, revelations)
5. Relationships (between characters, including type and strength)
6. Plot Threads (main plot, subplots, their status)

Return ONLY a valid JSON object with this structure:
{
  "characters": [
    {
      "id": "char-1",
      "name": "Character Name",
      "role": "protagonist|antagonist|supporting|minor",
      "description": "brief description",
      "traits": ["trait1", "trait2"],
      "motivations": ["motivation1"],
      "relationships": ["relationship to other characters"],
      "firstAppearance": "Chapter 1",
      "status": "alive|deceased|unknown"
    }
  ],
  "locations": [
    {
      "id": "loc-1",
      "name": "Location Name",
      "type": "city|village|building|natural|other",
      "description": "brief description",
      "significance": "why it matters",
      "connectedLocations": ["loc-2"]
    }
  ],
  "objects": [
    {
      "id": "obj-1",
      "name": "Object Name",
      "type": "weapon|artifact|tool|personal|symbolic",
      "description": "brief description",
      "significance": "plot importance",
      "currentLocation": "where it is",
      "owner": "who has it"
    }
  ],
  "events": [
    {
      "id": "event-1",
      "name": "Event Name",
      "description": "what happened",
      "chapter": 1,
      "timestamp": "when in story time",
      "participants": ["char-1"],
      "location": "loc-1",
      "causedBy": [],
      "effects": ["what resulted"],
      "type": "action|dialogue|revelation|conflict|resolution"
    }
  ],
  "relationships": [
    {
      "id": "rel-1",
      "from": "char-1",
      "to": "char-2",
      "type": "family|romantic|friendship|rivalry|professional|other",
      "description": "nature of relationship",
      "strength": 0.8,
      "evolution": ["how it changed"]
    }
  ],
  "plotThreads": [
    {
      "id": "plot-1",
      "name": "Main Plot Name",
      "description": "what the thread is about",
      "status": "active|resolved|dormant|foreshadowed",
      "startChapter": 1,
      "relatedCharacters": ["char-1"],
      "relatedEvents": ["event-1"]
    }
  ]
}`;

  const response = await generateWithRetry(model, prompt, 3);
  const knowledgeGraph = parseJSONFromResponse(response) as KnowledgeGraphData;

  // Store in Neo4j if available
  try {
    await updateGraph({
      chapterId: 'workflow-analysis',
      chapterNumber: 1,
      summary: context.storyBrief.substring(0, 200),
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
  } catch (error) {
    console.warn('Failed to store in Neo4j (optional):', error);
  }

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
 * Temporal & Causal Reasoning Agent - The Timeline Police
 */
async function executeTemporalReasoning(
  model: any,
  context: AgentContext
): Promise<{ result: TimelineData; updatedContext: AgentContext }> {
  const prompt = `You are the Temporal & Causal Reasoning Agent - the timeline police.

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
6. Assess story duration and pacing

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, no explanations or markdown
- Do NOT truncate the response - complete all arrays fully
- Keep descriptions concise (under 100 words each)
- Limit to 10 most important events if story is long
- Ensure all JSON is properly closed with matching braces

Return ONLY this JSON structure (no markdown code blocks):
{
  "chronologicalEvents": [
    {
      "id": "event-1",
      "name": "Event Name",
      "description": "what happened",
      "chapter": 1,
      "timestamp": "story time (e.g., 'Day 1, Morning')",
      "participants": ["char-1"],
      "location": "loc-1",
      "causedBy": [],
      "effects": ["event-2"],
      "type": "action"
    }
  ],
  "flashbacks": [],
  "flashForwards": [],
  "causalChains": [
    {
      "cause": "event-1",
      "effects": ["event-2"],
      "validated": true
    }
  ],
  "temporalIssues": [],
  "storyDuration": "total time span",
  "narrativePace": "fast|moderate|slow with brief explanation"
}`;

  const response = await generateWithRetry(model, prompt, 3);
  const timeline = parseJSONFromResponse(response) as TimelineData;

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
 * Continuity & Intent Validator - The Editor
 */
async function executeContinuityValidator(
  model: any,
  context: AgentContext
): Promise<{ result: ContinuityReport; updatedContext: AgentContext }> {
  const prompt = `You are the Continuity & Intent Validator - the meticulous editor.

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
6. Provide recommendations

Return ONLY a valid JSON object:
{
  "contradictions": [
    {
      "id": "contra-1",
      "type": "character|location|object|timeline|logic",
      "description": "what contradicts what",
      "locations": ["Chapter 2, page 5", "Chapter 4, page 12"],
      "isIntentional": false
    }
  ],
  "intentionalChoices": ["Description of narrative choices that seem intentional"],
  "errors": [
    {
      "id": "err-1",
      "type": "continuity|logic|character|plot",
      "description": "what the error is",
      "severity": "low|medium|high|critical",
      "suggestion": "how to fix"
    }
  ],
  "warnings": ["Things to watch out for"],
  "continuityScore": 85,
  "recommendations": ["Improvement suggestions"]
}`;

  const response = await generateWithRetry(model, prompt, 3);
  const report = parseJSONFromResponse(response) as ContinuityReport;

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
 * Creative Co-Author Agent - The Muse
 */
async function executeCreativeCoAuthor(
  model: any,
  context: AgentContext
): Promise<{ result: CreativeSuggestions; updatedContext: AgentContext }> {
  const prompt = `You are the Creative Co-Author Agent - the inspiring muse.

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
1. Suggest compelling new scenes
2. Propose plot developments
3. Improve dialogue opportunities
4. Guide character arcs
5. Reinforce themes
6. Offer alternative scenarios

Be creative, specific, and actionable!

Return ONLY a valid JSON object:
{
  "sceneSuggestions": [
    {
      "title": "Scene Title",
      "description": "detailed description of the scene",
      "placement": "where in the story this could go",
      "characters": ["char-1", "char-2"],
      "purpose": "why this scene enhances the story",
      "emotionalBeat": "what emotion this creates"
    }
  ],
  "plotDevelopments": [
    {
      "idea": "the development idea",
      "rationale": "why this would work",
      "impact": "how it affects the story",
      "relatedThreads": ["plot-1"]
    }
  ],
  "dialogueImprovements": [
    {
      "improved": "example of great dialogue",
      "character": "who says it",
      "context": "when/why they say it",
      "reason": "why this dialogue works"
    }
  ],
  "characterArcGuidance": [
    {
      "character": "Character Name",
      "currentStage": "where they are in their arc",
      "nextSteps": ["what should happen next"],
      "emotionalJourney": "description of emotional progression",
      "potentialConflicts": ["internal or external conflicts to explore"]
    }
  ],
  "themeReinforcements": ["ways to strengthen themes"],
  "alternativeScenarios": ["what-if scenarios to consider"]
}`;

  const response = await generateWithRetry(model, prompt, 3);
  const suggestions = parseJSONFromResponse(response) as CreativeSuggestions;

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
 * Intelligent Recall Agent - Ask Your Story
 */
async function executeIntelligentRecall(
  model: any,
  context: AgentContext
): Promise<{ result: RecallAnswer[]; updatedContext: AgentContext }> {
  // Generate insightful queries about the story
  const queryPrompt = `Based on this story knowledge, generate 5 insightful questions a writer might ask:
  
STORY: ${context.storyBrief}
KNOWLEDGE GRAPH: ${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

Return ONLY a JSON array of question strings: ["question1", "question2", ...]`;

  const queriesResponse = await generateWithRetry(model, queryPrompt, 2);
  let queries: string[];
  try {
    queries = parseJSONFromResponse(queriesResponse);
  } catch {
    queries = [
      "What are the key character relationships?",
      "What are the unresolved plot threads?",
      "What are the main conflicts?",
      "How do the themes manifest?",
      "What are potential story weaknesses?"
    ];
  }

  // Answer each query
  const answers: RecallAnswer[] = [];
  
  for (const query of queries.slice(0, 5)) {
    const answerPrompt = `You are the Intelligent Recall Agent - the story's memory.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

KNOWLEDGE GRAPH:
${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

QUESTION: ${query}

Provide a comprehensive answer with references.
Return ONLY a valid JSON object:
{
  "query": "${query}",
  "answer": "detailed answer",
  "confidence": 0.95,
  "references": [
    { "type": "character|event|location|plotThread", "id": "ref-id", "excerpt": "relevant quote or fact" }
  ],
  "relatedInfo": ["additional context"]
}`;

    try {
      const answerResponse = await generateWithRetry(model, answerPrompt, 2);
      const answer = parseJSONFromResponse(answerResponse) as RecallAnswer;
      answers.push(answer);
    } catch (error) {
      answers.push({
        query,
        answer: "Unable to process this query at the moment.",
        confidence: 0,
        references: [],
        relatedInfo: []
      });
    }
  }

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
 * Cinematic Teaser Generator - The Mic-Drop
 */
async function executeCinematicTeaser(
  model: any,
  context: AgentContext
): Promise<{ result: TeaserContent; updatedContext: AgentContext }> {
  const prompt = `You are the Cinematic Teaser Generator - create an epic trailer for this story.

STORY CONTEXT:
${JSON.stringify(context.storyContext || {}, null, 2)}

KNOWLEDGE GRAPH:
${JSON.stringify(context.knowledgeGraph || {}, null, 2)}

STORY:
${context.storyBrief}

YOUR TASK:
Create a cinematic teaser/trailer including:
1. Story essence extraction (hook, mood, key moments)
2. Trailer script with narration
3. Visual prompts for each scene (suitable for AI video generation)
4. Multiple hook lines
5. A memorable tagline

Return ONLY a valid JSON object:
{
  "essence": {
    "genre": "genre description",
    "mainConflict": "the central tension",
    "mood": "overall mood/atmosphere",
    "hook": "the compelling hook",
    "keyMoments": ["moment1", "moment2", "moment3"]
  },
  "teaserScript": {
    "duration": 90,
    "narration": [
      "Opening line...",
      "Building tension...",
      "The reveal...",
      "Final hook..."
    ],
    "structure": ["hook", "world-building", "conflict-tease", "climax-hint", "title-reveal"],
    "musicSuggestion": "type of music that fits",
    "pacing": "description of pacing"
  },
  "visualPrompts": [
    {
      "scene": "opening",
      "prompt": "Detailed visual description for AI generation - be specific about lighting, composition, mood, style",
      "duration": 3,
      "cameraAngle": "wide establishing shot",
      "mood": "mysterious",
      "characters": []
    },
    {
      "scene": "character introduction",
      "prompt": "Detailed visual of main character...",
      "duration": 4,
      "cameraAngle": "medium shot",
      "mood": "determined",
      "characters": ["protagonist"]
    }
  ],
  "hooks": [
    "Intriguing question or statement 1",
    "Intriguing question or statement 2",
    "Intriguing question or statement 3"
  ],
  "tagline": "The memorable one-liner tagline"
}`;

  const response = await generateWithRetry(model, prompt, 3);
  const teaser = parseJSONFromResponse(response) as TeaserContent;

  return {
    result: teaser,
    updatedContext: {
      ...context,
      teaserContent: teaser,
      previousResults: { ...context.previousResults, 'cinematic-teaser': teaser }
    }
  };
}

/**
 * Execute a full workflow with all agents in sequence
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
      console.log(`Executing agent: ${agentType}`);
      const { result, updatedContext } = await executeAgent(agentType, context);
      results[agentType] = result;
      context = updatedContext;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error in ${agentType}:`, error);
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
