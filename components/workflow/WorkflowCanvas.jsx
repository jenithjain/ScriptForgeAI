'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import AgentModules from './AgentModules';
import AgentNode from './AgentNode';
import AgentDetailModal from './AgentDetailModal';
import AgentIcon from './AgentIcon';
import { AGENT_DEFINITIONS } from '@/lib/agents/definitions';
import { 
  ChevronLeft, ChevronRight, ChevronDown, Play, Save, Settings,
  Loader2, CheckCircle, XCircle, Sparkles, X, Home, Brain, Download, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const nodeTypes = {
  agent: AgentNode,
};

// Custom Edge Component with Label
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, data, label, style }) {
  const edgePath = `M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={style?.stroke || '#10B981'}
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12, fill: '#10B981' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {label}
          </textPath>
        </text>
      )}
    </>
  );
}

const edgeTypes = {
  custom: CustomEdge,
};

export default function WorkflowCanvas({ 
  workflow, 
  onSave, 
  onExecute,
  onUpdateNodes,
  onUpdateEdges 
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showStrategy, setShowStrategy] = useState(true);
  const [showModules, setShowModules] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAgent, setDetailAgent] = useState(null);
  const [generatedStrategy, setGeneratedStrategy] = useState('');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState(null);

  // Theme detection
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    updateTheme();
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Auto-layout nodes to prevent overlapping
  useEffect(() => {
    if (nodes.length > 0 && workflow?.nodes) {
      const layoutNodes = autoLayoutNodes(workflow.nodes);
      // Add click handler to all nodes
      const nodesWithHandlers = layoutNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onNodeClick: handleNodeClick
        }
      }));
      setNodes(nodesWithHandlers);
    }
  }, [workflow]);

  // Update edges to use smooth bezier curves
  useEffect(() => {
    if (workflow?.edges) {
      const updatedEdges = workflow.edges.map(edge => ({
        ...edge,
        type: 'default', // Bezier curves
        animated: true,
        style: {
          stroke: '#10B981',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10B981',
          width: 12,
          height: 12,
        }
      }));
      setEdges(updatedEdges);
    }
  }, [workflow]);

  // Generate strategy with Gemini (only if not already generated)
  useEffect(() => {
    if (workflow) {
      // Use existing strategy if available
      if (workflow.strategy) {
        setGeneratedStrategy(workflow.strategy);
      } else if (!generatedStrategy && !isGeneratingStrategy) {
        generateStrategy();
      }
    }
  }, [workflow]);

  const autoLayoutNodes = (originalNodes) => {
    // Implement hierarchical layout to prevent overlapping
    const HORIZONTAL_SPACING = 400;
    const VERTICAL_SPACING = 200;
    const START_X = 100;
    const START_Y = 100;

    // Build adjacency map
    const adjacencyMap = new Map();
    const inDegree = new Map();
    
    originalNodes.forEach(node => {
      adjacencyMap.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    edges.forEach(edge => {
      if (adjacencyMap.has(edge.source)) {
        adjacencyMap.get(edge.source).push(edge.target);
      }
      if (inDegree.has(edge.target)) {
        inDegree.set(edge.target, inDegree.get(edge.target) + 1);
      }
    });

    // Find root nodes (no incoming edges)
    const rootNodes = originalNodes.filter(node => inDegree.get(node.id) === 0);
    
    // If no clear hierarchy, use grid layout
    if (rootNodes.length === 0 || rootNodes.length === originalNodes.length) {
      const columns = Math.ceil(Math.sqrt(originalNodes.length));
      return originalNodes.map((node, index) => ({
        ...node,
        position: {
          x: START_X + (index % columns) * HORIZONTAL_SPACING,
          y: START_Y + Math.floor(index / columns) * VERTICAL_SPACING
        }
      }));
    }

    // BFS layout from root nodes
    const positioned = new Map();
    const levels = new Map();
    let currentLevel = 0;

    const queue = rootNodes.map(node => ({ node, level: 0 }));
    rootNodes.forEach(node => levels.set(node.id, 0));

    while (queue.length > 0) {
      const { node, level } = queue.shift();
      currentLevel = Math.max(currentLevel, level);
      
      const children = adjacencyMap.get(node.id) || [];
      children.forEach(childId => {
        if (!levels.has(childId)) {
          levels.set(childId, level + 1);
          const childNode = originalNodes.find(n => n.id === childId);
          if (childNode) {
            queue.push({ node: childNode, level: level + 1 });
          }
        }
      });
    }

    // Position nodes by level
    const nodesByLevel = new Map();
    originalNodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level).push(node);
    });

    return originalNodes.map(node => {
      const level = levels.get(node.id) || 0;
      const nodesInLevel = nodesByLevel.get(level) || [];
      const indexInLevel = nodesInLevel.findIndex(n => n.id === node.id);
      const totalInLevel = nodesInLevel.length;
      
      // Center nodes vertically within each level
      const yOffset = (indexInLevel - (totalInLevel - 1) / 2) * VERTICAL_SPACING;
      
      return {
        ...node,
        position: {
          x: START_X + level * HORIZONTAL_SPACING,
          y: START_Y + yOffset + (currentLevel * VERTICAL_SPACING / 2)
        }
      };
    });
  };

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const response = await fetch('/api/scriptforge/workflows/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow._id,
          brief: workflow.brief || workflow.description,
          nodes: nodes
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedStrategy(data.strategy);
      }
    } catch (error) {
      console.error('Failed to generate strategy:', error);
      setGeneratedStrategy(workflow?.description || 'This workflow orchestrates multiple AI agents to achieve your goals.');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleNodeClick = useCallback((nodeId, nodeData) => {
    const fullNode = nodes.find(n => n.id === nodeId);
    if (fullNode) {
      setDetailAgent(fullNode);
      setShowDetailModal(true);
    }
  }, [nodes]);

  const handleRunAgentFromModal = useCallback((agent) => {
    // Trigger agent execution
    if (agent.data?.onRun) {
      agent.data.onRun(agent.data.agentType);
    }
    setShowDetailModal(false);
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const agentData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );

      if (!agentData) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left - 140,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode = {
        id: `node-${Date.now()}`,
        type: 'agent',
        position,
        data: {
          ...agentData,
          status: 'idle',
          onNodeClick: handleNodeClick
        }
      };

      setNodes((nds) => nds.concat(newNode));
      onUpdateNodes?.([...nodes, newNode]);
    },
    [nodes, onUpdateNodes, setNodes]
  );

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'default', // Using default type which provides smooth bezier curves
        animated: true,
        style: { 
          stroke: '#10B981', 
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10B981',
          width: 12,
          height: 12,
        },
        data: {
          semantic: 'data flow',
          description: 'Connect these agents'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      onUpdateEdges?.([...edges, newEdge]);
    },
    [edges, onUpdateEdges, setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const handleEdgeLabelUpdate = (edgeId, newLabel) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, label: newLabel, data: { ...edge.data, semantic: newLabel } }
          : edge
      )
    );
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    await onExecute?.();
    setIsExecuting(false);
  };

  const handleExportWorkflow = () => {
    try {
      const workflowData = {
        name: workflow?.name || 'workflow',
        description: workflow?.description || '',
        brief: workflow?.brief || '',
        nodes: nodes,
        edges: edges,
        strategy: generatedStrategy,
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(workflowData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow-${workflow?.name || 'export'}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Workflow exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export workflow');
    }
  };

  const handleImportWorkflow = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (importedData.nodes && importedData.edges) {
          // Add click handlers to imported nodes
          const nodesWithHandlers = importedData.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              onNodeClick: handleNodeClick
            }
          }));
          
          setNodes(nodesWithHandlers);
          setEdges(importedData.edges);
          
          if (importedData.strategy) {
            setGeneratedStrategy(importedData.strategy);
          }
          
          toast.success('Workflow imported successfully!');
          onUpdateNodes?.(nodesWithHandlers);
          onUpdateEdges?.(importedData.edges);
        } else {
          toast.error('Invalid workflow file format');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import workflow. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOverCanvas = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const isJsonFile = event.dataTransfer.types.includes('Files');
    if (isJsonFile) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDropOnCanvas = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (jsonFile) {
      handleImportWorkflow(jsonFile);
    }
  }, [nodes]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Brief
          </Button>
          <Separator orientation="vertical" className="h-6 bg-border" />
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/dashboard'}
            className="text-muted-foreground hover:text-foreground"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <span className="text-sm font-semibold text-foreground">Workflow Canvas</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 font-semibold"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Campaign...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Campaign
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setNodes(workflow?.nodes || [])}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Settings className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={() => onSave?.(nodes, edges)}
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={handleExportWorkflow}
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => document.getElementById('workflow-import-input')?.click()}
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <input
            id="workflow-import-input"
            type="file"
            accept=".json,application/json"
            onChange={(e) => e.target.files?.[0] && handleImportWorkflow(e.target.files[0])}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => window.location.href = '/workflows'}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            Past Workflows
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Strategy */}
        <div 
          className={`transition-all duration-300 ${showStrategy ? 'w-96' : 'w-0'} overflow-hidden bg-card/50 backdrop-blur-xl border-r border-border`}
        >
        <div className="h-full flex flex-col">
          <div className="p-6 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Brain className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    AI Strategy
                  </h2>
                  <p className="text-xs text-muted-foreground">Workflow reasoning</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStrategy(false)}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-hidden px-6">
            <div className="h-full flex flex-col">
              {/* Strategic Approach - Scrollable */}
              <div className="flex-1 overflow-y-auto mb-2 workflow-sidebar-scroll pr-1">
                <div className="pb-4">
                  <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        Strategic Approach
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isGeneratingStrategy ? (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Generating strategy...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {generatedStrategy || workflow?.description || 'This workflow orchestrates multiple AI agents to achieve your goals.'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Progress Card - Fixed at bottom */}
              {workflow?.progress && (
                <div className="shrink-0 pb-6">
                  <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-foreground">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Completed</span>
                          <span>{workflow.progress.completedNodes.length}/{workflow.progress.totalNodes}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{
                              width: `${(workflow.progress.completedNodes.length / workflow.progress.totalNodes) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapse button for left sidebar */}
      {!showStrategy && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStrategy(true)}
          className="absolute top-20 left-4 z-10 bg-card/80 backdrop-blur-xl border-border text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={(e) => {
            // Check if it's a JSON file drop
            const files = Array.from(e.dataTransfer.files);
            const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
            if (jsonFile) {
              handleDropOnCanvas(e);
            } else {
              onDrop(e);
            }
          }}
          onDragOver={(e) => {
            onDragOver(e);
            handleDragOverCanvas(e);
          }}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Background 
            variant={BackgroundVariant.Dots}
            color={isDarkMode ? '#374151' : '#d1d5db'} 
            gap={24} 
            size={2}
          />
          <Controls className="bg-card/80 backdrop-blur-xl border border-border [&>button]:text-muted-foreground [&>button:hover]:bg-accent [&>button:hover]:text-foreground" />
          <MiniMap 
            nodeColor={(node) => node.data.color || '#10B981'}
            className="bg-card/80 backdrop-blur-xl border border-border"
            maskColor={isDarkMode ? 'rgb(15 23 42 / 0.9)' : 'rgb(241 245 249 / 0.9)'}
          />
        </ReactFlow>

        {/* Agent Detail Modal */}
        <AgentDetailModal
          agent={detailAgent}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onRunAgent={handleRunAgentFromModal}
        />

        {/* Right Sidebar - Available Modules (Top to Bottom) */}
        <div className="absolute top-4 right-4 z-10 w-80">
          <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl ${
              showModules ? 'max-h-[calc(100vh-8rem)] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col max-h-[calc(100vh-8rem)]">
              <div 
                className="p-4 shrink-0 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors border-b border-border"
                onClick={() => setShowModules(!showModules)}
              >
                <h2 className="text-sm font-medium text-foreground">
                  Available Modules
                </h2>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showModules ? '' : 'rotate-180'}`} />
              </div>

              <ScrollArea className="flex-1 p-4 overflow-y-auto workflow-sidebar-scroll">
                <div className="space-y-2">
                  {Object.entries(AGENT_DEFINITIONS).map(([agentId, agent]) => (
                    <div
                      key={agentId}
                      className="rounded-lg border border-border/40 bg-card/30 overflow-hidden transition-all"
                    >
                      {/* Agent Header - Clickable */}
                      <div
                        className="p-3 cursor-pointer hover:bg-card/60 transition-all"
                        onClick={() => setExpandedAgentId(expandedAgentId === agentId ? null : agentId)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2 rounded-lg shrink-0"
                            style={{ 
                              backgroundColor: `${agent.color}15`,
                            }}
                          >
                            <AgentIcon name={agent.icon} className="w-4 h-4" color={agent.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm">{agent.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {agent.description.split(' - ')[1] || agent.description}
                            </p>
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                              expandedAgentId === agentId ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>
                      </div>

                      {/* Agent Details - Expandable */}
                      <div 
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          expandedAgentId === agentId ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-border/20">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1">Description:</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {agent.description}
                              </p>
                            </div>
                            
                            {agent.capabilities && agent.capabilities.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-foreground mb-1">Capabilities:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {agent.capabilities.map((capability, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="text-emerald-500 mt-0.5">•</span>
                                      <span>{capability}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {agent.tools && agent.tools.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-foreground mb-1">Tools:</p>
                                <div className="flex flex-wrap gap-1">
                                  {agent.tools.map((tool, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="outline" 
                                      className="text-xs px-1.5 py-0.5"
                                      style={{ borderColor: `${agent.color}40`, color: agent.color }}
                                    >
                                      {tool}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Toggle button when collapsed */}
          {!showModules && (
            <div 
              onClick={() => setShowModules(true)}
              className="cursor-pointer bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl p-4 flex items-center justify-between hover:bg-accent/50 transition-colors w-full"
            >
              <h2 className="text-sm font-medium text-foreground">
                Available Modules
              </h2>
              <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180" />
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
