/**
 * GET /api/story-graph/overview
 * 
 * Returns all nodes and edges for visualization
 * Optionally filtered by workflowId query parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGraphOverview, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';
import { isNeo4jAvailable } from '@/lib/neo4j';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { buildGraphFromKnowledgeGraph } from '@/lib/story-graph-fallback';

type FallbackNode = { type?: string; [key: string]: any };
type FallbackGraph = { nodes: FallbackNode[]; edges: Record<string, any>[] };

async function getWorkflowFallbackGraph(workflowId: string | null, userId: string): Promise<FallbackGraph> {
  if (!workflowId) {
    return { nodes: [], edges: [] };
  }

  await connectDB();
  const workflow = await ScriptWorkflow.findOne({
    _id: workflowId,
    userId,
  })
    .select('analysisContext nodes')
    .lean();

  const knowledgeGraph =
    workflow?.analysisContext?.knowledgeGraph ||
    workflow?.nodes?.find((n: any) => n?.data?.agentType === 'knowledge-graph')?.data?.result ||
    null;

  const graph = buildGraphFromKnowledgeGraph(knowledgeGraph);
  return {
    nodes: (graph.nodes || []).map((node) => ({
      ...node,
      type: typeof node.type === 'string' ? node.type : 'unknown',
    })),
    edges: graph.edges || [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workflowId from query params if provided
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    const neo4jAvailable = await isNeo4jAvailable();
    if (!neo4jAvailable) {
      let fallbackGraph: FallbackGraph = { nodes: [], edges: [] };

      if (workflowId) {
        try {
          fallbackGraph = await getWorkflowFallbackGraph(workflowId, userId);
        } catch (fallbackError) {
          console.warn('Fallback graph generation failed:', fallbackError);
        }
      }

      return NextResponse.json({
        success: true,
        data: fallbackGraph,
        workflowId: workflowId || null,
        neo4jAvailable: false,
        fallbackSource: 'workflow-analysis-context',
        warning: 'Neo4j is unavailable. Showing workflow fallback graph data.',
        stats: {
          totalNodes: fallbackGraph.nodes.length,
          totalEdges: fallbackGraph.edges.length,
          nodesByType: fallbackGraph.nodes.reduce((acc, node) => {
            const nodeType = typeof node.type === 'string' ? node.type : 'unknown';
            acc[nodeType] = (acc[nodeType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    }

    // Initialize schema if needed
    await initializeGraphSchema();

    // Get the graph data, filtered by workflowId if provided
    const graphData = await getGraphOverview(workflowId || undefined);

    // If Neo4j is up but has no graph data yet, use workflow-derived fallback.
    if (workflowId && graphData.nodes.length === 0) {
      try {
        const fallbackGraph = await getWorkflowFallbackGraph(workflowId, userId);
        if (fallbackGraph.nodes.length > 0) {
          return NextResponse.json({
            success: true,
            data: fallbackGraph,
            workflowId,
            neo4jAvailable: true,
            fallbackSource: 'workflow-analysis-context',
            warning: 'Neo4j connected, but no graph data found yet. Showing workflow fallback graph data.',
            stats: {
              totalNodes: fallbackGraph.nodes.length,
              totalEdges: fallbackGraph.edges.length,
              nodesByType: fallbackGraph.nodes.reduce((acc, node) => {
                const nodeType = typeof node.type === 'string' ? node.type : 'unknown';
                acc[nodeType] = (acc[nodeType] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
            },
          });
        }
      } catch (fallbackError) {
        console.warn('Post-Neo4j fallback graph generation failed:', fallbackError);
      }
    }

    return NextResponse.json({
      success: true,
      data: graphData,
      workflowId: workflowId || null,
      neo4jAvailable: true,
      stats: {
        totalNodes: graphData.nodes.length,
        totalEdges: graphData.edges.length,
        nodesByType: graphData.nodes.reduce((acc, node) => {
          acc[node.type] = (acc[node.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Graph overview error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch graph overview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
