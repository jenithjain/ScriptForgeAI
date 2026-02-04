'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Download,
  Sparkles,
  X,
  Settings2,
  Home,
  UploadCloud,
  ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed ScrollArea (using native overflow containers for side panels)
import AgentNode from '@/components/campaign/AgentNode';
import SmartEdge from '@/components/campaign/SmartEdge';
import { useCampaignStore } from '@/lib/store';
import { getExecutionOrder, canExecuteNode } from '@/lib/execution-engine';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea as ModalScrollArea } from '@/components/ui/scroll-area';

const nodeTypes = {
  agentNode: AgentNode,
};

const edgeTypes = {
  smartEdge: SmartEdge,
};

export default function CampaignCanvasPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [editingNodeOutput, setEditingNodeOutput] = useState('');
  const [editingNodeLabel, setEditingNodeLabel] = useState('');
  const [editingNodePurpose, setEditingNodePurpose] = useState('');
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [executingNodeId, setExecutingNodeId] = useState(null);
  const [modalLightboxImage, setModalLightboxImage] = useState(null);
  // Workflow persistence state
  const [workflowsModalOpen, setWorkflowsModalOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [kycProfile, setKycProfile] = useState(null);

  const {
    nodes: storeNodes,
    edges: storeEdges,
    brief,
    strategy,
    setWorkflow,
    updateNodePrompt,
    updateNodeStatus,
  } = useCampaignStore();

  const [nodes, setNodes, rawOnNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync store changes to local state
  useEffect(() => {
    // inject openSettings handler into node data
    const enhanced = storeNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        openSettings: () => {
          setEditingNodeId(n.id);
          setEditingPrompt(n.data.promptContext || '');
          setEditingNodeOutput(n.data.output || '');
          setEditingNodeLabel(n.data.label || 'Agent Configuration');
          setEditingNodePurpose(
            n.data.description || n.data.promptContext || 'Configure prompts and view this agent\'s output.'
          );
          setPromptModalOpen(true);
        },
        isExecuting: n.id === executingNodeId
      }
    }));
    setNodes(enhanced);
  }, [storeNodes, setNodes, executingNodeId]);

  // Sync edges with execution animation
  React.useEffect(() => {
    if (!executingNodeId) {
      setEdges(storeEdges.map(e => ({ ...e, animated: false, style: { ...e.style, stroke: undefined } })));
      return;
    }
    // Highlight edges connected to executing node
    const enhanced = storeEdges.map(edge => {
      const isActive = edge.source === executingNodeId || edge.target === executingNodeId;
      return {
        ...edge,
        animated: isActive,
        style: isActive ? { stroke: '#10b981', strokeWidth: 2.5 } : edge.style
      };
    });
    setEdges(enhanced);
  }, [storeEdges, setEdges, executingNodeId]);

  // Fetch KYC profile for current user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/kyc');
        const json = await res.json();
        if (json?.businessProfile) setKycProfile(json.businessProfile);
      } catch {}
    })();
  }, []);

  // Highlight KYC values inline within the strategy markdown
  const highlightedStrategy = useMemo(() => {
    if (!strategy?.rationale) return '';
    if (!kycProfile) return strategy.rationale;
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let text = strategy.rationale;
    Object.entries(kycProfile).forEach(([key, value]) => {
      if (value == null) return;
      const values = Array.isArray(value) ? value : [value];
      values.forEach((val) => {
        const str = String(val).trim();
        if (!str) return;
        const re = new RegExp(`\\b${escapeRegExp(str)}\\b`, 'gi');
        text = text.replace(re, (m) => `<span class=\"kyc-chip\" title=\"KYC: ${key}\">${m}</span>`);
      });
    });
    return text;
  }, [strategy, kycProfile]);

  // Redirect if no campaign data
  React.useEffect(() => {
    if (!strategy || !brief || storeNodes.length === 0) {
      router.push('/campaign');
    }
  }, [strategy, brief, storeNodes, router]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Persist node position changes to store to avoid resets after status updates
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((current) => {
        const updated = applyNodeChanges(changes, current);
        if (changes.length > 0) {
          const sanitized = updated.map(n => {
            const { openSettings, ...restData } = n.data || {};
            return { ...n, data: { ...restData } };
          });
          // Defer store update to avoid React setState during render warning
          queueMicrotask(() => setWorkflow(sanitized, storeEdges));
        }
        return updated;
      });
    },
    [setNodes, setWorkflow, storeEdges]
  );

  const handleRunAll = async () => {
    try {
      setIsRunning(true);
      const executionOrder = getExecutionOrder(storeNodes, storeEdges);
      
      for (const nodeId of executionOrder) {
        const { canExecute, reason } = canExecuteNode(nodeId, storeNodes, storeEdges);
        
        if (!canExecute) {
          console.log(`Skipping ${nodeId}: ${reason}`);
          continue;
        }

        const node = storeNodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Visual feedback: highlight executing node
        setExecutingNodeId(nodeId);
        toast.success(`Executing: ${node.data.label}`);
        
        // Execute node via API
        updateNodeStatus(nodeId, 'loading');
        try {
          const response = await fetch('/api/campaign/execute-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId,
              nodes: storeNodes,
              edges: storeEdges,
              brief,
              strategy: strategy?.rationale || '',
            }),
          });
          const result = await response.json();
          if (result.success) {
            updateNodeStatus(nodeId, 'complete', result.output);
            // Brief pause for visual feedback
            await new Promise(resolve => setTimeout(resolve, 800));
          } else {
            updateNodeStatus(nodeId, 'error', undefined, result.error);
            toast.error(`Failed: ${node.data.label}`);
          }
        } catch (e) {
          updateNodeStatus(nodeId, 'error', undefined, e.message);
          toast.error(`Error: ${node.data.label}`);
        }
      }

      setExecutingNodeId(null);
      toast.success('Campaign workflow completed!');
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('Failed to run workflow');
    } finally {
      setIsRunning(false);
      setExecutingNodeId(null);
    }
  };

  const handleReset = () => {
    // Reset all nodes to idle state
    const resetNodes = storeNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: 'idle',
        output: undefined,
        error: undefined,
      }
    }));
    setWorkflow(resetNodes, storeEdges);
    toast.success('Workflow reset');
  };

  const handleExport = () => {
    // Export campaign data
    const exportData = {
      brief,
      strategy,
      workflow: {
        nodes: storeNodes,
        edges: storeEdges,
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Campaign exported!');
  };

  // Save current workflow to server
  const handleSaveWorkflow = async () => {
    if (isSavingWorkflow) return;
    setIsSavingWorkflow(true);
    try {
      const sanitizedNodes = storeNodes.map(n => {
        const { openSettings, ...restData } = n.data || {};
        return { ...n, data: { ...restData } };
      });
      const res = await fetch('/api/workflows/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: brief || '',
          strategyRationale: strategy?.rationale || '',
          nodes: sanitizedNodes,
          edges: storeEdges,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Workflow saved');
        if (workflowsModalOpen) fetchWorkflows();
      } else {
        toast.error(json.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Error saving workflow');
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const fetchWorkflows = async () => {
    setIsLoadingWorkflows(true);
    try {
      const res = await fetch('/api/workflows/list');
      const json = await res.json();
      if (json.success) {
        setSavedWorkflows(json.workflows || []);
      } else {
        toast.error(json.error || 'Failed to load workflows');
      }
    } catch (e) {
      toast.error('Error loading workflows');
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    if (workflowsModalOpen) fetchWorkflows();
  }, [workflowsModalOpen]);

  // Execute a single node (mirrors AgentNode logic) for regenerate within modal
  const handleDownloadModalImage = (imageUrl, index) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `campaign-image-${editingNodeId}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeSingleNode = async (nodeId) => {
    const node = storeNodes.find(n => n.id === nodeId);
    if (!node) return;
    if (node.data.status === 'loading') return;
    updateNodeStatus(nodeId, 'loading');
    try {
      const response = await fetch('/api/campaign/execute-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          nodes: storeNodes,
          edges: storeEdges,
          brief,
          strategy: strategy?.rationale || '',
        }),
      });
      const result = await response.json();
      if (result.success) {
        updateNodeStatus(nodeId, 'complete', result.output);
        setEditingNodeOutput(result.output);
        toast.success('Node regenerated');
      } else {
        updateNodeStatus(nodeId, 'error', undefined, result.error);
        toast.error('Node regeneration failed');
      }
    } catch (e) {
      updateNodeStatus(nodeId, 'error', undefined, e.message);
      toast.error('Node regeneration error');
    }
  };

  const completedCount = storeNodes.filter(n => n.data.status === 'complete').length;
  const totalCount = storeNodes.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!strategy) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen w-full bg-background flex relative cf-canvas">
      <style jsx global>{`
        /* Custom slim emerald scrollbars */
        .campaign-sidebar-scroll{
          scrollbar-width: thin;
          scrollbar-color: rgba(16,185,129,0.5) transparent;
        }
        .campaign-sidebar-scroll::-webkit-scrollbar{ width:8px; height:8px; }
        .campaign-sidebar-scroll::-webkit-scrollbar-track{ background: transparent; }
        .campaign-sidebar-scroll::-webkit-scrollbar-thumb{
          background: rgba(16,185,129,0.35);
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .campaign-sidebar-scroll:hover::-webkit-scrollbar-thumb{
          background: rgba(16,185,129,0.55);
        }

        /* Inline KYC highlight chip */
        .campaign-markdown .kyc-chip{
          display: inline-block;
          font-size: 10px;
          line-height: 1.25;
          padding: 0 6px;
          border-radius: 9999px;
          background: rgba(16,185,129,0.12);
          color: #059669;
          border: 1px solid rgba(16,185,129,0.35);
          margin: 0 2px;
          vertical-align: baseline;
          white-space: nowrap;
        }

        /* Clamp long node text to 6 lines for readability */
        .cf-canvas .react-flow__node .leading-relaxed{
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
          white-space: normal; /* override pre-wrap to enable clamping */
        }
      `}</style>
      {/* Left Sidebar - Strategy Panel */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-[360px] border-r border-border bg-card flex flex-col z-10 shadow-xl overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-foreground">AI Agent's Strategy</h2>
                    <p className="text-xs text-muted-foreground">Thought process behind this workflow</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Strategic Rationale - Scrollable (native overflow) */}
            <div className="flex-1 campaign-sidebar-scroll overflow-y-auto">
              <div className="p-4 space-y-4 min-h-0">
                {/* Strategic Approach Section */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Strategic Approach</h3>
                  <div className="campaign-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-semibold mt-3 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold mt-3 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm leading-relaxed mb-3" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        code: ({node, inline, ...props}) => inline ? <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono" {...props} /> : <code className="block p-2 rounded bg-muted text-xs font-mono overflow-x-auto" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-emerald-500 pl-3 italic" {...props} />,
                      }}
                    >
                      {highlightedStrategy}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer - Progress */}
            <div className="p-4 border-t border-border shrink-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Workflow Progress</span>
                  <span className="font-semibold text-foreground">
                    {completedCount}/{totalCount}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed sidebar handle */}
      {!isSidebarOpen && (
        <button
          aria-label="Open Strategy Sidebar"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-md bg-card border border-border shadow hover:bg-accent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smartEdge',
            animated: false,
          }}
        >
          <Background
            color="#ffffff"
            gap={20}
            size={1}
            className="opacity-5"
          />
          
          <Controls
            className="bg-card border-border"
          />
          
          <MiniMap
            className="bg-card border-border"
            nodeColor={(node) => {
              const colorMap = {
                strategy: '#3b82f6',
                copy: '#f97316',
                image: '#ec4899',
                research: '#22c55e',
                timeline: '#ef4444',
                distribution: '#6366f1',
              };
              return colorMap[node.data?.type] || '#64748b';
            }}
          />

          {/* Top Action Bar */}
          <Panel position="top-left" className="m-4 backdrop-blur-sm bg-card/90 border border-border rounded-lg shadow-md px-4 py-2 w-auto max-w-[95vw]">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
              <Button
                onClick={() => router.push('/campaign')}
                variant="outline"
                size="sm"
                className="bg-card/80 border-border hover:bg-accent"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Brief
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
                className="bg-card/80 border-border hover:bg-accent"
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </Button>
              <div className="flex items-center gap-2 ml-4">
                <h2 className="text-sm font-semibold text-foreground">Workflow Canvas</h2>
              </div>
              <div className="flex items-center flex-wrap gap-2 md:gap-3 ml-6 p-1.5 rounded-lg bg-muted/60 border border-border shadow-sm">
                {!isSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(true)}
                    className="h-8"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Show Strategy
                  </Button>
                )}

                <Button
                  onClick={handleRunAll}
                  disabled={isRunning}
                  size="sm"
                  className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Run Campaign
                </Button>

                <Button
                  onClick={handleReset}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export
                </Button>

                <Button
                  onClick={handleSaveWorkflow}
                  variant="outline"
                  size="sm"
                  disabled={isSavingWorkflow}
                  className="h-8"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  {isSavingWorkflow ? 'Saving...' : 'Save'}
                </Button>

                <Button
                  onClick={() => setWorkflowsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  Past Workflows
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingNodeId(null); setPromptModalOpen(true); }}
                  className="h-8 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                  <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                  Settings
                </Button>
              </div>
            </div>
          </Panel>

          {/* Right Panel: Available Modules (collapsible) */}
          <Panel position="top-right" style={{ top: '90px', right: '16px' }} className="backdrop-blur-sm bg-card/90 border border-border rounded-lg shadow-md px-3 py-3 w-[360px] max-h-[520px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Available Modules</h3>
              <Button
                variant="ghost"
                size="icon"
                aria-expanded={isModulesOpen}
                onClick={() => setIsModulesOpen(v => !v)}
                className="h-7 w-7"
              >
                {isModulesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {isModulesOpen && (
            <div className="space-y-1 overflow-y-auto campaign-sidebar-scroll">
              {[ 
                { icon: '🖼️', name: 'Visual Asset Generator', category: 'Creative', desc: 'Generate visual content using AI image models' },
                { icon: '🎬', name: 'Video Content Builder', category: 'Creative', desc: 'Create video content from scripts, images, or text' },
                { icon: '📝', name: 'Copy Content Writer', category: 'Creative', desc: 'Generate marketing copy, captions, and written content' },
                { icon: '🔍', name: 'Audience Intelligence', category: 'Research', desc: 'Analyze and identify target audience characteristics' },
                { icon: '📊', name: 'Timeline Optimizer', category: 'Strategy', desc: 'Create optimal campaign schedules and timelines' },
                { icon: '📧', name: 'Email Sender', category: 'Communication', desc: 'Send personalized email campaigns using AI-generated content' },
              ].map((module, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-md hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{module.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-foreground truncate">{module.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                          {module.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{module.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </Panel>

        </ReactFlow>
        {/* Node / Workflow Settings Modal */}
        <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
          <DialogContent className="max-w-3xl w-full">
            <DialogHeader>
              <DialogTitle>
                {editingNodeId ? editingNodeLabel : 'Workflow Agent Prompts'}
              </DialogTitle>
              <DialogDescription>
                {editingNodeId ? editingNodePurpose : 'Select an agent to edit its prompt context.'}
              </DialogDescription>
            </DialogHeader>
            {editingNodeId ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Prompt Editor */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-medium">Prompt Context</h4>
                  <Textarea
                    value={editingPrompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    className="min-h-[220px] text-sm resize-none campaign-sidebar-scroll"
                    placeholder="Describe what this agent should focus on..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => {
                        updateNodePrompt(editingNodeId, editingPrompt);
                        toast.success('Prompt saved');
                      }}
                    >
                      Save Prompt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeSingleNode(editingNodeId)}
                    >
                      Regenerate Node
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRunAll}
                    >
                      Regenerate All
                    </Button>
                  </div>
                </div>
                {/* Output Viewer */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-medium">Latest Output</h4>
                  <ModalScrollArea className="h-[260px] rounded-md border border-border campaign-sidebar-scroll p-3 bg-muted/40">
                    {(() => {
                      if (!editingNodeOutput) {
                        return <p className="text-xs text-muted-foreground">No output yet. Run the agent to generate content.</p>;
                      }
                      // Try parse image payload
                      try {
                        const parsed = JSON.parse(editingNodeOutput);
                        if (parsed.images && Array.isArray(parsed.images) && parsed.images.length > 0) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {parsed.images.map((img, idx) => (
                                <div 
                                  key={idx} 
                                  className="relative group border border-border rounded-md overflow-hidden cursor-pointer"
                                  onClick={() => setModalLightboxImage({ url: img.url, index: idx, theme: img.theme })}
                                >
                                  <img src={img.url} alt={`ad-${idx}`} className="w-full h-32 object-cover transition-transform group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } catch {}
                      return (
                        <div className="campaign-markdown text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-base font-semibold mt-3 mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-sm font-semibold mt-2 mb-1" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-[13px] font-semibold mt-2 mb-1" {...props} />,
                              p: ({node, ...props}) => <p className="text-[12px] leading-relaxed mb-2" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="text-[12px]" {...props} />,
                              code: ({node, inline, ...props}) => inline ? <code className="px-1 py-0.5 rounded bg-muted text-[11px] font-mono" {...props} /> : <code className="block p-2 rounded bg-muted text-[11px] font-mono overflow-x-auto" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-emerald-500 pl-3 italic" {...props} />,
                            }}
                          >
                            {editingNodeOutput}
                          </ReactMarkdown>
                        </div>
                      );
                    })()}
                  </ModalScrollArea>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setPromptModalOpen(false); setEditingNodeId(null); }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <ModalScrollArea className="max-h-[65vh] campaign-sidebar-scroll pr-2">
                <div className="space-y-3">
                  {nodes.map(n => (
                    <div key={n.id} className="p-3 rounded-md border border-border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{n.data.label}</p>
                        <Button size="sm" variant="outline" onClick={() => { setEditingNodeId(n.id); setEditingPrompt(n.data.promptContext || ''); setEditingNodeOutput(n.data.output || ''); setEditingNodeLabel(n.data.label || 'Agent Configuration'); setEditingNodePurpose(n.data.description || n.data.promptContext || 'Configure prompts and view this agent\'s output.'); }} className="h-7 text-xs">Open</Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.data.promptContext || 'No prompt context yet.'}</p>
                      {n.data.status === 'complete' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Output ready</p>
                      )}
                    </div>
                  ))}
                </div>
              </ModalScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal Image Lightbox - Portal to body */}
      {modalLightboxImage && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => setModalLightboxImage(null)}
        >
          {/* Header bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <p style={{ color: '#f9fafb', fontWeight: '600', fontSize: '14px' }}>Image {modalLightboxImage.index + 1}</p>
              {modalLightboxImage.theme && (
                <span style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: '500'
                }}>
                  {modalLightboxImage.theme}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadModalImage(modalLightboxImage.url, modalLightboxImage.index);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <button
                onClick={() => setModalLightboxImage(null)}
                style={{
                  padding: '8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Image container */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              minHeight: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={modalLightboxImage.url} 
              alt={`Campaign image ${modalLightboxImage.index + 1}`} 
              style={{
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Drag & Drop Overlay for Import */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          if (!file.type.includes('json')) { toast.error('Please drop a JSON file'); return; }
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const parsed = JSON.parse(String(ev.target?.result));
              const workflow = parsed.workflow || parsed; // allow raw {nodes,edges}
              const rawNodes = workflow.nodes || [];
              const rawEdges = workflow.edges || [];
              if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) { toast.error('Invalid workflow structure'); return; }
              setWorkflow(rawNodes, rawEdges);
              toast.success('Workflow imported');
            } catch (err) {
              toast.error('Failed to parse workflow JSON');
            }
          };
          reader.readAsText(file);
        }}
        className="pointer-events-none fixed inset-0 z-50"
      />
    {/* Past Workflows Modal */}
    <Dialog open={workflowsModalOpen} onOpenChange={setWorkflowsModalOpen}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Saved Workflows</DialogTitle>
          <DialogDescription>Load a previously saved workflow configuration.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoadingWorkflows && <p className="text-sm text-muted-foreground">Loading workflows...</p>}
          {!isLoadingWorkflows && savedWorkflows.length === 0 && <p className="text-sm text-muted-foreground">No workflows saved yet.</p>}
          <ModalScrollArea className="max-h-[50vh] campaign-sidebar-scroll pr-2">
            <div className="space-y-3">
              {savedWorkflows.map(wf => (
                <div key={wf.id} className="p-3 rounded-md border border-border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{new Date(wf.createdAt).toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{wf.brief}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setWorkflow(wf.nodes, wf.edges);
                        toast.success('Workflow loaded');
                        setWorkflowsModalOpen(false);
                      }}
                      className="h-7 text-xs shrink-0"
                    >
                      Load
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{wf.strategyRationale}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{wf.nodesCount} nodes</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{wf.edgesCount} edges</span>
                  </div>
                </div>
              ))}
            </div>
          </ModalScrollArea>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setWorkflowsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
