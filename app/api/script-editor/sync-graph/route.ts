
import { NextRequest, NextResponse } from 'next/server';
import { analyzeManuscript } from '@/lib/agents/story-intelligence-core';
import { updateGraph, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';

export async function POST(request: NextRequest) {
  try {
    const { text, workflowId, chapterNumber = 1 } = await request.json();

    if (!text || !workflowId) {
      return NextResponse.json(
        { error: 'Text and workflowId are required' },
        { status: 400 }
      );
    }

    // 1. Analyze the new text using Gemini to extract graph elements
    const analysis = await analyzeManuscript(text, chapterNumber);
    
    // Attach workflowId to analysis for database storage
    analysis.workflowId = workflowId;
    // Ensure we mark this as "user-edit" or similar if possible, but version tracking is handled inside core
    // We might want to pass existing context? For now, we assume context is managed globally or re-inferred.

    // 2. Initialize schema (safe to call repeatedly)
    await initializeGraphSchema();

    // 3. Update the knowledge graph
    const result = await updateGraph(analysis);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Knowledge graph synchronized',
        analysisSummary: {
            characters: analysis.characters.length,
            locations: analysis.locations.length,
            events: analysis.events.length
        }
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Graph sync error:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize graph' },
      { status: 500 }
    );
  }
}
