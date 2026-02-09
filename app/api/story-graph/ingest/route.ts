/**
 * POST /api/story-graph/ingest
 * 
 * Triggers Story Intelligence Core to analyze manuscript text
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeManuscript, getGlobalContext } from '@/lib/agents/story-intelligence-core';
import { updateGraph, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, chapterNumber = 1, storeInGraph = true } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Text must be at least 50 characters long' },
        { status: 400 }
      );
    }

    // Get current context
    const existingContext = getGlobalContext();

    // Analyze the manuscript text
    console.log(`Analyzing manuscript chapter ${chapterNumber}...`);
    const analysis = await analyzeManuscript(text, chapterNumber, existingContext);

    // Store in Neo4j if requested
    let graphUpdateResult: { success: boolean; message: string } | null = null;
    if (storeInGraph) {
      try {
        // Initialize schema if needed
        await initializeGraphSchema();
        
        // Update the graph
        graphUpdateResult = await updateGraph(analysis);
        console.log('Graph update result:', graphUpdateResult);
      } catch (graphError) {
        console.error('Failed to update graph:', graphError);
        // Continue even if graph update fails
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        chapterId: analysis.chapterId,
        chapterNumber: analysis.chapterNumber,
        version: analysis.version,
        summary: analysis.summary,
        characters: analysis.characters,
        locations: analysis.locations,
        objects: analysis.objects,
        events: analysis.events,
        relationships: analysis.relationships,
        plotThreads: analysis.plotThreads,
        temporalMarkers: analysis.temporalMarkers,
        stateChanges: analysis.stateChanges,
        context: analysis.context
      },
      graphUpdate: graphUpdateResult,
      stats: {
        charactersFound: analysis.characters.length,
        locationsFound: analysis.locations.length,
        objectsFound: analysis.objects.length,
        eventsFound: analysis.events.length,
        relationshipsFound: analysis.relationships.length,
        plotThreadsFound: analysis.plotThreads.length
      }
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
