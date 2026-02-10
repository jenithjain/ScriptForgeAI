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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize schema if needed
    await initializeGraphSchema();

    // Get workflowId from query params if provided
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    // Get the graph data, filtered by workflowId if provided
    const graphData = await getGraphOverview(workflowId || undefined);

    return NextResponse.json({
      success: true,
      data: graphData,
      workflowId: workflowId || null,
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
