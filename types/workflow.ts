// Campaign AI Workflow Types

export type NodeType = 'strategy' | 'copy' | 'image' | 'research' | 'timeline' | 'distribution';

export type NodeStatus = 'idle' | 'loading' | 'complete' | 'error';

export interface EdgeData {
  label: string;
  transferLogic: string;
}

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  status: NodeStatus;
  content: string | null;
  promptContext: string;
  output?: string;
  error?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'agentNode';
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'smartEdge';
  label?: string;
  data?: EdgeData;
  animated?: boolean;
}

export interface CampaignStrategy {
  title: string;
  rationale: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface CampaignState {
  brief: string;
  strategy: CampaignStrategy | null;
  workflow: WorkflowGraph | null;
  isGeneratingStrategy: boolean;
  isGeneratingWorkflow: boolean;
  error: string | null;
}

export interface NodeExecutionContext {
  nodeId: string;
  nodeType: NodeType;
  promptContext: string;
  incomingEdges: Array<{
    sourceNodeId: string;
    sourceOutput: string;
    transferLogic: string;
    edgeLabel: string;
  }>;
  campaignContext: {
    brief: string;
    strategy: string;
    kyc?: Record<string, any>;
  };
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

// ========================================
// ScriptForge Workflow Types
// ========================================

export type AgentType =
  | 'story-intelligence'
  | 'knowledge-graph'
  | 'temporal-reasoning'
  | 'continuity-validator'
  | 'creative-coauthor'
  | 'intelligent-recall'
  | 'cinematic-teaser';

export type FileInputType = 'document' | 'image' | 'video' | 'audio' | 'text';

export interface AgentDefinition {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
}

export interface ScriptForgeNode {
  id: string;
  type: 'agent' | 'input' | 'output';
  position: { x: number; y: number };
  data: {
    agentType?: AgentType;
    label: string;
    description?: string;
    icon?: string;
    color?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    result?: any;
    config?: Record<string, any>;
  };
}

export interface ScriptForgeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    semantic?: string;
    description?: string;
    dataType?: string;
  };
  type?: 'default' | 'smoothstep' | 'step' | 'straight';
  animated?: boolean;
  style?: Record<string, any>;
  markerEnd?: any;
}

export interface ScriptWorkflow {
  _id?: string;
  userId: string;
  name: string;
  description?: string;
  brief?: string;
  nodes: ScriptForgeNode[];
  edges: ScriptForgeEdge[];
  status: 'draft' | 'active' | 'running' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  inputs?: WorkflowInput[];
  progress?: WorkflowProgress;
}

export interface WorkflowInput {
  type: FileInputType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
}

export interface WorkflowProgress {
  currentNode?: string;
  completedNodes: string[];
  totalNodes: number;
  errors: Array<{
    nodeId: string;
    error: string;
  }>;
}

export interface GenerateWorkflowRequest {
  brief: string;
  inputs?: WorkflowInput[];
}

export interface GenerateWorkflowResponse {
  workflow: ScriptWorkflow;
  reasoning: string;
}
