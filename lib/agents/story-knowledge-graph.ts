/**
 * Story Knowledge Graph Agent
 * 
 * Responsibilities:
 * - Receive structured updates from Story Intelligence Core
 * - Store story memory in Neo4j
 * - Implement node types: Character, Location, Object, Event, PlotThread, Chapter
 * - Implement relationship types: RELATES_TO, AT, OWNS, INVOLVES, OCCURS_IN, ADVANCES
 * - Implement temporal state tracking using State nodes
 * - Never overwrite state; always append new state nodes
 */

import { runQuery, runWriteTransaction, initializeSchema, getSession } from '@/lib/neo4j';
import type {
  StoryAnalysisResult,
  Character,
  Location,
  StoryObject,
  Event,
  Relationship,
  PlotThread,
  StateChange,
  TemporalMarker
} from './story-intelligence-core';

// Graph node types for visualization
export interface GraphNode {
  id: string;
  label: string;
  type: 'Character' | 'Location' | 'Object' | 'Event' | 'PlotThread' | 'Chapter' | 'State';
  properties: Record<string, any>;
  color?: string;
  size?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Color mapping for node types
const NODE_COLORS: Record<string, string> = {
  Character: '#8B5CF6',     // Purple
  Location: '#10B981',      // Emerald
  Object: '#F59E0B',        // Amber
  Event: '#EF4444',         // Red
  PlotThread: '#EC4899',    // Pink
  Chapter: '#3B82F6',       // Blue
  State: '#6B7280',         // Gray
};

const NODE_SIZES: Record<string, number> = {
  Character: 12,
  Location: 10,
  Object: 6,
  Event: 8,
  PlotThread: 10,
  Chapter: 14,
  State: 4,
};

/**
 * Initialize the Neo4j schema
 */
export async function initializeGraphSchema(): Promise<void> {
  await initializeSchema();
}

/**
 * Store a chapter in the graph
 */
async function storeChapter(analysis: StoryAnalysisResult): Promise<void> {
  await runWriteTransaction(async (tx) => {
    await tx.run(`
      MERGE (ch:Chapter { id: $id })
      SET ch.number = $number,
          ch.version = $version,
          ch.timestamp = $timestamp,
          ch.summary = $summary,
          ch.mood = $mood,
          ch.tension = $tension,
          ch.workflowId = $workflowId
    `, {
      id: analysis.chapterId,
      number: analysis.chapterNumber,
      version: analysis.version,
      timestamp: analysis.timestamp,
      summary: analysis.summary,
      mood: analysis.context.mood,
      tension: analysis.context.tension,
      workflowId: analysis.workflowId || null
    });
  });
}

/**
 * Store characters in the graph
 */
async function storeCharacters(characters: Character[], chapterId: string, version: number, workflowId?: string): Promise<void> {
  for (const char of characters) {
    await runWriteTransaction(async (tx) => {
      // Create or merge character node with workflowId
      await tx.run(`
        MERGE (c:Character { id: $id })
        SET c.name = $name,
            c.role = $role,
            c.description = $description,
            c.workflowId = $workflowId,
            c.lastUpdated = datetime()
        WITH c
        MATCH (ch:Chapter { id: $chapterId })
        MERGE (c)-[:APPEARS_IN]->(ch)
      `, {
        id: char.id,
        name: char.name,
        role: char.role || 'unknown',
        description: char.description || '',
        chapterId,
        workflowId: workflowId || null
      });

      // Create state node for temporal tracking (append, never overwrite)
      const stateId = `state_${char.id}_v${version}_${Date.now()}`;
      await tx.run(`
        MATCH (c:Character { id: $charId })
        CREATE (s:State {
          id: $stateId,
          version: $version,
          chapter: $chapterId,
          traits: $traits,
          aliases: $aliases,
          timestamp: datetime()
        })
        CREATE (c)-[:HAS_STATE]->(s)
      `, {
        charId: char.id,
        stateId,
        version,
        chapterId,
        traits: char.traits || [],
        aliases: char.aliases || []
      });
    });
  }
}

/**
 * Store locations in the graph
 */
async function storeLocations(locations: Location[], chapterId: string, workflowId?: string): Promise<void> {
  for (const loc of locations) {
    await runWriteTransaction(async (tx) => {
      await tx.run(`
        MERGE (l:Location { id: $id })
        SET l.name = $name,
            l.type = $type,
            l.description = $description,
            l.workflowId = $workflowId,
            l.lastUpdated = datetime()
        WITH l
        MATCH (ch:Chapter { id: $chapterId })
        MERGE (l)-[:FEATURED_IN]->(ch)
      `, {
        id: loc.id,
        name: loc.name,
        type: loc.type || 'unknown',
        description: loc.description || '',
        chapterId,
        workflowId: workflowId || null
      });

      // Handle containment relationships
      if (loc.containedIn) {
        await tx.run(`
          MATCH (l:Location { id: $locId })
          MATCH (parent:Location { name: $parentName })
          MERGE (l)-[:CONTAINED_IN]->(parent)
        `, {
          locId: loc.id,
          parentName: loc.containedIn
        });
      }
    });
  }
}

/**
 * Store objects in the graph
 */
async function storeObjects(objects: StoryObject[], chapterId: string, workflowId?: string): Promise<void> {
  for (const obj of objects) {
    await runWriteTransaction(async (tx) => {
      await tx.run(`
        MERGE (o:Object { id: $id })
        SET o.name = $name,
            o.type = $type,
            o.description = $description,
            o.significance = $significance,
            o.workflowId = $workflowId,
            o.lastUpdated = datetime()
        WITH o
        MATCH (ch:Chapter { id: $chapterId })
        MERGE (o)-[:APPEARS_IN]->(ch)
      `, {
        id: obj.id,
        name: obj.name,
        type: obj.type || 'prop',
        description: obj.description || '',
        significance: obj.significance || '',
        chapterId,
        workflowId: workflowId || null
      });

      // Handle ownership
      if (obj.owner) {
        await tx.run(`
          MATCH (o:Object { id: $objId })
          MATCH (c:Character { name: $ownerName })
          MERGE (c)-[:OWNS]->(o)
        `, {
          objId: obj.id,
          ownerName: obj.owner
        });
      }
    });
  }
}

/**
 * Store events in the graph
 */
async function storeEvents(events: Event[], chapterId: string, workflowId?: string): Promise<void> {
  for (const evt of events) {
    await runWriteTransaction(async (tx) => {
      await tx.run(`
        MERGE (e:Event { id: $id })
        SET e.name = $name,
            e.description = $description,
            e.type = $type,
            e.isTemporal = $isTemporal,
            e.temporalType = $temporalType,
            e.timestamp = $timestamp,
            e.workflowId = $workflowId,
            e.lastUpdated = datetime()
        WITH e
        MATCH (ch:Chapter { id: $chapterId })
        MERGE (e)-[:OCCURS_IN]->(ch)
      `, {
        id: evt.id,
        name: evt.name,
        description: evt.description,
        type: evt.type,
        isTemporal: evt.isTemporal || false,
        temporalType: evt.temporalType || 'current',
        timestamp: evt.timestamp || '',
        chapterId,
        workflowId: workflowId || null
      });

      // Link event to location
      if (evt.location) {
        await tx.run(`
          MATCH (e:Event { id: $evtId })
          MATCH (l:Location { name: $locName })
          MERGE (e)-[:AT]->(l)
        `, {
          evtId: evt.id,
          locName: evt.location
        });
      }

      // Link event to characters
      for (const charName of evt.characters) {
        await tx.run(`
          MATCH (e:Event { id: $evtId })
          MATCH (c:Character { name: $charName })
          MERGE (e)-[:INVOLVES]->(c)
        `, {
          evtId: evt.id,
          charName
        });
      }
    });
  }
}

/**
 * Store plot threads in the graph
 */
async function storePlotThreads(plotThreads: PlotThread[], chapterId: string, workflowId?: string): Promise<void> {
  for (const plot of plotThreads) {
    await runWriteTransaction(async (tx) => {
      await tx.run(`
        MERGE (p:PlotThread { id: $id })
        SET p.name = $name,
            p.description = $description,
            p.status = $status,
            p.workflowId = $workflowId,
            p.lastUpdated = datetime()
        WITH p
        MATCH (ch:Chapter { id: $chapterId })
        MERGE (p)-[:ADVANCES_IN]->(ch)
      `, {
        id: plot.id,
        name: plot.name,
        description: plot.description,
        status: plot.status,
        chapterId,
        workflowId: workflowId || null
      });

      // Link to related characters
      for (const charName of plot.relatedCharacters) {
        await tx.run(`
          MATCH (p:PlotThread { id: $plotId })
          MATCH (c:Character { name: $charName })
          MERGE (c)-[:ADVANCES]->(p)
        `, {
          plotId: plot.id,
          charName
        });
      }
    });
  }
}

/**
 * Store relationships in the graph
 */
async function storeRelationships(relationships: Relationship[]): Promise<void> {
  for (const rel of relationships) {
    await runWriteTransaction(async (tx) => {
      // Dynamic relationship creation based on types
      const query = `
        MATCH (source:${rel.sourceType} { name: $sourceName })
        MATCH (target:${rel.targetType} { name: $targetName })
        MERGE (source)-[r:RELATES_TO { type: $relType }]->(target)
        SET r.description = $description,
            r.sentiment = $sentiment,
            r.strength = $strength,
            r.lastUpdated = datetime()
      `;

      try {
        await tx.run(query, {
          sourceName: rel.source,
          targetName: rel.target,
          relType: rel.type,
          description: rel.description || '',
          sentiment: rel.sentiment || 'neutral',
          strength: rel.strength || 0.5
        });
      } catch (error) {
        console.warn(`Could not create relationship: ${rel.source} -> ${rel.target}`);
      }
    });
  }
}

/**
 * Store state changes with temporal tracking
 */
async function storeStateChanges(stateChanges: StateChange[], chapterId: string, version: number): Promise<void> {
  for (const change of stateChanges) {
    await runWriteTransaction(async (tx) => {
      const stateId = `change_${change.entityId}_${change.attribute}_v${version}_${Date.now()}`;

      await tx.run(`
        MATCH (entity:${change.entityType} { id: $entityId })
        CREATE (s:State {
          id: $stateId,
          attribute: $attribute,
          oldValue: $oldValue,
          newValue: $newValue,
          reason: $reason,
          chapter: $chapterId,
          version: $version,
          timestamp: datetime()
        })
        CREATE (entity)-[:HAS_STATE_CHANGE]->(s)
      `, {
        entityId: change.entityId,
        stateId,
        attribute: change.attribute,
        oldValue: change.oldValue || '',
        newValue: change.newValue,
        reason: change.reason || '',
        chapterId,
        version
      });
    });
  }
}

/**
 * Update the graph with story analysis results
 */
export async function updateGraph(analysis: StoryAnalysisResult, replaceGraph: boolean = false): Promise<{ success: boolean; message: string }> {
  try {
    const workflowId = analysis.workflowId;

    // If replaceGraph is true, clear existing graph data for this workflow
    if (replaceGraph && workflowId) {
      await clearGraph(workflowId);
    }

    // Store in sequence to maintain data integrity
    await storeChapter(analysis);
    await storeCharacters(analysis.characters, analysis.chapterId, analysis.version, workflowId);
    await storeLocations(analysis.locations, analysis.chapterId, workflowId);
    await storeObjects(analysis.objects, analysis.chapterId, workflowId);
    await storeEvents(analysis.events, analysis.chapterId, workflowId);
    await storePlotThreads(analysis.plotThreads, analysis.chapterId, workflowId);
    await storeRelationships(analysis.relationships);
    await storeStateChanges(analysis.stateChanges, analysis.chapterId, analysis.version);

    return {
      success: true,
      message: `Successfully ${replaceGraph ? 'replaced' : 'updated'} graph with ${analysis.characters.length} characters, ${analysis.locations.length} locations, ${analysis.events.length} events for workflow ${workflowId || 'unknown'}`
    };
  } catch (error) {
    console.error('Failed to update graph:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update graph'
    };
  }
}

/**
 * Get graph overview - all nodes and edges, optionally filtered by workflowId
 */
export async function getGraphOverview(workflowId?: string): Promise<GraphData> {
  try {
    const session = getSession();

    try {
      // Build query based on whether we're filtering by workflowId
      let nodesQuery: string;
      let nodesParams: Record<string, any> = {};

      if (workflowId) {
        // Filter by workflowId - only get nodes belonging to this workflow
        nodesQuery = `
          MATCH (n)
          WHERE (n:Character OR n:Location OR n:Object OR n:Event OR n:PlotThread OR n:Chapter)
          AND (n.workflowId = $workflowId OR n.id STARTS WITH 'workflow-' + $workflowId)
          RETURN n, labels(n) as labels
        `;
        nodesParams = { workflowId };
      } else {
        // Get all nodes
        nodesQuery = `
          MATCH (n)
          WHERE n:Character OR n:Location OR n:Object OR n:Event OR n:PlotThread OR n:Chapter
          RETURN n, labels(n) as labels
        `;
      }

      const nodesResult = await session.run(nodesQuery, nodesParams);

      const nodes: GraphNode[] = nodesResult.records.map(record => {
        const node = record.get('n');
        const labels = record.get('labels') as string[];
        const type = labels.find(l => ['Character', 'Location', 'Object', 'Event', 'PlotThread', 'Chapter'].includes(l)) || 'Unknown';

        return {
          id: node.properties.id,
          label: node.properties.name || node.properties.id,
          type: type as GraphNode['type'],
          properties: { ...node.properties },
          color: NODE_COLORS[type] || '#6B7280',
          size: NODE_SIZES[type] || 6
        };
      });

      // Get node IDs for filtering edges
      const nodeIds = nodes.map(n => n.id);

      // Get relationships between the filtered nodes
      let edgesQuery: string;
      let edgesParams: Record<string, any> = {};

      if (workflowId && nodeIds.length > 0) {
        edgesQuery = `
          MATCH (a)-[r]->(b)
          WHERE a.id IN $nodeIds AND b.id IN $nodeIds
          RETURN a.id as sourceId, b.id as targetId, type(r) as relType, properties(r) as props
        `;
        edgesParams = { nodeIds };
      } else if (!workflowId) {
        edgesQuery = `
          MATCH (a)-[r]->(b)
          WHERE (a:Character OR a:Location OR a:Object OR a:Event OR a:PlotThread OR a:Chapter)
          AND (b:Character OR b:Location OR b:Object OR b:Event OR b:PlotThread OR b:Chapter)
          RETURN a.id as sourceId, b.id as targetId, type(r) as relType, properties(r) as props
        `;
      } else {
        // No nodes found for this workflow
        return { nodes: [], edges: [] };
      }

      const edgesResult = await session.run(edgesQuery, edgesParams);

      const edges: GraphEdge[] = edgesResult.records.map((record, index) => {
        const relType = record.get('relType');
        const props = record.get('props') || {};

        return {
          id: `edge_${index}`,
          source: record.get('sourceId'),
          target: record.get('targetId'),
          type: relType,
          label: props.type || relType,
          properties: props
        };
      });

      return { nodes, edges };
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Failed to get graph overview:', error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Get graph filtered by chapter
 */
export async function getGraphByChapter(chapterNumber: number): Promise<GraphData> {
  try {
    const session = getSession();

    try {
      // Get chapter and all connected nodes
      const result = await session.run(`
        MATCH (ch:Chapter { number: $chapterNumber })
        OPTIONAL MATCH (c:Character)-[:APPEARS_IN]->(ch)
        OPTIONAL MATCH (l:Location)-[:FEATURED_IN]->(ch)
        OPTIONAL MATCH (e:Event)-[:OCCURS_IN]->(ch)
        OPTIONAL MATCH (p:PlotThread)-[:ADVANCES_IN]->(ch)
        OPTIONAL MATCH (o:Object)-[:APPEARS_IN]->(ch)
        WITH ch, 
             collect(DISTINCT c) as chars, 
             collect(DISTINCT l) as locs, 
             collect(DISTINCT e) as evts,
             collect(DISTINCT p) as plots,
             collect(DISTINCT o) as objs
        RETURN ch, chars, locs, evts, plots, objs
      `, { chapterNumber });

      const nodes: GraphNode[] = [];
      const nodeIds = new Set<string>();

      if (result.records.length > 0) {
        const record = result.records[0];

        // Add chapter node
        const ch = record.get('ch');
        if (ch) {
          nodes.push({
            id: ch.properties.id,
            label: `Chapter ${ch.properties.number}`,
            type: 'Chapter',
            properties: { ...ch.properties },
            color: NODE_COLORS.Chapter,
            size: NODE_SIZES.Chapter
          });
          nodeIds.add(ch.properties.id);
        }

        // Add characters
        for (const c of record.get('chars')) {
          if (c && !nodeIds.has(c.properties.id)) {
            nodes.push({
              id: c.properties.id,
              label: c.properties.name,
              type: 'Character',
              properties: { ...c.properties },
              color: NODE_COLORS.Character,
              size: NODE_SIZES.Character
            });
            nodeIds.add(c.properties.id);
          }
        }

        // Add locations
        for (const l of record.get('locs')) {
          if (l && !nodeIds.has(l.properties.id)) {
            nodes.push({
              id: l.properties.id,
              label: l.properties.name,
              type: 'Location',
              properties: { ...l.properties },
              color: NODE_COLORS.Location,
              size: NODE_SIZES.Location
            });
            nodeIds.add(l.properties.id);
          }
        }

        // Add events
        for (const e of record.get('evts')) {
          if (e && !nodeIds.has(e.properties.id)) {
            nodes.push({
              id: e.properties.id,
              label: e.properties.name,
              type: 'Event',
              properties: { ...e.properties },
              color: NODE_COLORS.Event,
              size: NODE_SIZES.Event
            });
            nodeIds.add(e.properties.id);
          }
        }

        // Add plot threads
        for (const p of record.get('plots')) {
          if (p && !nodeIds.has(p.properties.id)) {
            nodes.push({
              id: p.properties.id,
              label: p.properties.name,
              type: 'PlotThread',
              properties: { ...p.properties },
              color: NODE_COLORS.PlotThread,
              size: NODE_SIZES.PlotThread
            });
            nodeIds.add(p.properties.id);
          }
        }

        // Add objects
        for (const o of record.get('objs')) {
          if (o && !nodeIds.has(o.properties.id)) {
            nodes.push({
              id: o.properties.id,
              label: o.properties.name,
              type: 'Object',
              properties: { ...o.properties },
              color: NODE_COLORS.Object,
              size: NODE_SIZES.Object
            });
            nodeIds.add(o.properties.id);
          }
        }
      }

      // Get edges between these nodes
      const edgeNodeIds = Array.from(nodeIds);
      const edgesResult = await session.run(`
        MATCH (a)-[r]->(b)
        WHERE a.id IN $nodeIds AND b.id IN $nodeIds
        RETURN a.id as sourceId, b.id as targetId, type(r) as relType, properties(r) as props
      `, { nodeIds: edgeNodeIds });

      const edges: GraphEdge[] = edgesResult.records.map((record, index) => ({
        id: `edge_${index}`,
        source: record.get('sourceId'),
        target: record.get('targetId'),
        type: record.get('relType'),
        label: record.get('props')?.type || record.get('relType'),
        properties: record.get('props') || {}
      }));

      return { nodes, edges };
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Failed to get graph by chapter:', error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Get all chapters from the graph
 */
export async function getAllChapters(): Promise<{ id: string; number: number; summary: string }[]> {
  try {
    const results = await runQuery<any>(`
      MATCH (ch:Chapter)
      RETURN ch.id as id, ch.number as number, ch.summary as summary
      ORDER BY ch.number
    `);

    return results.map(r => ({
      id: r.id,
      number: typeof r.number === 'object' ? r.number.toNumber() : r.number,
      summary: r.summary || ''
    }));
  } catch (error) {
    console.error('Failed to get chapters:', error);
    return [];
  }
}

/**
 * Clear all data from the graph (use with caution!)
 */
export async function clearGraph(workflowId?: string): Promise<void> {
  await runWriteTransaction(async (tx) => {
    if (workflowId) {
      // Clear only data for the specific workflow
      await tx.run(`
        MATCH (n)
        WHERE n.workflowId = $workflowId OR n.id STARTS WITH 'workflow-' + $workflowId
        DETACH DELETE n
      `, { workflowId });
    } else {
      // Clear all data
      await tx.run('MATCH (n) DETACH DELETE n');
    }
  });
}

/**
 * Get character timeline with all state changes
 */
export async function getCharacterTimeline(characterId: string): Promise<any[]> {
  try {
    const results = await runQuery(`
      MATCH (c:Character { id: $characterId })-[:HAS_STATE]->(s:State)
      RETURN s
      ORDER BY s.version, s.timestamp
    `, { characterId });

    return results.map(r => r.s.properties);
  } catch (error) {
    console.error('Failed to get character timeline:', error);
    return [];
  }
}

export default {
  initializeGraphSchema,
  updateGraph,
  getGraphOverview,
  getGraphByChapter,
  getAllChapters,
  clearGraph,
  getCharacterTimeline
};
