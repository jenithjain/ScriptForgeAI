'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Loader2,
  Network,
  Sparkles,
  Filter,
  RefreshCw,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Package,
  Zap,
  GitBranch,
  BookOpen,
  Info,
  Eye,
  EyeOff,
  Search,
  X,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Dynamic imports for ForceGraph (no SSR)
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// Node type colors and icons
const NODE_TYPES = {
  Character: { color: '#8B5CF6', icon: User, label: 'Characters' },
  Location: { color: '#10B981', icon: MapPin, label: 'Locations' },
  Object: { color: '#F59E0B', icon: Package, label: 'Objects' },
  Event: { color: '#EF4444', icon: Zap, label: 'Events' },
  PlotThread: { color: '#EC4899', icon: GitBranch, label: 'Plot Threads' },
  Chapter: { color: '#3B82F6', icon: BookOpen, label: 'Chapters' },
};

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  color?: string;
  size?: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  label: string;
  properties?: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function StoryKnowledgeGraphPage() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');
  
  const fgRef = useRef<any>(null);
  const fg2DRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [chapters, setChapters] = useState<{ id: string; number: number; summary: string }[]>([]);
  const [currentChapter, setCurrentChapter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(Object.keys(NODE_TYPES)));
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [workflowName, setWorkflowName] = useState<string | null>(null);

  // Fetch graph data
  const fetchGraphData = useCallback(async (chapterNumber?: number) => {
    setLoading(true);
    try {
      let url = chapterNumber 
        ? `/api/story-graph/chapter/${chapterNumber}`
        : '/api/story-graph/overview';
      
      // Add workflowId filter if present
      if (workflowId) {
        url += `?workflowId=${workflowId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        // Transform edges for force-graph (expects links with source/target as strings)
        const transformedData = {
          nodes: data.data.nodes.map((node: GraphNode) => ({
            ...node,
            name: node.label, // ForceGraph uses 'name' for labels
            val: NODE_TYPES[node.type as keyof typeof NODE_TYPES]?.color ? 
              (node.type === 'Chapter' ? 20 : node.type === 'Character' ? 15 : 10) : 8
          })),
          links: data.data.edges.map((edge: GraphEdge) => ({
            ...edge,
            source: typeof edge.source === 'object' ? edge.source.id : edge.source,
            target: typeof edge.target === 'object' ? edge.target.id : edge.target,
            name: edge.label
          }))
        };
        
        setGraphData({ nodes: transformedData.nodes, edges: transformedData.links as any });
        setStats(data.stats?.nodesByType || {});
        
        if (data.chapters) {
          setChapters(data.chapters);
        }
      }
    } catch (error) {
      console.error('Failed to fetch graph:', error);
      toast.error('Failed to load graph data');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  // Fetch chapters list
  const fetchChapters = useCallback(async () => {
    try {
      const response = await fetch('/api/story-graph/chapters');
      const data = await response.json();
      if (data.success) {
        setChapters(data.chapters);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  }, []);

  // Generate demo data
  const generateDemoData = useCallback(async () => {
    setIsGeneratingDemo(true);
    try {
      const response = await fetch('/api/story-graph/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearExisting: true })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Generated ${data.chaptersCreated} chapters with ${data.stats.characters} characters!`);
        await fetchGraphData();
        await fetchChapters();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to generate demo:', error);
      toast.error('Failed to generate demo data');
    } finally {
      setIsGeneratingDemo(false);
    }
  }, [fetchGraphData, fetchChapters]);

  // Initial data fetch
  useEffect(() => {
    fetchGraphData();
    fetchChapters();
  }, [fetchGraphData, fetchChapters]);

  // Filter nodes based on visible types and search
  const filteredData = useMemo(() => {
    let filteredNodes = graphData.nodes.filter(node => visibleTypes.has(node.type));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.label?.toLowerCase().includes(query) ||
        node.properties?.description?.toLowerCase().includes(query)
      );
      setHighlightNodes(new Set(filteredNodes.map(n => n.id)));
    } else {
      setHighlightNodes(new Set());
    }
    
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(edge => {
      const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
      const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
    
    return { nodes: filteredNodes, links: filteredEdges };
  }, [graphData, visibleTypes, searchQuery]);

  // Toggle node type visibility
  const toggleNodeType = (type: string) => {
    const newVisible = new Set(visibleTypes);
    if (newVisible.has(type)) {
      newVisible.delete(type);
    } else {
      newVisible.add(type);
    }
    setVisibleTypes(newVisible);
  };

  // Handle chapter filter
  const handleChapterFilter = (chapterNum: number | null) => {
    setCurrentChapter(chapterNum);
    fetchGraphData(chapterNum || undefined);
  };

  // Node click handler
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);

    if (viewMode === '3d') {
      // Focus camera on node in 3D
      if (fgRef.current) {
        const distance = 150;
        const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
        fgRef.current.cameraPosition(
          { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
          node,
          2000
        );
      }
    } else {
      // Center on node in 2D
      if (fg2DRef.current) {
        fg2DRef.current.centerAt(node.x, node.y, 1000);
        fg2DRef.current.zoom(4, 1000);
      }
    }
  }, [viewMode]);

  // Clear graph data (for current workflow if workflowId is set)
  const clearGraphData = useCallback(async () => {
    const confirmMessage = workflowId 
      ? 'Are you sure you want to clear graph data for this workflow? This cannot be undone.'
      : 'Are you sure you want to clear ALL graph data? This cannot be undone.';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await fetch('/api/story-graph/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: workflowId || undefined })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Graph data cleared successfully');
        setGraphData({ nodes: [], edges: [] });
        setChapters([]);
        setStats({});
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to clear graph:', error);
      toast.error('Failed to clear graph data');
    }
  }, [workflowId]);

  // Configure 2D graph forces for proper node spreading
  useEffect(() => {
    if (viewMode === '2d' && fg2DRef.current) {
      fg2DRef.current.d3Force('charge')?.strength(-800);
      fg2DRef.current.d3Force('link')?.distance(150);
      fg2DRef.current.d3Force('center')?.strength(0.05);
    }
  }, [viewMode, filteredData]);

  // Custom node rendering
  const getNodeColor = useCallback((node: GraphNode) => {
    if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) {
      return '#374151'; // Dim non-matching nodes
    }
    return NODE_TYPES[node.type as keyof typeof NODE_TYPES]?.color || '#6B7280';
  }, [highlightNodes]);

  // Get node icon component
  const getNodeIcon = (type: string) => {
    return NODE_TYPES[type as keyof typeof NODE_TYPES]?.icon || Info;
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="default"
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflow
            </Button>
            <Separator orientation="vertical" className="h-6 bg-border" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Network className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Story Knowledge Graph
                  {workflowId && <span className="text-emerald-400 ml-2 text-sm font-normal">(Current Workflow)</span>}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {graphData.nodes.length} nodes • {graphData.edges.length} relationships
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 2D/3D Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === '2d'
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === '3d'
                    ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                3D
              </button>
            </div>
            <Separator orientation="vertical" className="h-6 bg-border" />
            <Button
              variant="default"
              size="default"
              onClick={generateDemoData}
              disabled={isGeneratingDemo}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              {isGeneratingDemo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Demo Story
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={clearGraphData}
              className="border-red-500/50 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => fetchGraphData(currentChapter || undefined)}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 h-screen flex">
        {/* Floating Sidebar Toggle Button - Always visible */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`fixed top-20 z-40 p-2 rounded-r-lg bg-card/95 border border-l-0 border-border backdrop-blur-xl shadow-lg transition-all duration-300 hover:bg-accent ${
            showFilters ? 'left-72' : 'left-0'
          }`}
          title={showFilters ? 'Hide Filters' : 'Show Filters'}
        >
          {showFilters ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Left Sidebar - Filters & Legend */}
        {showFilters && (
          <div className="w-72 bg-card/80 backdrop-blur-xl border-r border-border flex flex-col h-[calc(100vh-4rem)] overflow-hidden shrink-0">
            <div className="p-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes..."
                  className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Node Types</h3>
              <div className="space-y-2">
                {Object.entries(NODE_TYPES).map(([type, config]) => {
                  const Icon = config.icon;
                  const isVisible = visibleTypes.has(type);
                  const count = stats[type] || 0;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => toggleNodeType(type)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        isVisible ? 'bg-accent' : 'bg-accent/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: config.color }}
                        />
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                        <span className="text-sm text-foreground">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          {count}
                        </Badge>
                        {isVisible ? (
                          <Eye className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 shrink-0">Chapters</h3>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-2 pr-2">
                  <button
                    onClick={() => handleChapterFilter(null)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      currentChapter === null 
                        ? 'bg-emerald-500/20 border border-emerald-500/50' 
                        : 'bg-accent hover:bg-accent/80'
                    }`}
                  >
                    <span className="text-sm font-medium">All Chapters</span>
                  </button>
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterFilter(chapter.number)}
                      className={`w-full text-left p-2 rounded-lg transition-colors ${
                        currentChapter === chapter.number 
                          ? 'bg-blue-500/20 border border-blue-500/50' 
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-foreground">Chapter {chapter.number}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {chapter.summary}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Graph Visualization */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Loading knowledge graph...</p>
              </div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center max-w-md">
                <Network className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Story Data Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a demo story or ingest manuscript text to populate the knowledge graph.
                </p>
                <Button
                  variant="default"
                  size="default"
                  onClick={generateDemoData}
                  disabled={isGeneratingDemo}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  {isGeneratingDemo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Demo Story
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : viewMode === '3d' ? (
            <ForceGraph3D
              ref={fgRef}
              graphData={filteredData}
              nodeLabel={(node: any) => `
                <div style="background: rgba(15, 23, 42, 0.95); padding: 12px; border-radius: 8px; border: 1px solid rgba(71, 85, 105, 0.5); max-width: 250px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${NODE_TYPES[node.type as keyof typeof NODE_TYPES]?.color || '#6B7280'};"></div>
                    <strong style="color: white; font-size: 14px;">${node.label || node.name}</strong>
                  </div>
                  <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">Type: ${node.type}</div>
                  ${node.properties?.description ? `<div style="color: #64748b; font-size: 11px; margin-top: 4px;">${node.properties.description.substring(0, 100)}${node.properties.description.length > 100 ? '...' : ''}</div>` : ''}
                </div>
              `}
              nodeColor={getNodeColor}
              nodeVal={(node: any) => node.type === 'Chapter' ? 20 : node.type === 'Character' ? 15 : 10}
              nodeOpacity={0.9}
              linkLabel={(link: any) => link.label || link.type}
              linkColor={() => 'rgba(16, 185, 129, 0.5)'}
              linkWidth={1.5}
              linkOpacity={0.6}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.005}
              onNodeClick={handleNodeClick}
              backgroundColor="#0f172a"
              showNavInfo={false}
              enableNodeDrag={true}
              enableNavigationControls={true}
              controlType="orbit"
            />
          ) : (
            <ForceGraph2D
              ref={fg2DRef}
              graphData={filteredData}
              nodeLabel={(node: any) => `${node.label || node.name} (${node.type})`}
              nodeColor={getNodeColor}
              nodeVal={(node: any) => node.type === 'Chapter' ? 20 : node.type === 'Character' ? 15 : 10}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.label || node.name;
                const fontSize = 12 / globalScale;
                const nodeR = Math.sqrt(node.type === 'Chapter' ? 20 : node.type === 'Character' ? 15 : 10) * 2;
                const color = getNodeColor(node);

                // Draw node circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();

                // Draw border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Draw label if zoomed in enough
                if (globalScale > 1.5) {
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                  ctx.fillText(label, node.x, node.y + nodeR + 2);
                }
              }}
              linkColor={() => 'rgba(16, 185, 129, 0.5)'}
              linkWidth={1.5}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.005}
              linkLabel={(link: any) => link.label || link.type}
              onNodeClick={handleNodeClick}
              backgroundColor="#0f172a"
              enableNodeDrag={true}
              warmupTicks={500}
              cooldownTicks={800}
              d3AlphaDecay={0.01}
              d3VelocityDecay={0.3}
              onEngineStop={() => {
                if (fg2DRef.current) {
                  fg2DRef.current.zoomToFit(400, 60);
                }
              }}
            />
          )}

          {/* Selected Node Details */}
          {selectedNode && (
            <Card className="absolute top-4 left-4 w-96 max-h-[calc(100vh-10rem)] bg-card/95 border-border backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden z-50">
              <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_TYPES[selectedNode.type as keyof typeof NODE_TYPES]?.color }}
                    />
                    <CardTitle className="text-foreground text-lg truncate">{selectedNode.label}</CardTitle>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit mt-1"
                  style={{
                    backgroundColor: `${NODE_TYPES[selectedNode.type as keyof typeof NODE_TYPES]?.color}20`,
                    color: NODE_TYPES[selectedNode.type as keyof typeof NODE_TYPES]?.color,
                    borderColor: NODE_TYPES[selectedNode.type as keyof typeof NODE_TYPES]?.color
                  }}
                >
                  {selectedNode.type}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-hidden pb-4">
                <ScrollArea className="h-full [&_[data-slot=scroll-area-thumb]]:bg-emerald-500/40 [&_[data-slot=scroll-area-scrollbar]]:w-1.5">
                  <div className="space-y-3 text-sm pr-3">
                    {Object.entries(selectedNode.properties || {}).map(([key, value]) => {
                      if (key === 'id' || !value) return null;
                      return (
                        <div key={key}>
                          <div className="text-muted-foreground text-xs uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className="text-foreground break-words">
                            {Array.isArray(value)
                              ? value.join(', ')
                              : typeof value === 'object' && value !== null
                                ? (value.year || value.month || value.day
                                  ? new Date(
                                      value.year?.low ?? value.year ?? 0,
                                      (value.month?.low ?? value.month ?? 1) - 1,
                                      value.day?.low ?? value.day ?? 1,
                                      value.hour?.low ?? value.hour ?? 0,
                                      value.minute?.low ?? value.minute ?? 0
                                    ).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                                  : JSON.stringify(value, null, 2))
                                : String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Chapter Navigation */}
      {chapters.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border rounded-full px-4 py-2 shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const prev = currentChapter ? Math.max(1, currentChapter - 1) : chapters[chapters.length - 1]?.number;
                handleChapterFilter(prev);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleChapterFilter(ch.number)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentChapter === ch.number 
                      ? 'bg-emerald-500 scale-125' 
                      : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                  }`}
                  title={`Chapter ${ch.number}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = currentChapter ? Math.min(chapters.length, currentChapter + 1) : 1;
                handleChapterFilter(next);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 bg-border mx-2" />
            
            <span className="text-sm text-muted-foreground">
              {currentChapter ? `Chapter ${currentChapter}` : 'All Chapters'}
            </span>
          </div>
        </div>
      )}

      {/* Instructions overlay for empty state */}
      {graphData.nodes.length === 0 && !loading && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl px-6 py-4 shadow-2xl max-w-lg">
            <h4 className="font-semibold text-foreground mb-2">How to use:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Click &quot;Generate Demo Story&quot; to create sample data</li>
              <li>2. Or use the Story Intelligence agent to analyze your manuscript</li>
              <li>3. Navigate through chapters using the timeline below</li>
              <li>4. Click on nodes to see details, drag to explore</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
