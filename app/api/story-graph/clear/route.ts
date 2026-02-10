/**
 * POST /api/story-graph/clear
 * 
 * Clears graph data from Neo4j
 * Pass workflowId in request body to clear only that workflow's data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { clearGraph } from '@/lib/agents/story-knowledge-graph';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const workflowId = body.workflowId;

    await clearGraph(workflowId);

    return NextResponse.json({
      success: true,
      message: workflowId
        ? `Graph data cleared for workflow ${workflowId}`
        : 'All graph data cleared successfully'
    });
  } catch (error) {
    console.error('Clear graph error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear graph',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
