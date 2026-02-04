/**
 * POST /api/story-graph/update
 * 
 * Handles direct graph updates from Knowledge Graph Agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateGraph, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';
import type { StoryAnalysisResult } from '@/lib/agents/story-intelligence-core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis } = body;

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!analysis.chapterId || !analysis.chapterNumber) {
      return NextResponse.json(
        { error: 'Invalid analysis data: chapterId and chapterNumber are required' },
        { status: 400 }
      );
    }

    // Initialize schema if needed
    await initializeGraphSchema();

    // Update the graph
    const result = await updateGraph(analysis as StoryAnalysisResult);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        chapterId: analysis.chapterId,
        nodesCreated: {
          characters: analysis.characters?.length || 0,
          locations: analysis.locations?.length || 0,
          objects: analysis.objects?.length || 0,
          events: analysis.events?.length || 0,
          plotThreads: analysis.plotThreads?.length || 0
        },
        relationshipsCreated: analysis.relationships?.length || 0
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Graph update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update graph',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
