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
