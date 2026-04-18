/**
 * GET /api/story-graph/chapters
 * 
 * Returns all chapters from the story graph
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAllChapters, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';
import { isNeo4jAvailable } from '@/lib/neo4j';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { buildFallbackChapters } from '@/lib/story-graph-fallback';

async function getWorkflowFallbackChapters(workflowId: string | null, userId: string) {
  if (!workflowId) {
    return [];
  }

  await connectDB();
  const workflow = await ScriptWorkflow.findOne({
    _id: workflowId,
    userId,
  })
    .select('_id brief')
    .lean();

  return buildFallbackChapters(workflow);
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

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    const neo4jAvailable = await isNeo4jAvailable();
    if (!neo4jAvailable) {
      let chapters: { id: string; number: number; summary: string }[] = [];

      if (workflowId) {
        try {
          chapters = await getWorkflowFallbackChapters(workflowId, userId);
        } catch (fallbackError) {
          console.warn('Fallback chapter generation failed:', fallbackError);
        }
      }

      return NextResponse.json({
        success: true,
        chapters,
        count: chapters.length,
        neo4jAvailable: false,
        fallbackSource: 'workflow-analysis-context',
        warning: 'Neo4j is unavailable. Showing fallback chapters.',
      });
    }

    // Initialize schema if needed
    await initializeGraphSchema();

    // Get all chapters
    const chapters = await getAllChapters();

    // Neo4j may be connected but empty; provide workflow-derived chapter fallback.
    if (workflowId && chapters.length === 0) {
      try {
        const fallbackChapters = await getWorkflowFallbackChapters(workflowId, userId);
        if (fallbackChapters.length > 0) {
          return NextResponse.json({
            success: true,
            chapters: fallbackChapters,
            count: fallbackChapters.length,
            neo4jAvailable: true,
            fallbackSource: 'workflow-analysis-context',
            warning: 'Neo4j connected, but no chapter graph data found yet. Showing fallback chapters.',
          });
        }
      } catch (fallbackError) {
        console.warn('Post-Neo4j fallback chapter generation failed:', fallbackError);
      }
    }

    return NextResponse.json({
      success: true,
      chapters,
      count: chapters.length,
      neo4jAvailable: true,
    });
  } catch (error) {
    console.error('Chapters fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch chapters',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
