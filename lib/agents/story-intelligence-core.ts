/**
 * Story Intelligence Core Agent
 * 
 * Responsibilities:
 * - Accept raw manuscript text (scene or chapter)
 * - Parse text using Gemini to extract entities, relationships, events
 * - Maintain in-memory global context
 * - Track version differences between edits
 * - Output structured JSON payload
 */

import { getFlashModel, parseJSONFromResponse, generateWithRetry } from '@/lib/gemini';

// Types for extracted story elements
export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  role?: string;
  description?: string;
  traits?: string[];
  firstAppearance?: string;
}

export interface Location {
  id: string;
  name: string;
  type?: string;
  description?: string;
  containedIn?: string;
}

export interface StoryObject {
  id: string;
  name: string;
  type?: string;
  description?: string;
  significance?: string;
  owner?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'dialogue' | 'revelation' | 'conflict' | 'resolution' | 'transition';
  characters: string[];
  location?: string;
  timestamp?: string;
  isTemporal?: boolean;
  temporalType?: 'flashback' | 'flashforward' | 'current' | 'memory';
}

export interface Relationship {
  id: string;
  source: string;
  sourceType: 'Character' | 'Location' | 'Object' | 'Event';
  target: string;
  targetType: 'Character' | 'Location' | 'Object' | 'Event';
  type: string;
  description?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'ambiguous';
  strength?: number;
}

export interface StateChange {
  entityId: string;
  entityType: 'Character' | 'Location' | 'Object';
  attribute: string;
  oldValue?: string;
  newValue: string;
  reason?: string;
}

export interface TemporalMarker {
  id: string;
  type: 'flashback' | 'flashforward' | 'timejump' | 'simultaneous';
  description: string;
  fromTime?: string;
  toTime?: string;
  affectedEvents: string[];
}

export interface PlotThread {
  id: string;
  name: string;
  description: string;
  status: 'introduced' | 'developing' | 'climax' | 'resolved' | 'abandoned';
  relatedCharacters: string[];
  relatedEvents: string[];
}

export interface StoryAnalysisResult {
  chapterId: string;
  chapterNumber: number;
  version: number;
  timestamp: string;
  workflowId?: string; // Workflow ID for filtering in Neo4j
  characters: Character[];
  locations: Location[];
  objects: StoryObject[];
  events: Event[];
  relationships: Relationship[];
  stateChanges: StateChange[];
  temporalMarkers: TemporalMarker[];
  plotThreads: PlotThread[];
  summary: string;
  context: GlobalContext;
}

export interface GlobalContext {
  activeCharacters: string[];
  currentLocation: string | null;
  currentTimeline: string;
  recentEvents: string[];
  openPlotThreads: string[];
  mood: string;
  tension: 'low' | 'medium' | 'high' | 'critical';
}

// In-memory context store
class StoryContextManager {
  private globalContext: GlobalContext = {
    activeCharacters: [],
    currentLocation: null,
    currentTimeline: 'present',
    recentEvents: [],
    openPlotThreads: [],
    mood: 'neutral',
    tension: 'low'
  };

  private versionHistory: Map<string, StoryAnalysisResult[]> = new Map();
  private entityRegistry: Map<string, any> = new Map();

  getGlobalContext(): GlobalContext {
    return { ...this.globalContext };
  }

  updateContext(analysis: StoryAnalysisResult): void {
    // Update active characters
    const newCharacters = analysis.characters.map(c => c.id);
    this.globalContext.activeCharacters = [
      ...new Set([...this.globalContext.activeCharacters, ...newCharacters])
    ];

    // Update current location
    if (analysis.locations.length > 0) {
      this.globalContext.currentLocation = analysis.locations[analysis.locations.length - 1].name;
    }

    // Track recent events (keep last 10)
    const newEventIds = analysis.events.map(e => e.id);
    this.globalContext.recentEvents = [
      ...newEventIds,
      ...this.globalContext.recentEvents
    ].slice(0, 10);

    // Update open plot threads
    const activePlots = analysis.plotThreads
      .filter(p => p.status !== 'resolved' && p.status !== 'abandoned')
      .map(p => p.id);
    this.globalContext.openPlotThreads = [
      ...new Set([...this.globalContext.openPlotThreads, ...activePlots])
    ];

    // Check for temporal shifts
    const hasFlashback = analysis.temporalMarkers.some(t => t.type === 'flashback');
    const hasFlashforward = analysis.temporalMarkers.some(t => t.type === 'flashforward');
    if (hasFlashback) {
      this.globalContext.currentTimeline = 'past';
    } else if (hasFlashforward) {
      this.globalContext.currentTimeline = 'future';
    } else {
      this.globalContext.currentTimeline = 'present';
    }

    // Store version history
    const chapterId = analysis.chapterId;
    if (!this.versionHistory.has(chapterId)) {
      this.versionHistory.set(chapterId, []);
    }
    this.versionHistory.get(chapterId)!.push(analysis);

    // Update entity registry
    analysis.characters.forEach(c => this.entityRegistry.set(c.id, { type: 'Character', ...c }));
    analysis.locations.forEach(l => this.entityRegistry.set(l.id, { type: 'Location', ...l }));
    analysis.objects.forEach(o => this.entityRegistry.set(o.id, { type: 'Object', ...o }));
  }

  getVersionDiff(chapterId: string): { additions: any[], removals: any[], modifications: any[] } | null {
    const versions = this.versionHistory.get(chapterId);
    if (!versions || versions.length < 2) return null;

    const prev = versions[versions.length - 2];
    const curr = versions[versions.length - 1];

    const prevCharIds = new Set(prev.characters.map(c => c.id));
    const currCharIds = new Set(curr.characters.map(c => c.id));

    const additions = curr.characters.filter(c => !prevCharIds.has(c.id));
    const removals = prev.characters.filter(c => !currCharIds.has(c.id));
    const modifications = curr.stateChanges;

    return { additions, removals, modifications };
  }

  getEntity(id: string): any | null {
    return this.entityRegistry.get(id) || null;
  }

  getAllEntities(): any[] {
    return Array.from(this.entityRegistry.values());
  }

  getVersionCount(chapterId: string): number {
    const versions = this.versionHistory.get(chapterId);
    return versions ? versions.length : 0;
  }

  reset(): void {
    this.globalContext = {
      activeCharacters: [],
      currentLocation: null,
      currentTimeline: 'present',
      recentEvents: [],
      openPlotThreads: [],
      mood: 'neutral',
      tension: 'low'
    };
    this.versionHistory.clear();
    this.entityRegistry.clear();
  }
}

// ============================================================
// Workflow-scoped context store (prevents data leakage between users)
// ============================================================
interface ContextEntry {
  manager: StoryContextManager;
  lastAccessed: number;
}

const contextStore = new Map<string, ContextEntry>();
const CONTEXT_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const CONTEXT_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Cleanup at most every 10 minutes
let lastContextCleanupTime = 0;

/**
 * Cleanup expired context entries to prevent memory leaks.
 * Called on-demand (serverless-safe, no setInterval).
 */
function cleanupExpiredContexts(): void {
  const now = Date.now();

  // Only run cleanup if enough time has passed since last cleanup
  if (now - lastContextCleanupTime < CONTEXT_CLEANUP_INTERVAL_MS) return;
  lastContextCleanupTime = now;

  let cleanedCount = 0;

  for (const [key, entry] of contextStore.entries()) {
    if ((now - entry.lastAccessed) > CONTEXT_TTL_MS) {
      contextStore.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[StoryContext] Cleaned up ${cleanedCount} expired contexts`);
  }
}

/**
 * Get context manager for a specific workflowId (creates new if not exists)
 */
function getContextManager(workflowId?: string): StoryContextManager {
  // Run on-demand cleanup (serverless-safe replacement for setInterval)
  cleanupExpiredContexts();

  const key = workflowId || 'default';

  let entry = contextStore.get(key);
  if (!entry) {
    entry = {
      manager: new StoryContextManager(),
      lastAccessed: Date.now()
    };
    contextStore.set(key, entry);
  } else {
    entry.lastAccessed = Date.now();
  }

  return entry.manager;
}

/**
 * Reset context for a specific workflow
 */
function resetContextForWorkflow(workflowId?: string): void {
  const key = workflowId || 'default';
  const entry = contextStore.get(key);
  if (entry) {
    entry.manager.reset();
    entry.lastAccessed = Date.now();
  }
}

// Legacy singleton for backward compatibility (deprecated - use getContextManager with workflowId)
const contextManager = getContextManager('legacy_default');

/**
 * Generate a unique ID for entities
 */
function generateId(prefix: string, name: string): string {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${sanitized}_${timestamp}`;
}

/**
 * Analyze manuscript text using Gemini
 */
export async function analyzeManuscript(
  text: string,
  chapterNumber: number,
  existingContext?: GlobalContext,
  workflowId?: string
): Promise<StoryAnalysisResult> {
  const model = getFlashModel();
  const ctxManager = getContextManager(workflowId);
  const context = existingContext || ctxManager.getGlobalContext();

  const prompt = `You are a Story Intelligence Agent analyzing manuscript text. Extract all story elements with precision.

CURRENT GLOBAL CONTEXT:
${JSON.stringify(context, null, 2)}

MANUSCRIPT TEXT:
"""
${text}
"""

Analyze the text and extract the following in valid JSON format:

{
  "characters": [
    {
      "name": "string - character name",
      "aliases": ["any nicknames or alternative names"],
      "role": "protagonist | antagonist | supporting | minor | mentioned",
      "description": "brief physical/personality description",
      "traits": ["personality traits observed"],
      "firstAppearance": "if new character, describe how they're introduced"
    }
  ],
  "locations": [
    {
      "name": "string - location name",
      "type": "interior | exterior | abstract | transitional",
      "description": "setting description",
      "containedIn": "parent location if applicable"
    }
  ],
  "objects": [
    {
      "name": "string - object name",
      "type": "prop | macguffin | symbolic | weapon | vehicle | document",
      "description": "object description",
      "significance": "why this object matters to the story",
      "owner": "character who owns/possesses it"
    }
  ],
  "events": [
    {
      "name": "short event title",
      "description": "what happens",
      "type": "action | dialogue | revelation | conflict | resolution | transition",
      "characters": ["involved character names"],
      "location": "where it happens",
      "isTemporal": false,
      "temporalType": "current | flashback | flashforward | memory"
    }
  ],
  "relationships": [
    {
      "source": "entity name",
      "sourceType": "Character | Location | Object | Event",
      "target": "entity name",
      "targetType": "Character | Location | Object | Event",
      "type": "relationship type (e.g., loves, hates, owns, located_at, causes, prevents)",
      "description": "relationship context",
      "sentiment": "positive | negative | neutral | ambiguous",
      "strength": 0.0-1.0
    }
  ],
  "stateChanges": [
    {
      "entityName": "character/location/object name",
      "entityType": "Character | Location | Object",
      "attribute": "what changed (emotion, status, possession, etc.)",
      "oldValue": "previous state if known",
      "newValue": "new state",
      "reason": "why the change occurred"
    }
  ],
  "temporalMarkers": [
    {
      "type": "flashback | flashforward | timejump | simultaneous",
      "description": "what temporal shift occurs",
      "fromTime": "origin time period",
      "toTime": "destination time period",
      "affectedEvents": ["event names affected by this temporal marker"]
    }
  ],
  "plotThreads": [
    {
      "name": "plot thread name",
      "description": "what this subplot/thread is about",
      "status": "introduced | developing | climax | resolved | abandoned",
      "relatedCharacters": ["character names"],
      "relatedEvents": ["event names"]
    }
  ],
  "summary": "A 2-3 sentence summary of this scene/chapter",
  "mood": "overall emotional tone (e.g., tense, romantic, mysterious, action-packed)",
  "tension": "low | medium | high | critical"
}

IMPORTANT:
- Extract EVERY character mentioned, even if just named
- Identify ALL relationships, explicit and implied
- Note temporal shifts carefully (flashbacks, flash-forwards)
- Track state changes for character development
- Be thorough but precise - only extract what's actually in the text
- Return ONLY valid JSON, no markdown code blocks`;

  const responseText = await generateWithRetry(model, prompt);
  const parsed = parseJSONFromResponse(responseText);

  // Generate IDs for all entities
  const chapterId = `chapter_${chapterNumber}_${Date.now().toString(36)}`;

  const characters: Character[] = (parsed.characters || []).map((c: any) => ({
    ...c,
    id: generateId('char', c.name)
  }));

  const locations: Location[] = (parsed.locations || []).map((l: any) => ({
    ...l,
    id: generateId('loc', l.name)
  }));

  const objects: StoryObject[] = (parsed.objects || []).map((o: any) => ({
    ...o,
    id: generateId('obj', o.name)
  }));

  const events: Event[] = (parsed.events || []).map((e: any) => ({
    ...e,
    id: generateId('evt', e.name)
  }));

  const relationships: Relationship[] = (parsed.relationships || []).map((r: any, i: number) => ({
    ...r,
    id: `rel_${i}_${Date.now().toString(36)}`
  }));

  const stateChanges: StateChange[] = (parsed.stateChanges || []).map((s: any) => ({
    entityId: generateId(s.entityType.toLowerCase().slice(0, 4), s.entityName),
    entityType: s.entityType,
    attribute: s.attribute,
    oldValue: s.oldValue,
    newValue: s.newValue,
    reason: s.reason
  }));

  const temporalMarkers: TemporalMarker[] = (parsed.temporalMarkers || []).map((t: any, i: number) => ({
    ...t,
    id: `temp_${i}_${Date.now().toString(36)}`,
    affectedEvents: t.affectedEvents || []
  }));

  const plotThreads: PlotThread[] = (parsed.plotThreads || []).map((p: any) => ({
    ...p,
    id: generateId('plot', p.name),
    relatedCharacters: p.relatedCharacters || [],
    relatedEvents: p.relatedEvents || []
  }));

  // Get existing version count
  const version = ctxManager.getVersionCount(chapterId) + 1;

  const result: StoryAnalysisResult = {
    chapterId,
    chapterNumber,
    version,
    timestamp: new Date().toISOString(),
    characters,
    locations,
    objects,
    events,
    relationships,
    stateChanges,
    temporalMarkers,
    plotThreads,
    summary: parsed.summary || '',
    context: {
      ...context,
      mood: parsed.mood || 'neutral',
      tension: parsed.tension || 'low'
    }
  };

  // Update global context
  ctxManager.updateContext(result);

  return result;
}

/**
 * Get the current global context for a workflow
 */
export function getGlobalContext(workflowId?: string): GlobalContext {
  return getContextManager(workflowId).getGlobalContext();
}

/**
 * Reset the context manager for a workflow
 */
export function resetContext(workflowId?: string): void {
  resetContextForWorkflow(workflowId);
}

/**
 * Get version differences for a chapter
 */
export function getVersionDiff(chapterId: string, workflowId?: string) {
  return getContextManager(workflowId).getVersionDiff(chapterId);
}

// Legacy export for backward compatibility (deprecated)
export { contextManager, getContextManager, resetContextForWorkflow };
