/**
 * GET /api/story-graph/chapters
 * 
 * Returns all chapters from the story graph
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAllChapters, initializeGraphSchema } from '@/lib/agents/story-knowledge-graph';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize schema if needed
    await initializeGraphSchema();

    // Get all chapters
    const chapters = await getAllChapters();

    return NextResponse.json({
      success: true,
      chapters,
      count: chapters.length
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
