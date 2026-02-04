/**
 * Agent Executor - Unified execution engine for all Story Intelligence agents
 * Uses Gemini API for intelligent processing with specialized prompts per agent
 */

import { getReasoningModel, getKnowledgeGraphModel, generateWithRetry, parseJSONFromResponse } from '@/lib/gemini';
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
  workflowId?: string; // Workflow ID for Neo4j storage
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
      // Use dedicated Gemini 2.5 Pro model with higher token limits for comprehensive graph extraction
      const kgModel = getKnowledgeGraphModel();
      return executeKnowledgeGraph(kgModel, context);
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
  const prompt = `You are the Story Knowledge Graph Agent - the comprehensive memory system for narrative analysis.

STORY/MANUSCRIPT TO ANALYZE:
${context.storyBrief}
${context.manuscript ? `\n\nFULL MANUSCRIPT:\n${context.manuscript}` : ''}

YOUR MISSION: Extract ALL story elements and create a complete knowledge graph.

EXTRACTION REQUIREMENTS:
1. CHARACTERS: Extract EVERY named character with their role, personality traits, motivations, and current status
2. LOCATIONS: Extract ALL named places, buildings, cities, and geographic locations
3. OBJECTS: Extract important items, artifacts, keys, documents, or symbolic objects
4. EVENTS: Extract major plot events, revelations, confrontations, and turning points (up to 20)
5. RELATIONSHIPS: Map connections between characters (family, romantic, professional, rivalry, etc.)
6. PLOT THREADS: Identify main plot and all subplots

CRITICAL RULES:
- Return ONLY valid JSON - no markdown code blocks, no explanations before or after
- Ensure the JSON is complete with all closing braces and brackets
- Use descriptive IDs like "char-arjun-malhotra" not just "char-1"
- Include all details from the text

Return this JSON structure:
{
  "characters": [
    {
      "id": "char-character-name",
      "name": "Full Character Name",
      "role": "protagonist|antagonist|supporting|minor",
      "description": "Who they are and their role in the story",
      "traits": ["personality trait 1", "personality trait 2"],
      "motivations": ["what drives them", "their goals"],
      "relationships": ["relationship description to other characters"],
      "firstAppearance": "Chapter X",
      "status": "alive|deceased|unknown|unstable"
    }
  ],
  "locations": [
    {
      "id": "loc-location-name",
      "name": "Location Name",
      "type": "city|building|room|natural|complex|other",
      "description": "Description of the place",
      "significance": "Why this location matters to the plot",
      "connectedLocations": ["loc-other-location"]
    }
  ],
  "objects": [
    {
      "id": "obj-object-name",
      "name": "Object Name",
      "type": "artifact|tool|document|key|symbolic|weapon|technology",
      "description": "What the object is",
      "significance": "Why it matters to the plot",
      "currentLocation": "Where it currently is",
      "owner": "Who possesses it"
    }
  ],
  "events": [
    {
      "id": "event-descriptive-name",
      "name": "Event Name",
      "description": "What happened in detail",
      "chapter": 1,
      "timestamp": "When in story time (e.g., 'Day 1, Morning', 'Seven years ago')",
      "participants": ["char-character-name"],
      "location": "loc-location-name",
      "causedBy": ["event-previous"],
      "effects": ["What resulted from this event"],
      "type": "action|dialogue|revelation|conflict|resolution|mystery"
    }
  ],
  "relationships": [
    {
      "id": "rel-descriptive",
      "from": "char-character-a",
      "to": "char-character-b",
      "type": "family|romantic|friendship|rivalry|professional|mysterious|antagonistic",
      "description": "Nature of their relationship",
      "strength": 0.8,
      "evolution": ["How it has changed"]
    }
  ],
  "plotThreads": [
    {
      "id": "plot-thread-name",
      "name": "Plot Thread Name",
      "description": "What this storyline is about",
      "status": "active|resolved|dormant|foreshadowed",
      "startChapter": 1,
      "relatedCharacters": ["char-character-name"],
      "relatedEvents": ["event-name"]
    }
  ]
}

Analyze the manuscript thoroughly and return the complete JSON:`;

  const response = await generateWithRetry(model, prompt, 3);
  const knowledgeGraph = parseJSONFromResponse(response) as KnowledgeGraphData;

  // Ensure arrays exist even if parsing partially failed
  const safeKnowledgeGraph: KnowledgeGraphData = {
    characters: knowledgeGraph.characters || [],
    locations: knowledgeGraph.locations || [],
    objects: knowledgeGraph.objects || [],
    events: knowledgeGraph.events || [],
    relationships: knowledgeGraph.relationships || [],
    plotThreads: knowledgeGraph.plotThreads || []
  };

  // Log extraction results for debugging
  console.log('Knowledge Graph extraction results:', {
    characters: safeKnowledgeGraph.characters.length,
    locations: safeKnowledgeGraph.locations.length,
    objects: safeKnowledgeGraph.objects.length,
    events: safeKnowledgeGraph.events.length,
    relationships: safeKnowledgeGraph.relationships.length,
    plotThreads: safeKnowledgeGraph.plotThreads.length,
    parseError: (knowledgeGraph as any)._parseError || false
  });

  // Store in Neo4j if we have any data
  const hasData = safeKnowledgeGraph.characters.length > 0 || 
                  safeKnowledgeGraph.locations.length > 0 || 
                  safeKnowledgeGraph.events.length > 0;

  if (hasData) {
    try {
      // Use workflowId as the chapterId to uniquely identify this workflow's data
      const chapterId = context.workflowId ? `workflow-${context.workflowId}` : 'workflow-analysis';
      
      const storeResult = await updateGraph({
        chapterId: chapterId,
        chapterNumber: 1,
        summary: context.storyBrief.substring(0, 200),
        workflowId: context.workflowId, // Pass workflowId for filtering
        characters: safeKnowledgeGraph.characters,
        locations: safeKnowledgeGraph.locations,
        objects: safeKnowledgeGraph.objects,
        events: safeKnowledgeGraph.events.map(e => ({
          ...e,
          characters: e.participants || [],
          type: e.type || 'action'
        })),
        relationships: safeKnowledgeGraph.relationships.map(r => ({
          id: r.id,
          source: r.from,
          sourceType: 'Character' as const,
          target: r.to,
          targetType: 'Character' as const,
          type: r.type,
          description: r.description,
          strength: r.strength
        })),
        plotThreads: safeKnowledgeGraph.plotThreads.map(p => ({
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
          activeCharacters: safeKnowledgeGraph.characters.map(c => c.name),
          currentLocation: safeKnowledgeGraph.locations[0]?.name || null,
          currentTimeline: 'present',
          recentEvents: safeKnowledgeGraph.events.slice(0, 5).map(e => e.name),
          openPlotThreads: safeKnowledgeGraph.plotThreads.filter(p => p.status === 'active').map(p => p.name),
          mood: 'neutral',
          tension: 'medium' as const
        }
      });
      console.log('Neo4j storage result:', storeResult);
    } catch (error) {
      console.warn('Failed to store in Neo4j (optional):', error);
    }
  } else {
    console.warn('No knowledge graph data to store - AI response may have been truncated');
  }

  return {
    result: safeKnowledgeGraph,
    updatedContext: {
      ...context,
      knowledgeGraph: safeKnowledgeGraph,
      previousResults: { ...context.previousResults, 'knowledge-graph': safeKnowledgeGraph }
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
  // Extract key story elements for context
  const storyContext = context.storyContext || {};
  const knowledgeGraph = context.knowledgeGraph || {};
  const characters = knowledgeGraph.characters || storyContext.characters || [];
  const locations = knowledgeGraph.locations || storyContext.locations || [];
  const themes = storyContext.themes || knowledgeGraph.themes || [];
  
  const prompt = `You are the Cinematic Teaser Generator - create an epic, story-specific trailer for this story.

CRITICAL: Your visual prompts MUST be specific to THIS story's characters, locations, and events. NO generic prompts!

=== STORY BRIEF ===
${context.storyBrief}

=== STORY CONTEXT ===
${JSON.stringify(storyContext, null, 2)}

=== KNOWLEDGE GRAPH DATA ===
Characters: ${JSON.stringify(characters, null, 2)}
Locations: ${JSON.stringify(locations, null, 2)}
Themes: ${JSON.stringify(themes, null, 2)}
Full Graph: ${JSON.stringify(knowledgeGraph, null, 2)}

=== YOUR TASK ===
Create a STORY-SPECIFIC cinematic teaser/trailer that:
1. Uses ACTUAL character names, locations, and events from the story
2. Creates visual prompts that capture THIS story's unique atmosphere
3. Includes specific details like character appearance, setting details, emotional beats
4. Suggests appropriate tones and moods based on the story's genre

=== OUTPUT FORMAT ===
Return ONLY a valid JSON object:
{
  "essence": {
    "genre": "specific genre (e.g., 'Sci-Fi Thriller with time-travel elements')",
    "mainConflict": "the specific central conflict from THIS story",
    "mood": "overall mood based on story content",
    "hook": "a hook using story-specific elements",
    "keyMoments": ["specific moment 1 from story", "specific moment 2", "specific moment 3"],
    "tone": {
      "visual": "dark and atmospheric / bright and hopeful / gritty realistic / etc.",
      "emotional": "tension-building / heartwarming / suspenseful / etc.",
      "pacing": "slow burn / fast-paced / building crescendo"
    }
  },
  "teaserScript": {
    "duration": 90,
    "narration": [
      "Opening line referencing story element...",
      "Line introducing specific character/conflict...",
      "Building to story-specific climax...",
      "Final hook with story element..."
    ],
    "structure": ["hook", "world-building", "conflict-tease", "climax-hint", "title-reveal"],
    "musicSuggestion": {
      "genre": "orchestral/electronic/acoustic/etc.",
      "mood": "specific mood description",
      "reference": "similar to [reference track/composer]"
    },
    "pacing": "detailed pacing description matching story tone"
  },
  "visualPrompts": [
    {
      "scene": "SPECIFIC scene name from story (e.g., 'Maya discovers the time portal in her lab')",
      "prompt": "DETAILED visual: [Character name] in [specific location], [specific action]. Lighting: [type]. Mood: [emotion]. Style: cinematic [genre] aesthetic. Camera: [angle]. Include: [specific story details like costume, props, environment details]",
      "duration": 3,
      "cameraAngle": "specific camera angle (wide establishing / close-up / tracking / etc.)",
      "mood": "specific emotional mood",
      "tone": "visual tone (warm, cold, desaturated, vibrant, etc.)",
      "characters": ["actual character names from story"],
      "location": "specific location from story",
      "action": "what is happening in this moment",
      "storyContext": "why this moment matters to the story"
    }
  ],
  "hooks": [
    "Story-specific intriguing question using character/plot element",
    "Another hook referencing story conflict",
    "Hook that teases story mystery/climax"
  ],
  "tagline": "Memorable one-liner specific to THIS story's theme",
  "creativeSuggestions": {
    "alternativeTones": [
      {"tone": "darker version", "description": "how to make it more intense"},
      {"tone": "lighter version", "description": "how to make it more accessible"}
    ],
    "visualStyles": [
      {"style": "style name", "description": "how it would change the feel"}
    ],
    "targetAudience": "who this teaser appeals to"
  }
}

IMPORTANT RULES:
1. Every visual prompt MUST reference ACTUAL characters/locations from the story
2. Scene names should describe WHAT HAPPENS, not generic labels
3. Prompts should be detailed enough for AI video generation (50-100 words each)
4. Include character emotions, lighting, atmosphere, camera work
5. Suggestions should help the writer visualize and refine their vision`;

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
