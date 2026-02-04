/**
 * GET /api/story-graph/chapter/[id]
 * 
 * Returns time-filtered graph for a specific chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGraphByChapter, getAllChapters, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapterNumber = parseInt(id, 10);

    if (isNaN(chapterNumber) || chapterNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid chapter ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Initialize schema if needed
    await initializeGraphSchema();

    // Get chapter-specific graph
    const graphData = await getGraphByChapter(chapterNumber);

    // Get all chapters for navigation
    const allChapters = await getAllChapters();

    return NextResponse.json({
      success: true,
      chapterNumber,
      data: graphData,
      chapters: allChapters,
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
