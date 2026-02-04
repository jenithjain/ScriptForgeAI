import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { scriptForgeAI } from '@/lib/scriptforge-ai';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { brief, inputs } = body;

    if (!brief) {
      return NextResponse.json(
        { error: 'Brief is required' },
        { status: 400 }
      );
    }

    // Generate workflow using Gemini
    const { workflow, reasoning } = await scriptForgeAI.generateWorkflow(
      { brief, inputs },
      session.user.id
    );

    // Save to database
    const savedWorkflow = await ScriptWorkflow.create(workflow);

    return NextResponse.json({
      success: true,
      workflow: savedWorkflow,
      reasoning
    });
  } catch (error) {
    console.error('Error generating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}
