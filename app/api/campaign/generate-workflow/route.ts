import { NextResponse } from 'next/server';
import { getReasoningModel, generateWithRetry, parseJSONFromResponse } from '@/lib/gemini';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { rationale, brief } = await request.json();

    if (!rationale || typeof rationale !== 'string') {
      return NextResponse.json(
        { error: 'Strategy rationale is required' },
        { status: 400 }
      );
    }

    const model = getReasoningModel();

    const systemPrompt = `You are an AI Workflow Architect and Technical Project Manager specialized in converting marketing strategies into executable workflow graphs.

Your task is to convert the provided campaign strategy into a React Flow compatible graph structure with intelligent, semantic edges.

CRITICAL REQUIREMENTS:

1. OUTPUT FORMAT: Respond with ONLY a valid JSON object. No markdown, no code blocks, no explanations.

2. STRUCTURE: The JSON must have two arrays:
   {
     "nodes": [...],
     "edges": [...]
   }

3. NODE STRUCTURE: Each node must be:
   {
     "id": "unique-string-id",
     "type": "agentNode",
     "position": { "x": number, "y": number },
     "data": {
       "label": "Agent Name",
       "type": "strategy" | "copy" | "image" | "research" | "timeline" | "distribution",
       "status": "idle",
       "content": null,
       "promptContext": "Detailed instruction for this specific agent task"
     }
   }

4. EDGE STRUCTURE: Each edge must have semantic meaning:
   {
     "id": "unique-edge-id",
     "source": "source-node-id",
     "target": "target-node-id",
     "type": "smartEdge",
     "label": "Context Type (e.g., 'Brand Voice', 'Visual Direction')",
     "animated": true,
     "data": {
       "label": "Human-readable connection name",
       "transferLogic": "Detailed instruction on WHAT data flows from source to target and HOW it should be used. Be specific about which aspects of the source output should influence the target."
     }
   }

5. LAYOUT: Position nodes in a clear top-to-bottom or left-to-right flow:
   - Start node at (0, 0)
   - Use x increments of 350 for horizontal spacing
   - Use y increments of 200 for vertical spacing
   - Create a tree-like structure that branches and merges logically

6. AGENT TYPES TO INCLUDE (select 4-6 relevant ones):
   - "strategy": Audience Intelligence Analyzer (research target demographics)
  - "copy": Ad Copy Generator (multi-platform ads: headlines, primary texts, CTAs)
  - "image": Visual Asset Generator (create image generation prompts or images)
   - "research": Market Research Agent (find influencers, competitors, trends)
   - "timeline": Campaign Timeline Optimizer (create posting schedule)
   - "distribution": Content Distribution Scheduler (plan channel strategy)

7. EDGE SEMANTICS: For each connection, clearly define:
   - WHAT information passes between nodes
   - HOW that information should influence the target node
   - Example: "Extract the target audience demographics (age, location, interests) from the Audience Analyzer output. Use these demographics to tailor the tone, language complexity, and cultural references in the generated copy."

SPECIAL INSTRUCTIONS PER NODE TYPE:
- For type "copy": set data.promptContext to request platform-ready ads (3 headlines, 3 primary texts, CTAs) tailored to the strategy and target audience.
- For type "image": set data.promptContext to request 2-4 visuals with clear art direction; if generation supports images, produce images; otherwise provide detailed prompts.

CAMPAIGN CONTEXT:
Brief: ${brief}

Strategy: ${rationale}

Generate a workflow graph with 4-6 specialized agent nodes connected by semantic edges. Ensure the workflow represents a logical campaign execution pipeline from research → strategy → creative → distribution.

Respond with ONLY the JSON object:`;

    const responseText = await generateWithRetry(model, systemPrompt);
    const parsedResponse = parseJSONFromResponse(responseText);

    // Validate the response structure
    if (!parsedResponse.nodes || !Array.isArray(parsedResponse.nodes)) {
      throw new Error('Invalid nodes array in response');
    }

    if (!parsedResponse.edges || !Array.isArray(parsedResponse.edges)) {
      throw new Error('Invalid edges array in response');
    }

    // Ensure all nodes have required fields
    const validatedNodes = parsedResponse.nodes.map((node: any) => ({
      id: node.id || nanoid(),
      type: 'agentNode',
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.data?.label || 'Untitled Agent',
        type: node.data?.type || 'strategy',
        status: 'idle',
        content: null,
        promptContext: node.data?.promptContext || '',
        output: undefined,
        error: undefined,
      },
    }));

    // Ensure all edges have required fields and semantic data
    const validatedEdges = parsedResponse.edges.map((edge: any) => ({
      id: edge.id || nanoid(),
      source: edge.source,
      target: edge.target,
      type: 'smartEdge',
      label: edge.label || '',
      animated: true,
      data: {
        label: edge.data?.label || edge.label || 'Context',
        transferLogic: edge.data?.transferLogic || 'Use the source node\'s output as contextual guidance for the target generation.',
      },
    }));

    return NextResponse.json({
      nodes: validatedNodes,
      edges: validatedEdges,
    });

  } catch (error) {
    console.error('Error generating workflow:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate campaign workflow',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
