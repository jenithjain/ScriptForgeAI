import { AgentDefinition, AgentType } from '@/types/workflow';

// Icon names that will be rendered as Lucide React components
export const AGENT_DEFINITIONS: Record<AgentType, AgentDefinition> = {
  'story-intelligence': {
    id: 'story-intelligence',
    type: 'story-intelligence',
    name: 'Story Intelligence Core',
    description: 'The brain - Global context awareness, manuscript parsing, style & tone learning, version awareness',
    icon: 'Brain',
    color: '#8B5CF6',
    category: 'Analysis',
    capabilities: [
      'Global context awareness',
      'Manuscript parsing & analysis',
      'Style & tone learning',
      'Version tracking',
      'Narrative structure detection'
    ],
    inputs: ['manuscript', 'script', 'text', 'document'],
    outputs: ['story_context', 'style_profile', 'structure_analysis']
  },
  'knowledge-graph': {
    id: 'knowledge-graph',
    type: 'knowledge-graph',
    name: 'Story Knowledge Graph Agent',
    description: 'The memory - Characters, locations, objects, events, relationships & plot threads, entity state changes over time',
    icon: 'Network',
    color: '#10B981',
    category: 'Knowledge',
    capabilities: [
      'Character tracking',
      'Location mapping',
      'Object & prop tracking',
      'Event sequencing',
      'Relationship graphs',
      'Plot thread management',
      'Entity state tracking'
    ],
    inputs: ['story_context', 'manuscript', 'scene'],
    outputs: ['knowledge_graph', 'entity_data', 'relationships']
  },
  'temporal-reasoning': {
    id: 'temporal-reasoning',
    type: 'temporal-reasoning',
    name: 'Temporal & Causal Reasoning Agent',
    description: 'The timeline police - Chronology tracking, flashbacks/flash-forwards, cause-effect validation',
    icon: 'Clock',
    color: '#F59E0B',
    category: 'Analysis',
    capabilities: [
      'Chronology tracking',
      'Flashback detection',
      'Flash-forward analysis',
      'Cause-effect validation',
      'Timeline consistency',
      'Temporal paradox detection'
    ],
    inputs: ['knowledge_graph', 'story_context', 'events'],
    outputs: ['timeline', 'causal_chains', 'temporal_issues']
  },
  'continuity-validator': {
    id: 'continuity-validator',
    type: 'continuity-validator',
    name: 'Continuity & Intent Validator',
    description: 'The editor - Contradiction detection, error vs intentional narrative choice, severity classification',
    icon: 'CheckSquare',
    color: '#EF4444',
    category: 'Quality',
    capabilities: [
      'Contradiction detection',
      'Intent analysis',
      'Error classification',
      'Severity assessment',
      'Continuity validation',
      'Plot hole detection'
    ],
    inputs: ['knowledge_graph', 'timeline', 'manuscript'],
    outputs: ['continuity_report', 'errors', 'warnings']
  },
  'creative-coauthor': {
    id: 'creative-coauthor',
    type: 'creative-coauthor',
    name: 'Creative Co-Author Agent',
    description: 'The muse - Scene & plot suggestions, dialogue improvement, character arc guidance, theme reinforcement',
    icon: 'Sparkles',
    color: '#EC4899',
    category: 'Creation',
    capabilities: [
      'Scene suggestions',
      'Plot development ideas',
      'Dialogue enhancement',
      'Character arc guidance',
      'Theme reinforcement',
      'Creative brainstorming',
      'Alternative scenarios'
    ],
    inputs: ['story_context', 'knowledge_graph', 'user_intent'],
    outputs: ['suggestions', 'improved_dialogue', 'plot_ideas']
  },
  'intelligent-recall': {
    id: 'intelligent-recall',
    type: 'intelligent-recall',
    name: 'Intelligent Recall Agent',
    description: 'Ask your story - Natural language queries, character & plot lookups, cross-reference answers',
    icon: 'Search',
    color: '#3B82F6',
    category: 'Knowledge',
    capabilities: [
      'Natural language queries',
      'Character lookups',
      'Plot searches',
      'Event retrieval',
      'Cross-referencing',
      'Contextual answers',
      'Story Q&A'
    ],
    inputs: ['knowledge_graph', 'query', 'story_context'],
    outputs: ['answer', 'references', 'related_info']
  },
  'cinematic-teaser': {
    id: 'cinematic-teaser',
    type: 'cinematic-teaser',
    name: 'Cinematic Teaser Generator',
    description: 'The mic-drop - Story essence extraction, trailer script generation, visual prompt generation, video generation',
    icon: 'Film',
    color: '#A855F7',
    category: 'Creation',
    capabilities: [
      'Story essence extraction',
      'Trailer script generation',
      'Visual prompt creation',
      'Video generation (Veo3)',
      'Hook creation',
      'Mood & tone capture',
      'Key moment identification'
    ],
    inputs: ['story_context', 'knowledge_graph', 'preferences'],
    outputs: ['teaser_script', 'visual_prompts', 'video']
  }
};

export const AGENT_CATEGORIES = {
  'Analysis': ['story-intelligence', 'temporal-reasoning'],
  'Knowledge': ['knowledge-graph', 'intelligent-recall'],
  'Quality': ['continuity-validator'],
  'Creation': ['creative-coauthor', 'cinematic-teaser']
};
