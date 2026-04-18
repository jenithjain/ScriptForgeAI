type AnyRecord = Record<string, any>;

const NODE_COLOR: Record<string, string> = {
  Character: '#8B5CF6',
  Location: '#10B981',
  Object: '#F59E0B',
  Event: '#EF4444',
  PlotThread: '#EC4899',
  Chapter: '#3B82F6',
};

const NODE_SIZE: Record<string, number> = {
  Character: 12,
  Location: 10,
  Object: 6,
  Event: 8,
  PlotThread: 10,
  Chapter: 14,
};

function slug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeNodeId(prefix: string, value: string, index: number): string {
  const base = slug(value);
  return base ? `${prefix}-${base}` : `${prefix}-${index + 1}`;
}

export function buildGraphFromKnowledgeGraph(knowledgeGraph: AnyRecord | null | undefined): { nodes: AnyRecord[]; edges: AnyRecord[] } {
  if (!knowledgeGraph || typeof knowledgeGraph !== 'object') {
    return { nodes: [], edges: [] };
  }

  const nodes: AnyRecord[] = [];
  const edges: AnyRecord[] = [];
  const nodeById = new Map<string, AnyRecord>();
  const nodeIdByName = new Map<string, string>();
  const edgeKeys = new Set<string>();

  const addNode = (item: AnyRecord, type: string, prefix: string, index: number): string => {
    const label = item?.name || item?.id || `${type} ${index + 1}`;
    const id = item?.id || makeNodeId(prefix, label, index);

    if (!nodeById.has(id)) {
      const node = {
        id,
        label,
        type,
        properties: { ...(item || {}) },
        color: NODE_COLOR[type] || '#6B7280',
        size: NODE_SIZE[type] || 8,
      };
      nodeById.set(id, node);
      nodes.push(node);
    }

    if (label) {
      nodeIdByName.set(String(label).toLowerCase(), id);
    }

    return id;
  };

  const getIdByName = (value: string): string | undefined => {
    return nodeIdByName.get(String(value || '').toLowerCase());
  };

  const addEdge = (
    source: string | undefined,
    target: string | undefined,
    type: string,
    label: string,
    properties: AnyRecord = {}
  ): void => {
    if (!source || !target || source === target) {
      return;
    }

    const key = `${source}|${target}|${type}|${label}`;
    if (edgeKeys.has(key)) {
      return;
    }

    edgeKeys.add(key);
    edges.push({
      id: `edge-${edgeKeys.size}`,
      source,
      target,
      type,
      label,
      properties,
    });
  };

  const characters = Array.isArray(knowledgeGraph.characters) ? knowledgeGraph.characters : [];
  const locations = Array.isArray(knowledgeGraph.locations) ? knowledgeGraph.locations : [];
  const objects = Array.isArray(knowledgeGraph.objects) ? knowledgeGraph.objects : [];
  const events = Array.isArray(knowledgeGraph.events) ? knowledgeGraph.events : [];
  const plotThreads = Array.isArray(knowledgeGraph.plotThreads) ? knowledgeGraph.plotThreads : [];
  const relationships = Array.isArray(knowledgeGraph.relationships) ? knowledgeGraph.relationships : [];

  characters.forEach((item: AnyRecord, index: number) => addNode(item, 'Character', 'char', index));
  locations.forEach((item: AnyRecord, index: number) => addNode(item, 'Location', 'loc', index));
  objects.forEach((item: AnyRecord, index: number) => addNode(item, 'Object', 'obj', index));
  events.forEach((item: AnyRecord, index: number) => addNode(item, 'Event', 'evt', index));
  plotThreads.forEach((item: AnyRecord, index: number) => addNode(item, 'PlotThread', 'plot', index));

  relationships.forEach((rel: AnyRecord) => {
    const sourceId = rel?.sourceId || rel?.fromId || getIdByName(rel?.source || rel?.from);
    const targetId = rel?.targetId || rel?.toId || getIdByName(rel?.target || rel?.to);
    const relType = rel?.type || 'RELATES_TO';
    addEdge(sourceId, targetId, relType, relType, rel);
  });

  objects.forEach((obj: AnyRecord) => {
    const objectId = obj?.id || getIdByName(obj?.name);
    const ownerId = getIdByName(obj?.owner);
    addEdge(ownerId, objectId, 'OWNS', 'OWNS', { owner: obj?.owner });
  });

  events.forEach((evt: AnyRecord) => {
    const eventId = evt?.id || getIdByName(evt?.name);

    const participantList = Array.isArray(evt?.participants)
      ? evt.participants
      : Array.isArray(evt?.characters)
      ? evt.characters
      : [];

    participantList.forEach((name: string) => {
      const charId = getIdByName(name);
      addEdge(eventId, charId, 'INVOLVES', 'INVOLVES', { event: evt?.name });
    });

    const locationId = getIdByName(evt?.location);
    addEdge(eventId, locationId, 'AT', 'AT', { location: evt?.location });

    const causedBy = Array.isArray(evt?.causedBy) ? evt.causedBy : [];
    causedBy.forEach((name: string) => {
      const causeEventId = getIdByName(name);
      addEdge(causeEventId, eventId, 'CAUSES', 'CAUSES', { causedBy: name });
    });

    const effects = Array.isArray(evt?.effects) ? evt.effects : [];
    effects.forEach((name: string) => {
      const effectEventId = getIdByName(name);
      addEdge(eventId, effectEventId, 'CAUSES', 'CAUSES', { effect: name });
    });
  });

  plotThreads.forEach((plot: AnyRecord) => {
    const plotId = plot?.id || getIdByName(plot?.name);

    const relatedCharacters = Array.isArray(plot?.relatedCharacters) ? plot.relatedCharacters : [];
    relatedCharacters.forEach((name: string) => {
      const charId = getIdByName(name);
      addEdge(charId, plotId, 'ADVANCES', 'ADVANCES', { plot: plot?.name });
    });

    const relatedEvents = Array.isArray(plot?.relatedEvents) ? plot.relatedEvents : [];
    relatedEvents.forEach((name: string) => {
      const eventId = getIdByName(name);
      addEdge(plotId, eventId, 'ADVANCES_IN', 'ADVANCES_IN', { plot: plot?.name });
    });
  });

  return { nodes, edges };
}

export function buildFallbackChapters(workflow: AnyRecord | null | undefined): { id: string; number: number; summary: string }[] {
  if (!workflow) {
    return [];
  }

  return [
    {
      id: String(workflow._id),
      number: 1,
      summary:
        (workflow.brief && String(workflow.brief).slice(0, 180)) ||
        'Current workflow context',
    },
  ];
}
