'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle, CheckCircle, XCircle, X, ChevronRight, ChevronDown,
  Clock, AlertTriangle, Sparkles, FileText, MessageSquare, Pencil,
  Lightbulb, Zap, RefreshCw, Copy, Check, ArrowRight, GitCompare,
  BookOpen, Users, MapPin, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// Issue type definitions
const ISSUE_CATEGORIES = {
  semantic: {
    id: 'semantic',
    label: 'Semantic',
    icon: BookOpen,
    color: '#8B5CF6',
    description: 'Plot holes, character inconsistencies, logic errors'
  },
  temporal: {
    id: 'temporal',
    label: 'Timeline',
    icon: Calendar,
    color: '#F59E0B',
    description: 'Chronology issues, flashback errors, temporal paradoxes'
  },
  continuity: {
    id: 'continuity',
    label: 'Continuity',
    icon: GitCompare,
    color: '#EF4444',
    description: 'Contradictions, fact inconsistencies, setting errors'
  },
  style: {
    id: 'style',
    label: 'Style',
    icon: Pencil,
    color: '#10B981',
    description: 'Dialogue improvements, pacing, tone suggestions'
  }
};

export default function ScriptEditorPanel({
  workflow,
  nodes,
  isOpen,
  onClose,
  onApplyEdit
}) {
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [customEdit, setCustomEdit] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Extract and categorize issues from agent outputs
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const extractedIssues = [];
    let issueIndex = 0;

    // Helper to create issue object
    const createIssue = (data, category, agentType, agentName) => {
      return {
        id: `issue-${issueIndex++}`,
        category,
        severity: data.severity || 'medium',
        title: data.title || data.type || 'Issue Detected',
        description: data.description || data.message || String(data),
        location: data.location || data.line || data.scene || 'Script',
        originalText: data.original || data.originalText || '',
        suggestedText: data.suggestion || data.fix || data.suggestedText || '',
        explanation: data.explanation || data.reason || '',
        agentType,
        agentName,
        status: 'pending', // pending, accepted, rejected
        lineNumber: data.lineNumber || data.line || null,
        scene: data.scene || null,
        character: data.character || null
      };
    };

    // Parse Story Intelligence output
    const storyAgent = nodes.find(n => n.data?.agentType === 'story-intelligence');
    if (storyAgent?.data?.result || storyAgent?.data?.output) {
      const data = storyAgent.data.result || storyAgent.data.output;
      if (typeof data === 'object') {
        // Look for style issues
        const styleIssues = data.style_issues || data.styleIssues || [];
        styleIssues.forEach(issue => {
          extractedIssues.push(createIssue(
            { ...issue, category: 'style' },
            'style',
            'story-intelligence',
            'Story Intelligence'
          ));
        });
      }
    }

    // Parse Temporal Reasoning output
    const temporalAgent = nodes.find(n => n.data?.agentType === 'temporal-reasoning');
    if (temporalAgent?.data?.result || temporalAgent?.data?.output) {
      const data = temporalAgent.data.result || temporalAgent.data.output;

      if (typeof data === 'object') {
        // Extract temporal issues
        const temporalIssues = data.temporal_issues || data.temporalIssues ||
                              data.issues || data.timeline_errors || [];

        temporalIssues.forEach(issue => {
          extractedIssues.push(createIssue(
            typeof issue === 'string' ? { description: issue } : issue,
            'temporal',
            'temporal-reasoning',
            'Temporal Reasoning'
          ));
        });

        // Extract paradoxes
        const paradoxes = data.paradoxes || [];
        paradoxes.forEach(p => {
          extractedIssues.push(createIssue(
            { ...p, severity: 'high', title: 'Temporal Paradox' },
            'temporal',
            'temporal-reasoning',
            'Temporal Reasoning'
          ));
        });
      } else if (typeof data === 'string') {
        // Parse string output for issues
        const lines = data.split('\n');
        lines.forEach((line, idx) => {
          if (line.match(/issue|error|inconsistency|paradox|conflict/i)) {
            extractedIssues.push(createIssue(
              { description: line.trim(), lineNumber: idx + 1 },
              'temporal',
              'temporal-reasoning',
              'Temporal Reasoning'
            ));
          }
        });
      }
    }

    // Parse Continuity Validator output
    const continuityAgent = nodes.find(n => n.data?.agentType === 'continuity-validator');
    if (continuityAgent?.data?.result || continuityAgent?.data?.output) {
      const data = continuityAgent.data.result || continuityAgent.data.output;

      if (typeof data === 'object') {
        // Extract errors (high severity)
        const errors = data.errors || data.continuity_errors || [];
        errors.forEach(error => {
          extractedIssues.push(createIssue(
            { ...error, severity: 'high' },
            'continuity',
            'continuity-validator',
            'Continuity Validator'
          ));
        });

        // Extract warnings (medium severity)
        const warnings = data.warnings || [];
        warnings.forEach(warning => {
          extractedIssues.push(createIssue(
            { ...warning, severity: 'medium' },
            'continuity',
            'continuity-validator',
            'Continuity Validator'
          ));
        });

        // Extract contradictions
        const contradictions = data.contradictions || [];
        contradictions.forEach(c => {
          extractedIssues.push(createIssue(
            { ...c, severity: 'high', title: 'Contradiction Detected' },
            'continuity',
            'continuity-validator',
            'Continuity Validator'
          ));
        });

        // Extract plot holes
        const plotHoles = data.plot_holes || data.plotHoles || [];
        plotHoles.forEach(hole => {
          extractedIssues.push(createIssue(
            { ...hole, severity: 'high', title: 'Plot Hole' },
            'semantic',
            'continuity-validator',
            'Continuity Validator'
          ));
        });
      } else if (typeof data === 'string') {
        const lines = data.split('\n');
        lines.forEach((line, idx) => {
          if (line.match(/error|contradiction|inconsistent|plot hole/i)) {
            extractedIssues.push(createIssue(
              { description: line.trim(), severity: 'high', lineNumber: idx + 1 },
              'continuity',
              'continuity-validator',
              'Continuity Validator'
            ));
          }
        });
      }
    }

    // Parse Creative Co-Author output for style suggestions
    const creativeAgent = nodes.find(n => n.data?.agentType === 'creative-coauthor');
    if (creativeAgent?.data?.result || creativeAgent?.data?.output) {
      const data = creativeAgent.data.result || creativeAgent.data.output;

      if (typeof data === 'object') {
        const suggestions = data.suggestions || data.improvements ||
                           data.dialogue_improvements || [];
        suggestions.forEach(suggestion => {
          extractedIssues.push(createIssue(
            { ...suggestion, severity: 'low', title: suggestion.title || 'Style Suggestion' },
            'style',
            'creative-coauthor',
            'Creative Co-Author'
          ));
        });
      }
    }

    // Parse Knowledge Graph for character/location inconsistencies
    const knowledgeAgent = nodes.find(n => n.data?.agentType === 'knowledge-graph');
    if (knowledgeAgent?.data?.result || knowledgeAgent?.data?.output) {
      const data = knowledgeAgent.data.result || knowledgeAgent.data.output;

      if (typeof data === 'object') {
        const characterIssues = data.character_issues || data.characterIssues || [];
        characterIssues.forEach(issue => {
          extractedIssues.push(createIssue(
            { ...issue, title: 'Character Inconsistency' },
            'semantic',
            'knowledge-graph',
            'Knowledge Graph'
          ));
        });

        const locationIssues = data.location_issues || data.locationIssues || [];
        locationIssues.forEach(issue => {
          extractedIssues.push(createIssue(
            { ...issue, title: 'Location Error' },
            'continuity',
            'knowledge-graph',
            'Knowledge Graph'
          ));
        });
      }
    }

    setIssues(extractedIssues);
  }, [nodes]);

  // Filter issues by category
  const getFilteredIssues = () => {
    if (activeTab === 'all') return issues.filter(i => i.status === 'pending');
    return issues.filter(i => i.category === activeTab && i.status === 'pending');
  };

  const getCategoryCount = (category) => {
    if (category === 'all') return issues.filter(i => i.status === 'pending').length;
    return issues.filter(i => i.category === category && i.status === 'pending').length;
  };

  const handleAccept = (issue) => {
    setIssues(prev => prev.map(i =>
      i.id === issue.id ? { ...i, status: 'accepted' } : i
    ));
    setAcceptedCount(prev => prev + 1);
    onApplyEdit?.(issue, 'accept');
    toast.success('Edit accepted', { icon: '✓' });
    setExpandedIssueId(null);
  };

  const handleReject = (issue) => {
    setIssues(prev => prev.map(i =>
      i.id === issue.id ? { ...i, status: 'rejected' } : i
    ));
    setRejectedCount(prev => prev + 1);
    onApplyEdit?.(issue, 'reject');
    toast('Edit rejected', { icon: '✗' });
    setExpandedIssueId(null);
  };

  const handleApplyCustomEdit = (issue) => {
    if (!customEdit.trim()) return;

    const modifiedIssue = { ...issue, suggestedText: customEdit };
    setIssues(prev => prev.map(i =>
      i.id === issue.id ? { ...i, status: 'accepted', suggestedText: customEdit } : i
    ));
    setAcceptedCount(prev => prev + 1);
    onApplyEdit?.(modifiedIssue, 'accept');
    toast.success('Custom edit applied');
    setEditingIssueId(null);
    setCustomEdit('');
    setExpandedIssueId(null);
  };

  const handleAcceptAll = () => {
    const pendingIssues = issues.filter(i => i.status === 'pending');
    setIssues(prev => prev.map(i => ({ ...i, status: 'accepted' })));
    setAcceptedCount(prev => prev + pendingIssues.length);
    pendingIssues.forEach(issue => onApplyEdit?.(issue, 'accept'));
    toast.success(`Accepted ${pendingIssues.length} edits`);
  };

  const handleRejectAll = () => {
    const pendingIssues = issues.filter(i => i.status === 'pending');
    setIssues(prev => prev.map(i => ({ ...i, status: 'rejected' })));
    setRejectedCount(prev => prev + pendingIssues.length);
    pendingIssues.forEach(issue => onApplyEdit?.(issue, 'reject'));
    toast('Rejected all edits');
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high':
        return {
          badge: 'bg-red-500/10 text-red-500 border-red-500/20',
          indicator: 'bg-red-500'
        };
      case 'medium':
        return {
          badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          indicator: 'bg-amber-500'
        };
      case 'low':
        return {
          badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          indicator: 'bg-blue-500'
        };
      default:
        return {
          badge: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          indicator: 'bg-gray-500'
        };
    }
  };

  const filteredIssues = getFilteredIssues();

  if (!isOpen) return null;

  return (
    <div className="w-[420px] bg-card/98 backdrop-blur-xl border-r border-border h-full flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-500/5 to-purple-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                AI Script Editor
                <Badge variant="outline" className="text-[10px] font-normal border-emerald-500/30 text-emerald-500">
                  BETA
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} to review
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-muted-foreground">Accepted: <span className="text-foreground font-medium">{acceptedCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Rejected: <span className="text-foreground font-medium">{rejectedCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-muted-foreground">Pending: <span className="text-foreground font-medium">{filteredIssues.length}</span></span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-1 bg-transparent grid grid-cols-5 gap-1">
            <TabsTrigger
              value="all"
              className="text-xs py-2 px-2 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md"
            >
              All ({getCategoryCount('all')})
            </TabsTrigger>
            {Object.values(ISSUE_CATEGORIES).map(cat => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="text-xs py-2 px-2 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md flex items-center gap-1"
                >
                  <Icon className="w-3 h-3" style={{ color: cat.color }} />
                  <span className="hidden sm:inline">{getCategoryCount(cat.id)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk Actions */}
      {filteredIssues.length > 0 && (
        <div className="p-2 border-b border-border flex items-center justify-between bg-muted/30">
          <span className="text-xs text-muted-foreground pl-2">Bulk actions:</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAcceptAll}
              className="h-7 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
            >
              <Check className="w-3 h-3 mr-1" />
              Accept All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRejectAll}
              className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <X className="w-3 h-3 mr-1" />
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Issues List */}
      <ScrollArea className="flex-1 workflow-sidebar-scroll">
        <div className="p-3 space-y-2">
          {filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">All Clear!</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                {issues.length === 0
                  ? "Run your workflow to detect script issues. The AI will analyze your script for semantic, temporal, and continuity errors."
                  : "All issues have been reviewed. Great job!"
                }
              </p>
              {issues.length === 0 && (
                <Button
                  variant="outline"
                  className="mt-4 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => toast('Run the workflow to analyze your script')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              )}
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isExpanded = expandedIssueId === issue.id;
              const isEditing = editingIssueId === issue.id;
              const severityStyles = getSeverityStyles(issue.severity);
              const category = ISSUE_CATEGORIES[issue.category];
              const CategoryIcon = category?.icon || AlertCircle;

              return (
                <Card
                  key={issue.id}
                  className={`border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'ring-1 ring-emerald-500/30' : 'hover:border-border'
                  }`}
                >
                  {/* Issue Header */}
                  <div
                    className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Severity Indicator */}
                      <div className={`w-1 h-full min-h-[40px] rounded-full ${severityStyles.indicator}`} />

                      {/* Category Icon */}
                      <div
                        className="p-1.5 rounded-md shrink-0 mt-0.5"
                        style={{ backgroundColor: `${category?.color || '#666'}15` }}
                      >
                        <CategoryIcon
                          className="w-3.5 h-3.5"
                          style={{ color: category?.color || '#666' }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">
                            {issue.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${severityStyles.badge}`}
                          >
                            {issue.severity}
                          </Badge>
                        </div>

                        {/* Location Info */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
                          {issue.scene && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {issue.scene}
                            </span>
                          )}
                          {issue.lineNumber && (
                            <span>Line {issue.lineNumber}</span>
                          )}
                          {issue.character && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {issue.character}
                            </span>
                          )}
                          <span>{issue.location}</span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {issue.description}
                        </p>
                      </div>

                      {/* Expand Indicator */}
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-muted/20">
                      <div className="p-3 space-y-3">
                        {/* Full Description */}
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Issue Details
                          </p>
                          <p className="text-xs text-foreground leading-relaxed">
                            {issue.description}
                          </p>
                        </div>

                        {/* Diff View - Original vs Suggested */}
                        {(issue.originalText || issue.suggestedText) && (
                          <div className="space-y-2">
                            {issue.originalText && (
                              <div className="rounded-md overflow-hidden">
                                <div className="bg-red-500/10 px-3 py-1.5 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                                    <span className="text-white text-[8px] font-bold">−</span>
                                  </div>
                                  <span className="text-[10px] font-medium text-red-500">Original</span>
                                </div>
                                <div className="bg-red-500/5 p-3 text-xs font-mono text-foreground/80 leading-relaxed border-l-2 border-red-500/30">
                                  {issue.originalText}
                                </div>
                              </div>
                            )}

                            {issue.suggestedText && !isEditing && (
                              <div className="rounded-md overflow-hidden">
                                <div className="bg-emerald-500/10 px-3 py-1.5 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <span className="text-white text-[8px] font-bold">+</span>
                                  </div>
                                  <span className="text-[10px] font-medium text-emerald-500">Suggested</span>
                                </div>
                                <div className="bg-emerald-500/5 p-3 text-xs font-mono text-foreground leading-relaxed border-l-2 border-emerald-500/30">
                                  {issue.suggestedText}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Explanation */}
                        {issue.explanation && (
                          <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Lightbulb className="w-3 h-3 text-purple-500" />
                              <span className="text-[10px] font-medium text-purple-500">AI Explanation</span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {issue.explanation}
                            </p>
                          </div>
                        )}

                        {/* Custom Edit Mode */}
                        {isEditing && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                              <Pencil className="w-3 h-3" />
                              Custom Edit
                            </div>
                            <Textarea
                              value={customEdit}
                              onChange={(e) => setCustomEdit(e.target.value)}
                              placeholder="Enter your custom edit..."
                              className="min-h-[80px] text-xs font-mono bg-background/50"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApplyCustomEdit(issue)}
                                className="flex-1 h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                              >
                                Apply Custom Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingIssueId(null);
                                  setCustomEdit('');
                                }}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!isEditing && (
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(issue);
                              }}
                              className="flex-1 h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(issue);
                              }}
                              className="flex-1 h-8 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingIssueId(issue.id);
                                setCustomEdit(issue.suggestedText || '');
                              }}
                              className="h-8 text-xs px-2"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}

                        {/* Source */}
                        <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            Detected by: <span className="font-medium text-foreground/70">{issue.agentName}</span>
                          </span>
                          <Badge variant="outline" className="text-[9px] h-5" style={{
                            borderColor: `${category?.color}30`,
                            color: category?.color
                          }}>
                            {category?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          AI suggestions are based on script analysis. Review each change carefully.
        </p>
      </div>
    </div>
  );
}
