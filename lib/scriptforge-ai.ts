import { GenerativeModel } from '@google/generative-ai';
import { 
  GenerateWorkflowRequest, 
  GenerateWorkflowResponse, 
  ScriptWorkflow, 
  WorkflowInput,
  ScriptForgeNode,
  ScriptForgeEdge
} from '@/types/workflow';
import { AGENT_DEFINITIONS } from './agents/definitions';
import { getFlashModel } from './gemini';

export class ScriptForgeAIService {
  private model: GenerativeModel;

  constructor() {
    // Use the shared model getter with 120-second timeout configured
    this.model = getFlashModel();
  }

  async generateWorkflow(request: GenerateWorkflowRequest, userId: string): Promise<GenerateWorkflowResponse> {
    try {
      const { brief, inputs } = request;

      // Build context from inputs
      const inputContext = await this.buildInputContext(inputs || []);

      const prompt = `You are an expert AI workflow architect for scriptwriting and filmmaking.
Your task is to design an intelligent workflow using ALL available agents to help the user achieve their goal.

User Brief: ${brief}

IMPORTANT: You MUST include ALL 7 agents in every workflow. This is a comprehensive scriptwriting tool that requires all agents working together.

Available Agents (INCLUDE ALL OF THEM):
${Object.values(AGENT_DEFINITIONS).map(agent => `
- ${agent.name} (${agent.id})
  Description: ${agent.description}
  Capabilities: ${agent.capabilities.join(', ')}
  Inputs: ${agent.inputs.join(', ')}
  Outputs: ${agent.outputs.join(', ')}
`).join('\n')}

Input Context:
${inputContext}

Design a workflow that:
1. INCLUDES ALL 7 AGENTS - story-intelligence, knowledge-graph, temporal-reasoning, continuity-validator, creative-coauthor, intelligent-recall, cinematic-teaser
2. Creates a logical flow where outputs from one agent feed into inputs of another
3. Ensures comprehensive coverage for script analysis, validation, and enhancement
4. Provides semantic meaning for each connection (edge) between agents

The standard flow should be:
- story-intelligence (first - analyzes the script)
- knowledge-graph (builds entity relationships from story intelligence)
- temporal-reasoning (validates timeline using knowledge graph)
- continuity-validator (checks consistency using knowledge graph and timeline)
- creative-coauthor (suggests improvements based on all analysis)
- intelligent-recall (enables Q&A about the story)
- cinematic-teaser (generates promotional content at the end)

Return a JSON object with:
{
  "workflowName": "Descriptive workflow name",
  "reasoning": "Explanation of the workflow design",
  "agents": [
    {
      "agentId": "agent-type",
      "position": { "x": number, "y": number }
    }
  ],
  "connections": [
    {
      "from": "agentId",
      "to": "agentId",
      "semantic": "What data flows between them",
      "description": "Why this connection exists"
    }
  ]
}

Ensure proper positioning (x, y coordinates) for a left-to-right flow with proper spacing (400px horizontal, 200px vertical).`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse workflow response');
      }

      const workflowData = JSON.parse(jsonMatch[0]);

      // Convert to ScriptWorkflow format
      const nodes: ScriptForgeNode[] = workflowData.agents.map((agent: any, index: number) => {
        const agentDef = AGENT_DEFINITIONS[agent.agentId as keyof typeof AGENT_DEFINITIONS];
        
        // Generate initial prompt for this agent based on the brief and agent type
        const agentPrompt = this.generateAgentPrompt(agentDef, brief, inputContext);
        
        return {
          id: `node-${index}`,
          type: 'agent' as const,
          position: agent.position,
          data: {
            agentType: agent.agentId,
            label: agentDef.name,
            description: agentDef.description,
            icon: agentDef.icon,
            color: agentDef.color,
            status: 'idle' as const,
            prompt: agentPrompt,
            capabilities: agentDef.capabilities
          }
        };
      });

      const edges: ScriptForgeEdge[] = workflowData.connections.map((conn: any, index: number) => {
        const sourceIndex = workflowData.agents.findIndex((a: any) => a.agentId === conn.from);
        const targetIndex = workflowData.agents.findIndex((a: any) => a.agentId === conn.to);
        
        return {
          id: `edge-${index}`,
          source: `node-${sourceIndex}`,
          target: `node-${targetIndex}`,
          label: conn.semantic,
          data: {
            semantic: conn.semantic,
            description: conn.description
          },
          type: 'smoothstep' as const,
          animated: true,
          style: { stroke: '#10B981', strokeWidth: 2 }
        };
      });

      // Truncate description to fit schema limit (2000 chars) - full content goes in brief
      const truncatedDescription = brief.length > 1990 
        ? brief.substring(0, 1990) + '...' 
        : brief;

      const workflow: ScriptWorkflow = {
        userId,
        name: workflowData.workflowName,
        description: truncatedDescription,
        brief,
        nodes,
        edges,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        inputs,
        progress: {
          completedNodes: [],
          totalNodes: nodes.length,
          errors: []
        }
      };

      return {
        workflow,
        reasoning: workflowData.reasoning
      };
    } catch (error) {
      console.error('Error generating workflow:', error);
      throw error;
    }
  }

  private async buildInputContext(inputs: WorkflowInput[]): Promise<string> {
    if (!inputs || inputs.length === 0) {
      return 'No additional inputs provided.';
    }

    const contexts: string[] = [];
    for (const input of inputs) {
      switch (input.type) {
        case 'text':
          contexts.push(`Text Input: ${input.content}`);
          break;
        case 'document':
          contexts.push(`Document: ${input.fileName} (${input.mimeType})`);
          break;
        case 'image':
          contexts.push(`Image: ${input.fileName}`);
          break;
        case 'video':
          contexts.push(`Video: ${input.fileName}`);
          break;
        case 'audio':
          contexts.push(`Audio: ${input.fileName}`);
          break;
      }
    }

    return contexts.join('\n');
  }

  async analyzeWithMultimodal(inputs: WorkflowInput[]): Promise<string> {
    try {
      const parts: any[] = [];

      for (const input of inputs) {
        if (input.type === 'text' && input.content) {
          parts.push({ text: input.content });
        } else if (input.base64Data && input.mimeType) {
          parts.push({
            inlineData: {
              data: input.base64Data,
              mimeType: input.mimeType
            }
          });
        }
      }

      if (parts.length === 0) {
        throw new Error('No valid inputs provided');
      }

      parts.push({ 
        text: `Analyze the provided content for scriptwriting purposes. Extract key themes, characters, 
settings, plot elements, and any other relevant information that would be useful for developing a screenplay.` 
      });

      const result = await this.model.generateContent(parts);
      return result.response.text();
    } catch (error) {
      console.error('Error analyzing multimodal input:', error);
      throw error;
    }
  }

  private generateAgentPrompt(agentDef: any, brief: string, inputContext: string): string {
    const prompts: Record<string, string> = {
      'story-intelligence': `As the Story Intelligence Core (The Brain), analyze the following manuscript/script context:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Parse the manuscript structure and identify narrative elements
2. Learn the writing style, tone, and voice
3. Track version history and changes
4. Build global context awareness across all scenes and chapters

Provide a structured analysis of the story's intelligence profile.`,

      'knowledge-graph': `As the Story Knowledge Graph Agent (The Memory), build a comprehensive knowledge graph:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Extract and track all characters with their attributes and relationships
2. Map all locations and their significance
3. Catalog important objects and props
4. Sequence events chronologically
5. Identify and track plot threads
6. Monitor entity state changes over time

Return a structured knowledge graph representation.`,

      'temporal-reasoning': `As the Temporal & Causal Reasoning Agent (The Timeline Police), analyze temporal consistency:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Build a chronological timeline of all events
2. Identify flashbacks and flash-forwards
3. Validate cause-effect relationships
4. Detect temporal paradoxes or inconsistencies
5. Flag timeline conflicts

Return a timeline analysis with any issues found.`,

      'continuity-validator': `As the Continuity & Intent Validator (The Editor), check for narrative consistency:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Detect contradictions in character behavior, settings, or facts
2. Distinguish between errors and intentional narrative choices
3. Classify issue severity (critical, major, minor)
4. Identify plot holes
5. Validate continuity across scenes

Return a continuity report with findings and recommendations.`,

      'creative-coauthor': `As the Creative Co-Author Agent (The Muse), provide creative guidance:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Suggest scene improvements and alternatives
2. Develop plot ideas and twists
3. Enhance dialogue for authenticity
4. Guide character arc development
5. Reinforce thematic elements
6. Offer creative alternatives

Provide creative suggestions that enhance the narrative.`,

      'intelligent-recall': `As the Intelligent Recall Agent (Ask Your Story), be ready to answer queries:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Process natural language queries about the story
2. Look up character information on demand
3. Search for plot-related events
4. Cross-reference story elements
5. Provide contextual answers

Prepare to answer any questions about this story's elements.`,

      'cinematic-teaser': `As the Cinematic Teaser Generator (The Mic-Drop), create compelling promotional content:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Your task:
1. Extract the story's essence and hook
2. Write a trailer script with dramatic beats
3. Generate visual prompts for key moments
4. Capture the mood and tone
5. Identify the most impactful scenes

Create a teaser that captures the story's essence.`
    };

    return prompts[agentDef.id] || `As the ${agentDef.name}, perform your specialized task:

BRIEF: ${brief}

CONTEXT: ${inputContext}

Capabilities: ${agentDef.capabilities.join(', ')}

Execute your specialized function and provide structured results.`;
  }

  async executeAgent(
    agentType: string,
    input: any,
    context: any
  ): Promise<any> {
    try {
      const agentDef = AGENT_DEFINITIONS[agentType as keyof typeof AGENT_DEFINITIONS];
      if (!agentDef) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      const prompt = `You are the ${agentDef.name} agent.
${agentDef.description}

Capabilities:
${agentDef.capabilities.join('\n')}

Context:
${JSON.stringify(context, null, 2)}

Input:
${JSON.stringify(input, null, 2)}

Perform your specialized task and return the results in a structured JSON format.`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Try to parse JSON, fallback to raw text
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Return raw text if not JSON
      }

      return { result: responseText };
    } catch (error) {
      console.error(`Error executing agent ${agentType}:`, error);
      throw error;
    }
  }
}

export const scriptForgeAI = new ScriptForgeAIService();
