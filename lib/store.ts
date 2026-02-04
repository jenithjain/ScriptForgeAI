import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, CampaignStrategy } from '@/types/workflow';

interface CampaignStore {
  // State
  brief: string;
  strategy: CampaignStrategy | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isGeneratingStrategy: boolean;
  isGeneratingWorkflow: boolean;
  error: string | null;

  // Actions
  setBrief: (brief: string) => void;
  setStrategy: (strategy: CampaignStrategy) => void;
  setWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  updateNodeStatus: (nodeId: string, status: 'idle' | 'loading' | 'complete' | 'error', output?: string, error?: string) => void;
  updateEdgeTransferLogic: (edgeId: string, newLogic: string) => void;
  updateNodePrompt: (nodeId: string, prompt: string) => void;
  setGeneratingStrategy: (isGenerating: boolean) => void;
  setGeneratingWorkflow: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  // Initial state
  brief: '',
  strategy: null,
  nodes: [],
  edges: [],
  isGeneratingStrategy: false,
  isGeneratingWorkflow: false,
  error: null,

  // Actions
  setBrief: (brief) => set({ brief }),

  setStrategy: (strategy) => set({ strategy }),

  setWorkflow: (nodes, edges) => set({ nodes, edges }),

  updateNodeStatus: (nodeId, status, output, error) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                status,
                output: output !== undefined ? output : node.data.output,
                error: error !== undefined ? error : node.data.error,
              },
            }
          : node
      ),
    })),

  updateEdgeTransferLogic: (edgeId, newLogic) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: {
                ...edge.data!,
                transferLogic: newLogic,
              },
            }
          : edge
      ),
    })),

  updateNodePrompt: (nodeId, prompt) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                promptContext: prompt,
              },
            }
          : node
      ),
    })),

  setGeneratingStrategy: (isGenerating) => set({ isGeneratingStrategy: isGenerating }),

  setGeneratingWorkflow: (isGenerating) => set({ isGeneratingWorkflow: isGenerating }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      brief: '',
      strategy: null,
      nodes: [],
      edges: [],
      isGeneratingStrategy: false,
      isGeneratingWorkflow: false,
      error: null,
    }),
}));
