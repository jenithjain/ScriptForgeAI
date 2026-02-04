/**
 * GET /api/story-graph/overview
 * 
 * Returns all nodes and edges for visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGraphOverview, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';

export async function GET(request: NextRequest) {
  try {
    // Initialize schema if needed
    await initializeGraphSchema();

    // Get the full graph
    const graphData = await getGraphOverview();

    return NextResponse.json({
      success: true,
      data: graphData,
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
