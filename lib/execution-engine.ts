import { WorkflowNode, WorkflowEdge, NodeExecutionContext } from '@/types/workflow';

/**
 * Builds the execution context for a node by analyzing incoming edges
 * and compiling context from source nodes
 */
export function buildExecutionContext(
  targetNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  campaignBrief: string,
  campaignStrategy: string,
  kyc?: Record<string, any>
): NodeExecutionContext {
  // Find the target node
  const targetNode = nodes.find(n => n.id === targetNodeId);
  if (!targetNode) {
    throw new Error(`Node with ID ${targetNodeId} not found`);
  }

  // Find all incoming edges to this node
  const incomingEdges = edges.filter(edge => edge.target === targetNodeId);

  // Build context from each incoming edge
  const incomingContext = incomingEdges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    
    if (!sourceNode) {
      console.warn(`Source node ${edge.source} not found for edge ${edge.id}`);
      return null;
    }

    // Only include context if the source node has completed
    if (sourceNode.data.status !== 'complete' || !sourceNode.data.output) {
      return null;
    }

    return {
      sourceNodeId: sourceNode.id,
      sourceOutput: sourceNode.data.output,
      transferLogic: edge.data?.transferLogic || 'Use the output from the previous step',
      edgeLabel: edge.data?.label || edge.label || 'Context',
    };
  }).filter(Boolean) as NodeExecutionContext['incomingEdges'];

  return {
    nodeId: targetNode.id,
    nodeType: targetNode.data.type,
    promptContext: targetNode.data.promptContext,
    incomingEdges: incomingContext,
    campaignContext: {
      brief: campaignBrief,
      strategy: campaignStrategy,
      kyc,
    },
  };
}

/**
 * Compiles the final prompt by combining the node's base prompt
 * with context from incoming edges
 */
export function compilePrompt(context: NodeExecutionContext): string {
  const { nodeType, promptContext, incomingEdges, campaignContext } = context;

  // Start with campaign context
  let prompt = `CAMPAIGN CONTEXT:\n`;
  prompt += `Brief: ${campaignContext.brief}\n\n`;
  prompt += `Strategy Overview: ${campaignContext.strategy}\n\n`;

  // Include KYC business profile if available
  if (campaignContext.kyc) {
    try {
      const entries: string[] = [];
      Object.entries(campaignContext.kyc).forEach(([key, value]) => {
        if (value === null || typeof value === 'undefined') return;
        const prettyKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        if (Array.isArray(value)) {
          if (value.length) entries.push(`${prettyKey}: ${value.join(', ')}`);
        } else {
          entries.push(`${prettyKey}: ${String(value)}`);
        }
      });
      if (entries.length) {
        prompt += `BUSINESS PROFILE (KYC):\n`;
        entries.forEach(line => { prompt += `- ${line}\n`; });
        prompt += `\nUse the KYC business attributes above to tailor outputs (tone, channels, personas, timing, and constraints).\n\n`;
      }
    } catch {}
  }

  // Add context from incoming edges
  if (incomingEdges.length > 0) {
    prompt += `CONTEXT FROM PREVIOUS STEPS:\n`;
    
    incomingEdges.forEach((edge, index) => {
      prompt += `\n--- ${edge.edgeLabel} ---\n`;
      prompt += `Transfer Logic: ${edge.transferLogic}\n`;
      prompt += `Source Output:\n${edge.sourceOutput}\n`;
    });
    
    prompt += `\n`;
  }

  // Add the specific task for this node
  prompt += `YOUR TASK:\n`;
  prompt += `${promptContext}\n\n`;

  // Add type-specific instructions
  switch (nodeType) {
    case 'copy':
      prompt += `You are an Ad Copy generator. Create platform-ready ads for Meta (Facebook/Instagram), X/Twitter, and LinkedIn.
Return polished copy with:
- 3 headlines (30-40 chars each)
- 3 primary texts (80-120 chars)
- 3 CTAs
- 2 variations tailored to Gen Z tone when relevant
Output as a clean, readable list. Avoid JSON unless asked.\n`;
      break;
    
    case 'image':
      prompt += `Generate 2-4 high quality marketing visuals aligned to the strategy. For each visual, produce a vivid composition: subject, setting, camera, lighting, color palette, and style. If this model supports direct image output, return images. Otherwise, return detailed prompts.\n`;
      break;
    
    case 'research':
      prompt += `Conduct thorough research and provide actionable insights. Use bullet points for clarity. Be specific with names, numbers, and recommendations.\n`;
      break;
    
    case 'strategy':
      prompt += `Provide strategic analysis and recommendations. Use data-driven insights and clear reasoning. Format with headings and bullet points.\n`;
      break;
    
    case 'timeline':
      prompt += `Create a detailed timeline or schedule. Be specific with dates, times, and action items. Use a structured format.\n`;
      break;
    
    case 'distribution':
      prompt += `Provide a comprehensive distribution strategy. Specify channels, timing, and tactics. Be actionable and detailed.\n`;
      break;
  }

  return prompt;
}

/**
 * Validates that all dependencies for a node are complete
 */
export function canExecuteNode(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { canExecute: boolean; reason?: string } {
  const node = nodes.find(n => n.id === nodeId);
  
  if (!node) {
    return { canExecute: false, reason: 'Node not found' };
  }

  if (node.data.status === 'loading') {
    return { canExecute: false, reason: 'Node is already executing' };
  }

  if (node.data.status === 'complete') {
    return { canExecute: true }; // Allow re-execution
  }

  // Find all incoming edges
  const incomingEdges = edges.filter(edge => edge.target === nodeId);

  // Check if all source nodes are complete
  for (const edge of incomingEdges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    
    if (!sourceNode) {
      continue; // Skip if source node not found
    }

    if (sourceNode.data.status !== 'complete') {
      return { 
        canExecute: false, 
        reason: `Waiting for "${sourceNode.data.label}" to complete` 
      };
    }
  }

  return { canExecute: true };
}

/**
 * Gets the execution order for all nodes (topological sort)
 */
export function getExecutionOrder(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) {
      throw new Error('Circular dependency detected in workflow');
    }

    visiting.add(nodeId);

    // Visit all dependencies first
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    for (const edge of incomingEdges) {
      visit(edge.source);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    order.push(nodeId);
  }

  // Visit all nodes
  for (const node of nodes) {
    visit(node.id);
  }

  return order;
}
