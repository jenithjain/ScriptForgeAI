'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  AlertCircle, AlertTriangle, Info, CheckCircle, XCircle,
  Sparkles, FileText, Clock, GitCompare, BookOpen,
  Pencil, Check, Send, Bot, User, Zap, Terminal,
  Maximize2, Minimize2, PanelBottomClose, PanelBottom,
  PanelRightClose, PanelRight, RefreshCw, Copy, ArrowLeft,
  Database, Network, Link2, Users, MapPin, Minus, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

// Custom scrollbar styles
const scrollbarStyles = `
  .ai-editor-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .ai-editor-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .ai-editor-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
  }
  .ai-editor-scroll::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
`;

// Issue types configuration
const ISSUE_TYPES = {
  error: { icon: XCircle, color: '#EF4444', label: 'Error' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Warning' },
  info: { icon: Info, color: '#3B82F6', label: 'Info' },
  hint: { icon: Sparkles, color: '#10B981', label: 'Hint' }
};

const CATEGORY_ICONS = {
  semantic: BookOpen,
  temporal: Clock,
  continuity: GitCompare,
  style: Pencil
};

export default function AIEditorPage({
  isOpen,
  onClose,
  workflow,
  nodes,
  onApplyEdit
}) {
  const [problems, setProblems] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(220);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('problems');
  const [scriptContent, setScriptContent] = useState('');
  const [scriptLines, setScriptLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [neo4jReferences, setNeo4jReferences] = useState([]);
  const [resolvedProblems, setResolvedProblems] = useState(new Set());
  const chatEndRef = useRef(null);
  const editorScrollRef = useRef(null);
  const lineRefs = useRef({});

  // Extract problems from agent outputs
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const extractedProblems = [];
    const extractedReferences = [];
    let problemIndex = 0;

    const addProblem = (data, type, category, source) => {
      const problem = {
        id: `problem-${problemIndex++}`,
        type: data.severity === 'high' ? 'error' : data.severity === 'low' ? 'info' : 'warning',
        category,
        title: data.title || data.type || 'Issue Detected',
        message: data.description || data.message || String(data),
        location: data.location || data.scene || 'Script',
        line: data.lineNumber || data.line || Math.floor(Math.random() * 20) + 1, // Simulated line for demo
        column: data.column || null,
        source,
        originalText: data.original || data.originalText || data.problematic_text || '',
        suggestedFix: data.suggestion || data.fix || data.suggestedText || data.corrected_text || '',
        explanation: data.explanation || data.reason || '',
        status: 'pending',
        // Neo4j reference data
        references: data.references || data.evidence || [],
        entityType: data.entityType || data.entity_type || null,
        entityId: data.entityId || data.entity_id || null,
        relatedEntities: data.relatedEntities || data.related_entities || []
      };
      extractedProblems.push(problem);

      // Extract Neo4j references if available
      if (data.references || data.evidence || data.knowledge_graph_ref) {
        extractedReferences.push({
          problemId: problem.id,
          type: category,
          entities: data.references || data.evidence || [data.knowledge_graph_ref],
          source: source
        });
      }
    };

    // Parse all agent outputs
    const agentMappings = [
      { type: 'story-intelligence', category: 'style', name: 'Story Intelligence' },
      { type: 'temporal-reasoning', category: 'temporal', name: 'Temporal Reasoning' },
      { type: 'continuity-validator', category: 'continuity', name: 'Continuity Validator' },
      { type: 'creative-coauthor', category: 'style', name: 'Creative Co-Author' },
      { type: 'knowledge-graph', category: 'semantic', name: 'Knowledge Graph' }
    ];

    agentMappings.forEach(({ type, category, name }) => {
      const agent = nodes.find(n => n.data?.agentType === type);
      if (agent?.data?.result || agent?.data?.output) {
        const data = agent.data.result || agent.data.output;

        if (typeof data === 'object') {
          const issueFields = [
            'errors', 'warnings', 'issues', 'problems',
            'temporal_issues', 'temporalIssues', 'timeline_errors',
            'continuity_errors', 'contradictions', 'plot_holes', 'plotHoles',
            'suggestions', 'improvements', 'style_issues', 'styleIssues',
            'character_issues', 'characterIssues', 'location_issues', 'locationIssues',
            'paradoxes', 'inconsistencies'
          ];

          issueFields.forEach(field => {
            const items = data[field];
            if (Array.isArray(items)) {
              items.forEach(item => {
                addProblem(
                  typeof item === 'string' ? { description: item } : item,
                  field.includes('error') ? 'error' : 'warning',
                  category,
                  name
                );
              });
            }
          });

          // Extract Neo4j knowledge graph references
          if (type === 'knowledge-graph' && data.entities) {
            data.entities.forEach(entity => {
              extractedReferences.push({
                type: 'entity',
                name: entity.name,
                entityType: entity.type,
                properties: entity.properties || {},
                relationships: entity.relationships || []
              });
            });
          }
        }
      }
    });

    setProblems(extractedProblems);
    setNeo4jReferences(extractedReferences);

    // Initial AI message
    if (extractedProblems.length > 0 && chatMessages.length === 0) {
      setChatMessages([{
        id: 'initial',
        role: 'assistant',
        content: `I've analyzed your script and found **${extractedProblems.length} issues** that need attention.\n\nClick on any problem in the bottom panel to see the diff and get AI-powered fix suggestions with Neo4j evidence.`,
        timestamp: new Date()
      }]);
    }
  }, [nodes]);

  // Build script content with diff highlighting
  useEffect(() => {
    if (workflow?.brief) {
      // Create line-by-line content with potential diffs
      const lines = workflow.brief.split('\n').map((line, idx) => ({
        number: idx + 1,
        content: line,
        type: 'normal', // normal, deleted, added
        problemId: null
      }));

      // Mark lines that have problems
      problems.forEach(problem => {
        if (problem.line && problem.line <= lines.length) {
          const lineIdx = problem.line - 1;
          if (lines[lineIdx]) {
            lines[lineIdx].hasProblem = true;
            lines[lineIdx].problemId = problem.id;
            lines[lineIdx].problemType = problem.type;
          }
        }
      });

      setScriptLines(lines);
      setScriptContent(workflow.brief);
    }
  }, [workflow, problems]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleProblemClick = (problem) => {
    setSelectedProblem(problem);

    // Scroll to the line in the editor
    setTimeout(() => {
      const lineElement = lineRefs.current[problem.line];
      if (lineElement && editorScrollRef.current) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Add AI message with suggestion (only if not already resolved)
    if (!resolvedProblems.has(problem.id)) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `**${problem.title}**\n\n${problem.message}`,
        problem: problem,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newMessage]);
    }
  };

  const handleAcceptFix = (problem) => {
    // Update the script lines to show the accepted change and remove problem marker
    setScriptLines(prev => prev.map(line => {
      if (line.problemId === problem.id) {
        return {
          ...line,
          type: 'accepted',
          content: problem.suggestedFix || line.content,
          hasProblem: false,
          problemId: null
        };
      }
      return line;
    }));

    // Mark problem as resolved
    setResolvedProblems(prev => new Set([...prev, problem.id]));

    // Remove from problems list
    setProblems(prev => prev.filter(p => p.id !== problem.id));

    // Clear selection if this was the selected problem
    if (selectedProblem?.id === problem.id) {
      setSelectedProblem(null);
    }

    // Remove the diff card from chat by updating messages
    setChatMessages(prev => prev.map(msg => {
      if (msg.problem?.id === problem.id) {
        return { ...msg, problem: { ...msg.problem, resolved: true } };
      }
      return msg;
    }));

    onApplyEdit?.(problem, 'accept');
    toast.success('Fix accepted and applied');

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `✓ Applied fix for: ${problem.title}`,
      timestamp: new Date()
    }]);
  };

  const handleRejectFix = (problem) => {
    // Mark problem as resolved (rejected)
    setResolvedProblems(prev => new Set([...prev, problem.id]));

    // Remove from problems list
    setProblems(prev => prev.filter(p => p.id !== problem.id));

    // Remove problem marker from script lines
    setScriptLines(prev => prev.map(line => {
      if (line.problemId === problem.id) {
        return { ...line, hasProblem: false, problemId: null };
      }
      return line;
    }));

    // Clear selection if this was the selected problem
    if (selectedProblem?.id === problem.id) {
      setSelectedProblem(null);
    }

    // Remove the diff card from chat by updating messages
    setChatMessages(prev => prev.map(msg => {
      if (msg.problem?.id === problem.id) {
        return { ...msg, problem: { ...msg.problem, resolved: true } };
      }
      return msg;
    }));

    onApplyEdit?.(problem, 'reject');
    toast('Fix rejected');

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `✗ Rejected fix for: ${problem.title}`,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }]);

    setInputMessage('');
    setIsProcessing(true);

    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: "Based on the Knowledge Graph analysis, I can help you with that. The Neo4j references show the relationships and entities involved in this issue.\n\nWould you like me to:\n- Show more evidence from the graph\n- Suggest alternative fixes\n- Explain the reasoning",
        timestamp: new Date()
      }]);
      setIsProcessing(false);
    }, 1000);
  };

  const getTypeStyles = (type) => ISSUE_TYPES[type] || ISSUE_TYPES.warning;

  // Filter out resolved problems
  const pendingProblems = useMemo(() =>
    problems.filter(p => p.status === 'pending' && !resolvedProblems.has(p.id)),
    [problems, resolvedProblems]
  );
  const errorCount = pendingProblems.filter(p => p.type === 'error').length;
  const warningCount = pendingProblems.filter(p => p.type === 'warning').length;

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="h-12 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Workflow
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-sm">AI Script Editor</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
              BETA
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReferencePanelOpen(!isReferencePanelOpen)}
            className="h-8 gap-1 text-xs"
          >
            <Database className="w-3.5 h-3.5" />
            Neo4j
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)} className="h-8">
            {isBottomPanelOpen ? <PanelBottomClose className="w-4 h-4" /> : <PanelBottom className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className="h-8">
            {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Neo4j References Panel - Small Left Sidebar */}
        {isReferencePanelOpen && (
          <div className="w-64 border-r border-border bg-card/95 flex flex-col">
            <div className="h-10 border-b border-border flex items-center justify-between px-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold">Neo4j References</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsReferencePanelOpen(false)}>
                <ChevronLeft className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto ai-editor-scroll">
              <div className="p-3 space-y-3">
                {selectedProblem ? (
                  <>
                    {/* Current Issue Evidence */}
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-2">
                        Evidence for Issue
                      </p>
                      <p className="text-xs text-foreground mb-2">{selectedProblem.title}</p>

                      {/* Entity References */}
                      {selectedProblem.relatedEntities?.length > 0 && (
                        <div className="space-y-1.5">
                          {selectedProblem.relatedEntities.map((entity, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-background/50">
                              <Users className="w-3 h-3 text-purple-400" />
                              <span className="text-[10px]">{entity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Graph Relationships */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Graph Connections
                      </p>

                      <div className="p-2 rounded border border-border bg-muted/20">
                        <div className="flex items-center gap-2 text-[10px]">
                          <Network className="w-3 h-3 text-emerald-500" />
                          <span className="text-muted-foreground">Source:</span>
                          <span className="font-medium">{selectedProblem.source}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded border border-border bg-muted/20">
                        <div className="flex items-center gap-2 text-[10px]">
                          <Link2 className="w-3 h-3 text-amber-500" />
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium capitalize">{selectedProblem.category}</span>
                        </div>
                      </div>

                      {selectedProblem.line && (
                        <div className="p-2 rounded border border-border bg-muted/20">
                          <div className="flex items-center gap-2 text-[10px]">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-medium">Line {selectedProblem.line}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Database className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Select a problem to see Neo4j evidence
                    </p>
                  </div>
                )}

                {/* Knowledge Graph Entities */}
                {neo4jReferences.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Knowledge Graph
                    </p>
                    {neo4jReferences.slice(0, 5).map((ref, idx) => (
                      <div key={idx} className="p-2 rounded border border-border/50 bg-card/50">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                            <Network className="w-3 h-3 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium truncate">{ref.name || ref.type}</p>
                            <p className="text-[9px] text-muted-foreground">{ref.entityType || ref.source}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Script Editor with Diff */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{workflow?.name || 'Script'}</span>
                <Badge variant="outline" className="text-[10px]">
                  {problems.length} issues
                </Badge>
                {selectedProblem && (
                  <Badge className="text-[10px] bg-amber-500/20 text-amber-500 border-0">
                    Showing diff for Line {selectedProblem.line}
                  </Badge>
                )}
              </div>

              {/* Editor Content with Line Numbers and Diff */}
              <div ref={editorScrollRef} className="flex-1 overflow-y-auto ai-editor-scroll">
                <div className="font-mono text-sm">
                  {scriptLines.map((line, idx) => {
                    const isSelected = selectedProblem?.line === line.number;
                    const showDiff = isSelected && selectedProblem?.originalText && selectedProblem?.suggestedFix;

                    return (
                      <div
                        key={idx}
                        ref={(el) => { lineRefs.current[line.number] = el; }}
                      >
                        {/* Original line (deleted - red) when showing diff */}
                        {showDiff && (
                          <div className="flex bg-red-500/10 border-l-4 border-red-500">
                            <div className="w-12 flex-shrink-0 text-right pr-3 py-1 text-xs text-red-400 select-none bg-red-500/5">
                              <Minus className="w-3 h-3 inline mr-1" />
                            </div>
                            <div className="flex-1 py-1 px-3 text-red-400 line-through">
                              {selectedProblem.originalText || line.content}
                            </div>
                          </div>
                        )}

                        {/* Suggested line (added - green) when showing diff */}
                        {showDiff && (
                          <div className="flex bg-emerald-500/10 border-l-4 border-emerald-500">
                            <div className="w-12 flex-shrink-0 text-right pr-3 py-1 text-xs text-emerald-400 select-none bg-emerald-500/5">
                              <Plus className="w-3 h-3 inline mr-1" />
                            </div>
                            <div className="flex-1 py-1 px-3 text-emerald-400 font-medium">
                              {selectedProblem.suggestedFix}
                            </div>
                          </div>
                        )}

                        {/* Normal line */}
                        {!showDiff && (
                          <div
                            className={`flex hover:bg-muted/30 cursor-pointer transition-colors ${
                              line.hasProblem ? 'bg-amber-500/5' : ''
                            } ${isSelected ? 'bg-blue-500/10' : ''}`}
                            onClick={() => {
                              if (line.problemId) {
                                const problem = problems.find(p => p.id === line.problemId);
                                if (problem) handleProblemClick(problem);
                              }
                            }}
                          >
                            <div className={`w-12 flex-shrink-0 text-right pr-3 py-1 text-xs select-none border-r border-border/50 ${
                              line.hasProblem ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground'
                            }`}>
                              {line.number}
                            </div>
                            <div className={`flex-1 py-1 px-3 ${
                              line.hasProblem ? 'text-amber-200' : 'text-foreground/90'
                            }`}>
                              {line.content || '\u00A0'}
                              {line.hasProblem && (
                                <span className="ml-2 inline-flex items-center">
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {scriptLines.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No script content available.</p>
                      <p className="text-sm">Run the Story Intelligence agent to analyze your script.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel - Problems */}
          {isBottomPanelOpen && (
            <div className="border-t border-border bg-card/95" style={{ height: bottomPanelHeight }}>
              <div className="h-9 border-b border-border flex items-center justify-between px-2 bg-muted/30">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsList className="h-full bg-transparent gap-1 p-0">
                    <TabsTrigger
                      value="problems"
                      className="h-full px-3 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      Problems
                      {pendingProblems.length > 0 && (
                        <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-red-500/20 text-red-500 border-0">
                          {pendingProblems.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="output"
                      className="h-full px-3 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none"
                    >
                      <Terminal className="w-3.5 h-3.5 mr-1.5" />
                      Output
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      {errorCount} errors
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      {warningCount} warnings
                    </span>
                  )}
                </div>
              </div>

              <div className="h-[calc(100%-36px)] overflow-y-auto ai-editor-scroll">
                {activeTab === 'problems' ? (
                  <div className="divide-y divide-border/50">
                    {pendingProblems.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                        No problems detected
                      </div>
                    ) : (
                      pendingProblems.map(problem => {
                        const typeConfig = getTypeStyles(problem.type);
                        const Icon = typeConfig.icon;

                        return (
                          <div
                            key={problem.id}
                            onClick={() => handleProblemClick(problem)}
                            className={`flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors ${
                              selectedProblem?.id === problem.id ? 'bg-muted/70 border-l-2 border-emerald-500' : ''
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: typeConfig.color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{problem.title}</span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1"
                                  style={{ borderColor: `${typeConfig.color}40`, color: typeConfig.color }}
                                >
                                  {problem.source}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{problem.message}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                              {problem.line && <span className="font-mono">Ln {problem.line}</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="p-4 font-mono text-xs text-muted-foreground">
                    <p className="text-emerald-500">[AI Script Editor]</p>
                    <p>Analyzed {nodes?.length || 0} agents.</p>
                    <p>Found {problems.length} potential issues.</p>
                    <p>Neo4j references loaded: {neo4jReferences.length}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - AI Chat */}
        {isRightPanelOpen && (
          <div className="border-l border-border bg-card/95 flex flex-col" style={{ width: rightPanelWidth }}>
            <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-sm">AI Assistant</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChatMessages([])}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto ai-editor-scroll">
              <div className="p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="space-y-2">
                    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-emerald-500/20' : msg.role === 'system' ? 'bg-muted' : 'bg-purple-500/20'
                      }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 text-emerald-500" /> :
                         msg.role === 'system' ? <Info className="w-4 h-4 text-muted-foreground" /> :
                         <Bot className="w-4 h-4 text-purple-500" />}
                      </div>
                      <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                          msg.role === 'user' ? 'bg-emerald-500 text-white' :
                          msg.role === 'system' ? 'bg-muted text-muted-foreground text-xs' : 'bg-muted/70'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>

                    {/* Diff Card with Accept/Reject - Only show if not resolved */}
                    {msg.problem && !msg.problem.resolved && (msg.problem.originalText || msg.problem.suggestedFix) && (
                      <div className="ml-10 p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          Suggested Change
                        </div>

                        {/* Diff View */}
                        <div className="space-y-2 mb-3">
                          {msg.problem.originalText && (
                            <div className="rounded overflow-hidden">
                              <div className="bg-red-500/10 px-2 py-1 flex items-center gap-2 border-l-2 border-red-500">
                                <Minus className="w-3 h-3 text-red-500" />
                                <span className="text-[10px] font-medium text-red-500">REMOVE</span>
                              </div>
                              <div className="bg-red-500/5 p-2 text-xs font-mono text-red-400 line-through">
                                {msg.problem.originalText}
                              </div>
                            </div>
                          )}

                          {msg.problem.suggestedFix && (
                            <div className="rounded overflow-hidden">
                              <div className="bg-emerald-500/10 px-2 py-1 flex items-center gap-2 border-l-2 border-emerald-500">
                                <Plus className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-medium text-emerald-500">ADD</span>
                              </div>
                              <div className="bg-emerald-500/5 p-2 text-xs font-mono text-emerald-400">
                                {msg.problem.suggestedFix}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 flex-1"
                            onClick={() => handleAcceptFix(msg.problem)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleRejectFix(msg.problem)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.problem.suggestedFix || '');
                              toast.success('Copied');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="bg-muted/70 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border">
              <div className="flex items-end gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about issues..."
                  className="min-h-[50px] max-h-[100px] text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 shrink-0"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isProcessing}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
