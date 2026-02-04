import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { scriptForgeAI } from '@/lib/scriptforge-ai';
import { getReasoningModel, generateWithRetry } from '@/lib/gemini';
import { AGENT_DEFINITIONS } from '@/lib/agents/definitions';

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
    const { workflowId } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const workflow = await ScriptWorkflow.findOne({
      _id: workflowId,
      userId: session.user.id
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Update status to running
    workflow.status = 'running';
    workflow.lastRun = new Date();
    workflow.progress = {
      currentNode: workflow.nodes[0]?.id,
      completedNodes: [],
      totalNodes: workflow.nodes.length,
      errors: []
    };
    await workflow.save();

    // Execute workflow nodes sequentially
    const results = [];
    let context = {
      brief: workflow.brief,
      inputs: workflow.inputs
    };

    for (const node of workflow.nodes) {
      try {
        workflow.progress.currentNode = node.id;
        node.data.status = 'running';
        await workflow.save();

        // Build prompt for Gemini 2.5 Pro
        const agentDef = AGENT_DEFINITIONS[node.data.agentType];
        const previousContext = results.length > 0 
          ? `\n\nPREVIOUS AGENT OUTPUTS:\n${results.map(r => `${r.agentType}: ${JSON.stringify(r.result, null, 2)}`).join('\n\n')}`
          : '';

        const prompt = `You are the ${agentDef?.name || node.data.label} agent.

AGENT DESCRIPTION:
${agentDef?.description || node.data.description}

CAPABILITIES:
${agentDef?.capabilities?.join('\n- ') || 'Execute specialized tasks'}

CAMPAIGN BRIEF:
${workflow.brief}

WORKFLOW INPUTS:
${JSON.stringify(workflow.inputs, null, 2)}
${previousContext}

YOUR TASK:
Perform your specialized function as the ${agentDef?.name || node.data.label} agent.
Analyze the brief, consider previous outputs, and generate high-quality results.

Return your output in a structured format that the next agent can use.`;

        // Store the prompt in node data for visibility
        node.data.prompt = prompt;
        node.data.input = {
          brief: workflow.brief,
          context,
          previousResults: results.length
        };
        await workflow.save();

        // Execute with Gemini 2.5 Pro
        const model = getReasoningModel();
        const result = await generateWithRetry(model, prompt, 3);

        results.push({
          nodeId: node.id,
          agentType: node.data.agentType,
          result
        });

        node.data.status = 'success';
        node.data.result = result;
        node.data.output = result;
        workflow.progress.completedNodes.push(node.id);
        
        // Update context for next agent
        context = { ...context, [node.data.agentType]: result };
        
        await workflow.save();
      } catch (error) {
        console.error(`Error executing node ${node.id}:`, error);
        node.data.status = 'error';
        node.data.error = error.message;
        workflow.progress.errors.push({
          nodeId: node.id,
          error: error.message
        });
        await workflow.save();
        break;
      }
    }

    // Update final status
    const hasErrors = workflow.progress.errors.length > 0;
    workflow.status = hasErrors ? 'error' : 'completed';
    workflow.progress.currentNode = undefined;
    await workflow.save();

    return NextResponse.json({
      success: true,
      workflow,
      results
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
