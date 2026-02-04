import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getReasoningModel, generateWithRetry, parseJSONFromResponse } from '@/lib/gemini';
import dbConnect from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow unauthenticated access for strategy generation
    const { workflowId, brief, nodes } = await request.json();

    if (!brief || !nodes) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build prompt for Gemini 2.5 Pro - focus on story continuity, not campaigns
    const agentsList = nodes.map(node => `- ${node.data.label}: ${node.data.description}`).join('\n');
    
    const prompt = `You are an AI strategist analyzing a story writing workflow for ScriptForge, an intelligent script writing assistant that helps maintain narrative continuity.

STORY/SCRIPT BRIEF:
${brief}

WORKFLOW AGENTS:
${agentsList}

Generate a detailed strategic approach that:
1. Identifies how the agents work together to ensure story continuity
2. Explains how the knowledge graph tracks characters, locations, and plot threads
3. Outlines how temporal reasoning maintains timeline consistency
4. Describes the validation process for catching plot holes and contradictions
5. Provides insights on the creative assistance features

Format your response as a well-structured narrative text (2-3 paragraphs) that explains the strategic thinking behind this story intelligence workflow. Focus on being insightful about narrative continuity and story tracking.

Return ONLY the strategy text, no JSON formatting needed.`;

    const model = getReasoningModel();
    const strategyText = await generateWithRetry(model, prompt, 3);
    
    // Save strategy to workflow if workflowId provided
    if (workflowId) {
      try {
        await dbConnect();
        await ScriptWorkflow.findByIdAndUpdate(workflowId, {
          strategy: strategyText.trim()
        });
      } catch (dbError) {
        console.error('Failed to save strategy to workflow:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      strategy: strategyText.trim()
    });

  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate strategy',
        strategy: 'This workflow orchestrates multiple AI agents to ensure story continuity, track narrative elements, and provide intelligent writing assistance.'
      },
      { status: 500 }
    );
  }
}
