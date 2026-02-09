import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { AGENT_DEFINITIONS } from '@/lib/agents/definitions';
import { executeAgent } from '@/lib/agents/agent-executor';

/**
 * Deep clone helper for safely modifying nested objects
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Execute a single agent within a workflow
 */
async function executeSingleAgent(workflow, nodeId, agentType, customPrompt = null) {
  try {
    // Deep clone nodes to ensure Mongoose detects changes
    let nodesClone = deepClone(workflow.nodes);
    const nodeIndex = nodesClone.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      return NextResponse.json(
        { error: 'Node not found in workflow' },
        { status: 404 }
      );
    }
    
    const node = nodesClone[nodeIndex];

    // Build context from workflow and any previously executed agents
    let agentContext = {
      storyBrief: workflow.brief || '',
      manuscript: workflow.inputs?.manuscript || workflow.inputs?.fullText || '',
      previousResults: {},
      customPrompt: customPrompt || node.data.customPrompt || null,
      workflowId: workflow._id.toString(),
    };

    // Collect results from previously executed agents
    for (const n of nodesClone) {
      if (n.id !== nodeId && n.data.result) {
        agentContext.previousResults[n.data.agentType] = n.data.result;
        
        // Restore context from previous results
        if (n.data.agentType === 'story-intelligence') {
          agentContext.storyContext = n.data.result;
        } else if (n.data.agentType === 'knowledge-graph') {
          agentContext.knowledgeGraph = n.data.result;
        } else if (n.data.agentType === 'temporal-reasoning') {
          agentContext.timeline = n.data.result;
        } else if (n.data.agentType === 'continuity-validator') {
          agentContext.continuityReport = n.data.result;
        } else if (n.data.agentType === 'creative-coauthor') {
          agentContext.suggestions = n.data.result;
        } else if (n.data.agentType === 'intelligent-recall') {
          agentContext.memoryBank = n.data.result;
        }
      }
    }

    // Update node status to running and store custom prompt if provided
    node.data.status = 'running';
    if (customPrompt) {
      node.data.customPrompt = customPrompt;
    }
    
    // Reassign the entire nodes array to ensure Mongoose detects the change
    workflow.nodes = nodesClone;
    workflow.markModified('nodes');
    await workflow.save();
    console.log(`Saved workflow with node ${nodeId} status: running`);

    // Execute the agent
    const effectiveAgentType = agentType || node.data.agentType;
    console.log(`Executing single agent: ${effectiveAgentType}`);
    
    const { result, updatedContext } = await executeAgent(effectiveAgentType, agentContext);

    // Update node with results - re-clone to get fresh state
    nodesClone = deepClone(workflow.nodes);
    const updatedNode = nodesClone.find(n => n.id === nodeId);
    if (updatedNode) {
      updatedNode.data.status = 'success';
      updatedNode.data.result = result;
      updatedNode.data.output = formatAgentOutput(effectiveAgentType, result);
      updatedNode.data.error = null; // Clear any previous error
      updatedNode.data.input = {
        storyBrief: agentContext.storyBrief?.substring(0, 500) + '...',
        hasManuscript: !!agentContext.manuscript,
        previousAgents: Object.keys(agentContext.previousResults)
      };
    }

    // Update workflow analysis context
    const newAnalysisContext = {
      ...(workflow.analysisContext || {}),
      ...updatedContext
    };
    
    // Reassign arrays/objects completely to force Mongoose to detect changes
    workflow.nodes = nodesClone;
    workflow.analysisContext = newAnalysisContext;
    workflow.markModified('nodes');
    workflow.markModified('analysisContext');
    
    await workflow.save();
    console.log(`Saved workflow with node ${nodeId} status: success, result keys:`, result ? Object.keys(result) : 'null');

    // Convert to plain object for response - use updatedNode which has the result
    const nodeDataResponse = {
      ...updatedNode.data,
      status: 'success',
      result: result,
      output: formatAgentOutput(effectiveAgentType, result),
      input: updatedNode.data.input
    };

    console.log('Returning nodeData:', nodeDataResponse);

    return NextResponse.json({
      success: true,
      result: result,
      nodeData: nodeDataResponse,
      message: `${effectiveAgentType} executed successfully`
    });
  } catch (error) {
    console.error(`Error executing single agent:`, error);
    
    // Update node with error using deep clone approach
    try {
      const errorNodesClone = deepClone(workflow.nodes);
      const errorNode = errorNodesClone.find(n => n.id === nodeId);
      if (errorNode) {
        errorNode.data.status = 'error';
        errorNode.data.error = error.message;
        workflow.nodes = errorNodesClone;
        workflow.markModified('nodes');
        await workflow.save();
        console.log(`Saved workflow with node ${nodeId} status: error`);
      }
    } catch (saveError) {
      console.error('Failed to save error state:', saveError);
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

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
    const { workflowId, singleAgentId, agentType: requestedAgentType, customPrompt } = body;

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

    // Handle single agent execution
    if (singleAgentId) {
      return await executeSingleAgent(workflow, singleAgentId, requestedAgentType, customPrompt);
    }

    // Full workflow execution
    // Update status to running - use deep clone approach
    let nodesClone = deepClone(workflow.nodes);
    
    workflow.status = 'running';
    workflow.lastRun = new Date();
    workflow.progress = {
      currentNode: nodesClone[0]?.id,
      completedNodes: [],
      totalNodes: nodesClone.length,
      errors: []
    };
    workflow.nodes = nodesClone;
    workflow.markModified('nodes');
    workflow.markModified('progress');
    await workflow.save();

    // Execute workflow nodes sequentially using the specialized agent executor
    const results = [];
    
    // Build the shared agent context from workflow data
    // The story brief is the PRIMARY story input from workflow creation
    let agentContext = {
      storyBrief: workflow.brief || '',
      manuscript: workflow.inputs?.manuscript || workflow.inputs?.fullText || '',
      previousResults: {},
      workflowId: workflow._id.toString(),
    };

    for (let i = 0; i < nodesClone.length; i++) {
      const node = nodesClone[i];
      try {
        // Update node to running
        node.data.status = 'running';
        workflow.progress.currentNode = node.id;
        workflow.nodes = deepClone(nodesClone);
        workflow.markModified('nodes');
        workflow.markModified('progress');
        await workflow.save();

        const agentType = node.data.agentType;
        const agentDef = AGENT_DEFINITIONS[agentType];

        // Store input context for visibility
        node.data.input = {
          storyBrief: agentContext.storyBrief?.substring(0, 500) + '...',
          hasManuscript: !!agentContext.manuscript,
          previousAgents: Object.keys(agentContext.previousResults)
        };

        // Execute the specialized agent with shared context
        console.log(`Executing specialized agent: ${agentType}`);
        const { result, updatedContext } = await executeAgent(agentType, agentContext);
        
        // Update the shared context for subsequent agents
        agentContext = updatedContext;

        results.push({
          nodeId: node.id,
          agentType: agentType,
          agentName: agentDef?.name || node.data.label,
          result
        });

        // Update node with results
        node.data.status = 'success';
        node.data.result = result;
        node.data.output = formatAgentOutput(agentType, result);
        
        // Update progress
        workflow.progress.completedNodes.push(node.id);
        
        // Reassign the entire nodes array to ensure save
        workflow.nodes = deepClone(nodesClone);
        workflow.markModified('nodes');
        workflow.markModified('progress');
        await workflow.save();
        console.log(`Saved workflow with node ${node.id} (${agentType}) status: success`);
        
      } catch (error) {
        console.error(`Error executing node ${node.id}:`, error);
        node.data.status = 'error';
        node.data.error = error.message;
        workflow.progress.errors.push({
          nodeId: node.id,
          error: error.message
        });
        workflow.nodes = deepClone(nodesClone);
        workflow.markModified('nodes');
        workflow.markModified('progress');
        await workflow.save();
        // Continue to next agent instead of breaking - allow partial success
        continue;
      }
    }

    // Update final status
    const hasErrors = workflow.progress.errors.length > 0;
    const allFailed = workflow.progress.completedNodes.length === 0;
    workflow.status = allFailed ? 'error' : (hasErrors ? 'partial' : 'completed');
    workflow.progress.currentNode = undefined;
    
    // Store the full context for knowledge graph visualization
    workflow.analysisContext = agentContext;
    
    // Final save with all nodes including their results
    workflow.nodes = deepClone(nodesClone);
    workflow.markModified('nodes');
    workflow.markModified('progress');
    workflow.markModified('analysisContext');
    await workflow.save();
    console.log('Final workflow save complete. Nodes with results:', nodesClone.filter(n => n.data.result).length);

    return NextResponse.json({
      success: !allFailed,
      workflow,
      results,
      summary: generateExecutionSummary(results, agentContext)
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}

/**
 * Format agent output for display
 */
function formatAgentOutput(agentType, result) {
  try {
    switch (agentType) {
      case 'story-intelligence':
        return `**Genre:** ${result.genre}\n**Themes:** ${result.themes?.join(', ')}\n**Setting:** ${result.setting}\n**Main Conflict:** ${result.mainConflict}`;
      
      case 'knowledge-graph':
        return `**Characters:** ${result.characters?.length || 0}\n**Locations:** ${result.locations?.length || 0}\n**Events:** ${result.events?.length || 0}\n**Relationships:** ${result.relationships?.length || 0}\n**Plot Threads:** ${result.plotThreads?.length || 0}`;
      
      case 'temporal-reasoning':
        return `**Timeline Events:** ${result.chronologicalEvents?.length || 0}\n**Flashbacks:** ${result.flashbacks?.length || 0}\n**Causal Chains:** ${result.causalChains?.length || 0}\n**Issues Found:** ${result.temporalIssues?.length || 0}`;
      
      case 'continuity-validator':
        return `**Continuity Score:** ${result.continuityScore}/100\n**Contradictions:** ${result.contradictions?.length || 0}\n**Errors:** ${result.errors?.length || 0}\n**Recommendations:** ${result.recommendations?.length || 0}`;
      
      case 'creative-coauthor':
        return `**Scene Suggestions:** ${result.sceneSuggestions?.length || 0}\n**Plot Developments:** ${result.plotDevelopments?.length || 0}\n**Dialogue Ideas:** ${result.dialogueImprovements?.length || 0}\n**Character Arcs:** ${result.characterArcGuidance?.length || 0}`;
      
      case 'intelligent-recall':
        return `**Insights Generated:** ${result.length || 0}\n${result.slice(0, 3).map(a => `• ${a.query}`).join('\n')}`;
      
      case 'cinematic-teaser':
        return `**Tagline:** ${result.tagline}\n**Visual Scenes:** ${result.visualPrompts?.length || 0}\n**Hooks:** ${result.hooks?.join(' | ')}`;
      
      default:
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    }
  } catch (error) {
    return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  }
}

/**
 * Generate execution summary
 */
function generateExecutionSummary(results, context) {
  const summary = {
    agentsExecuted: results.length,
    successfulAgents: results.filter(r => !r.result?.error).length,
    storyAnalyzed: !!context.storyContext,
    knowledgeGraphBuilt: !!context.knowledgeGraph,
    timelineAnalyzed: !!context.timeline,
    continuityChecked: !!context.continuityReport,
    suggestionsGenerated: !!context.suggestions,
    teaserCreated: !!context.teaserContent,
    highlights: []
  };

  if (context.storyContext) {
    summary.highlights.push(`Genre identified: ${context.storyContext.genre}`);
  }
  if (context.knowledgeGraph) {
    summary.highlights.push(`${context.knowledgeGraph.characters?.length || 0} characters mapped`);
  }
  if (context.continuityReport) {
    summary.highlights.push(`Continuity score: ${context.continuityReport.continuityScore}/100`);
  }
  if (context.teaserContent) {
    summary.highlights.push(`Trailer tagline: "${context.teaserContent.tagline}"`);
  }

  return summary;
}
