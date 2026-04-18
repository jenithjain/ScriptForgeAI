/**
 * GET /api/story-graph/chapter/[id]
 * 
 * Returns time-filtered graph for a specific chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGraphByChapter, getAllChapters, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';
import { isNeo4jAvailable } from '@/lib/neo4j';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { buildGraphFromKnowledgeGraph, buildFallbackChapters } from '@/lib/story-graph-fallback';

type FallbackNode = { type?: string; [key: string]: any };
type FallbackGraph = { nodes: FallbackNode[]; edges: Record<string, any>[] };

async function getWorkflowFallbackData(workflowId: string | null, userId: string) {
  if (!workflowId) {
    return {
      graph: { nodes: [], edges: [] } as FallbackGraph,
      chapters: [] as { id: string; number: number; summary: string }[],
    };
  }

  await connectDB();
  const workflow = await ScriptWorkflow.findOne({
    _id: workflowId,
    userId,
  })
    .select('_id brief analysisContext nodes')
    .lean();

  const knowledgeGraph =
    workflow?.analysisContext?.knowledgeGraph ||
    workflow?.nodes?.find((n: any) => n?.data?.agentType === 'knowledge-graph')?.data?.result ||
    null;

  const graph = buildGraphFromKnowledgeGraph(knowledgeGraph);

  return {
    graph: {
      nodes: (graph.nodes || []).map((node) => ({
        ...node,
        type: typeof node.type === 'string' ? node.type : 'unknown',
      })),
      edges: graph.edges || [],
    } as FallbackGraph,
    chapters: buildFallbackChapters(workflow),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const chapterNumber = parseInt(id, 10);

    if (isNaN(chapterNumber) || chapterNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid chapter ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    const neo4jAvailable = await isNeo4jAvailable();
    if (!neo4jAvailable) {
      let fallbackGraph: FallbackGraph = { nodes: [], edges: [] };
      let chapters: { id: string; number: number; summary: string }[] = [];

      if (workflowId) {
        try {
          const fallbackData = await getWorkflowFallbackData(workflowId, userId);
          fallbackGraph = fallbackData.graph;
          chapters = fallbackData.chapters;
        } catch (fallbackError) {
          console.warn('Fallback chapter graph generation failed:', fallbackError);
        }
      }

      return NextResponse.json({
        success: true,
        chapterNumber,
        data: fallbackGraph,
        chapters,
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

    // Get chapter-specific graph
    const graphData = await getGraphByChapter(chapterNumber);

    // Get all chapters for navigation
    const allChapters = await getAllChapters();

    // Neo4j may be connected but empty; provide workflow-derived fallback.
    if (workflowId && graphData.nodes.length === 0) {
      try {
        const fallbackData = await getWorkflowFallbackData(workflowId, userId);
        if (fallbackData.graph.nodes.length > 0) {
          return NextResponse.json({
            success: true,
            chapterNumber,
            data: fallbackData.graph,
            chapters: fallbackData.chapters.length > 0 ? fallbackData.chapters : allChapters,
            neo4jAvailable: true,
            fallbackSource: 'workflow-analysis-context',
            warning: 'Neo4j connected, but chapter graph is empty. Showing workflow fallback graph data.',
            stats: {
              totalNodes: fallbackData.graph.nodes.length,
              totalEdges: fallbackData.graph.edges.length,
              nodesByType: fallbackData.graph.nodes.reduce((acc, node) => {
                const nodeType = typeof node.type === 'string' ? node.type : 'unknown';
                acc[nodeType] = (acc[nodeType] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
            },
          });
        }
      } catch (fallbackError) {
        console.warn('Post-Neo4j fallback chapter graph generation failed:', fallbackError);
      }
    }

    return NextResponse.json({
      success: true,
      chapterNumber,
      data: graphData,
      chapters: allChapters,
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
    console.error('Chapter graph error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch chapter graph',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
