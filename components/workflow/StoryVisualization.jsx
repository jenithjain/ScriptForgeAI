'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Network, Clock, Users, MapPin, X, Maximize2, Minimize2,
    RefreshCw, ZoomIn, ZoomOut, ChevronRight, Sparkles
} from 'lucide-react';

/**
 * StoryVisualization — Interactive relationship graph + timeline visualization
 * Renders Neo4j knowledge graph data and timeline events as SVG visualizations.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================
const NODE_COLORS = {
    Character: { bg: '#8B5CF6', text: '#fff', border: '#7C3AED' },
    Location: { bg: '#06B6D4', text: '#fff', border: '#0891B2' },
    Event: { bg: '#F59E0B', text: '#000', border: '#D97706' },
    Object: { bg: '#10B981', text: '#fff', border: '#059669' },
    PlotThread: { bg: '#EC4899', text: '#fff', border: '#DB2777' },
    Default: { bg: '#6B7280', text: '#fff', border: '#4B5563' },
};

const NODE_SIZES = {
    Character: 32,
    Location: 22,
    Event: 18,
    Object: 16,
    PlotThread: 20,
    Default: 16,
};

const RELATIONSHIP_COLORS = {
    familial: '#F97316',
    romantic: '#EF4444',
    professional: '#3B82F6',
    adversarial: '#DC2626',
    ally: '#10B981',
    friend: '#8B5CF6',
    knows: '#6B7280',
    default: '#9CA3AF',
};

// Type cluster centers — group similar types together
const TYPE_GRAVITY = {
    Character: { cx: 0.5, cy: 0.55 },   // Center
    Location: { cx: 0.15, cy: 0.3 },     // Top-left
    Event: { cx: 0.5, cy: 0.15 },        // Top-center
    Object: { cx: 0.15, cy: 0.7 },       // Bottom-left
    PlotThread: { cx: 0.85, cy: 0.15 },  // Top-right
};

// ============================================================================
// Force-directed layout with type clustering
// ============================================================================
function computeLayout(nodes, edges, width, height) {
    if (!nodes.length) return [];

    // Initialize positions clustered by type
    const positions = nodes.map((n, i) => {
        const typeGrav = TYPE_GRAVITY[n.type] || { cx: 0.5, cy: 0.5 };
        const jitter = 0.15;
        return {
            id: n.id,
            type: n.type,
            x: (typeGrav.cx + (Math.random() - 0.5) * jitter) * width,
            y: (typeGrav.cy + (Math.random() - 0.5) * jitter) * height,
            vx: 0,
            vy: 0,
        };
    });

    const posMap = {};
    positions.forEach(p => { posMap[p.id] = p; });

    const iterations = 120;
    for (let iter = 0; iter < iterations; iter++) {
        const alpha = Math.max(0.01, 1 - iter / iterations);
        const cooling = 0.95 - (iter / iterations) * 0.4;

        // Repulsion between all nodes (stronger)
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                let dx = positions[j].x - positions[i].x;
                let dy = positions[j].y - positions[i].y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const minDist = 80;
                if (dist < minDist * 3) {
                    let force = (300 * alpha) / (dist * dist) * minDist;
                    positions[i].vx -= (dx / dist) * force;
                    positions[i].vy -= (dy / dist) * force;
                    positions[j].vx += (dx / dist) * force;
                    positions[j].vy += (dy / dist) * force;
                }
            }
        }

        // Attraction along edges
        edges.forEach(e => {
            const source = posMap[e.source];
            const target = posMap[e.target];
            if (!source || !target) return;
            let dx = target.x - source.x;
            let dy = target.y - source.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = 140;
            let force = (dist - idealDist) * 0.015 * alpha;
            source.vx += (dx / dist) * force;
            source.vy += (dy / dist) * force;
            target.vx -= (dx / dist) * force;
            target.vy -= (dy / dist) * force;
        });

        // Type-based cluster gravity (gentle pull toward type zones)
        positions.forEach(p => {
            const typeGrav = TYPE_GRAVITY[p.type] || { cx: 0.5, cy: 0.5 };
            const targetX = typeGrav.cx * width;
            const targetY = typeGrav.cy * height;
            p.vx += (targetX - p.x) * 0.005 * alpha;
            p.vy += (targetY - p.y) * 0.005 * alpha;
        });

        // Global center gravity (keep everything from flying away)
        positions.forEach(p => {
            p.vx += (width / 2 - p.x) * 0.002 * alpha;
            p.vy += (height / 2 - p.y) * 0.002 * alpha;
        });

        // Apply velocities with damping
        positions.forEach(p => {
            p.x += p.vx * cooling;
            p.y += p.vy * cooling;
            p.vx *= 0.6;
            p.vy *= 0.6;
            // Keep in bounds with generous padding
            const pad = 50;
            p.x = Math.max(pad, Math.min(width - pad, p.x));
            p.y = Math.max(pad, Math.min(height - pad, p.y));
        });
    }

    return positions;
}

// ============================================================================
// RELATIONSHIP GRAPH COMPONENT
// ============================================================================
function RelationshipGraph({ graphData, onNodeClick }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 900, height: 550 });

    // Measure container
    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width || 900, height: rect.height || 550 });
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const { nodes, edges } = graphData;
    const positions = useMemo(
        () => computeLayout(nodes, edges, dimensions.width, dimensions.height),
        [nodes, edges, dimensions.width, dimensions.height]
    );
    const posMap = useMemo(() => {
        const m = {};
        positions.forEach(p => { m[p.id] = p; });
        return m;
    }, [positions]);

    // Mouse handlers for panning
    const handleMouseDown = (e) => {
        if (e.target === svgRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
            setDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };
    const handleMouseMove = (e) => {
        if (dragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };
    const handleMouseUp = () => setDragging(false);

    // Scroll to zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(z => Math.max(0.3, Math.min(3, z + delta)));
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden">
            {/* Controls */}
            <div className="absolute top-3 right-3 z-10 flex gap-1 bg-background/90 backdrop-blur rounded-lg p-1 border border-border">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(z + 0.2, 3))} title="Zoom In">
                    <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))} title="Zoom Out">
                    <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset View">
                    <Maximize2 className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-10 flex gap-3 flex-wrap bg-background/90 backdrop-blur rounded-lg px-3 py-2 border border-border">
                {Object.entries(NODE_COLORS).filter(([k]) => k !== 'Default').map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: colors.bg, borderColor: colors.border }} />
                        <span className="text-muted-foreground font-medium">{type}</span>
                    </div>
                ))}
            </div>

            {/* SVG Canvas */}
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <defs>
                    {/* Glow filter */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Shadow for text background */}
                    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.6" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Arrow marker */}
                    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" opacity="0.5" />
                    </marker>
                </defs>

                {/* Background (for click/drag detection) */}
                <rect width="100%" height="100%" fill="transparent" />

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {edges.map((edge, i) => {
                        const source = posMap[edge.source];
                        const target = posMap[edge.target];
                        if (!source || !target) return null;

                        const relType = (edge.label || edge.type || '').toLowerCase();
                        const color = RELATIONSHIP_COLORS[relType] || RELATIONSHIP_COLORS.default;
                        const isHighlighted = selectedNode && (edge.source === selectedNode || edge.target === selectedNode);

                        // Midpoint for label
                        const mx = (source.x + target.x) / 2;
                        const my = (source.y + target.y) / 2;

                        return (
                            <g key={`edge-${i}`} opacity={selectedNode && !isHighlighted ? 0.08 : 1}>
                                <line
                                    x1={source.x} y1={source.y}
                                    x2={target.x} y2={target.y}
                                    stroke={isHighlighted ? color : '#4B5563'}
                                    strokeWidth={isHighlighted ? 2.5 : 1}
                                    strokeOpacity={isHighlighted ? 0.9 : 0.3}
                                    markerEnd="url(#arrowhead)"
                                    strokeDasharray={isHighlighted ? 'none' : '4 2'}
                                />
                                {/* Edge label — only show when highlighted or no selection */}
                                {edge.label && (isHighlighted || !selectedNode) && (
                                    <g>
                                        <rect
                                            x={mx - 40} y={my - 10}
                                            width={80} height={16} rx={4}
                                            fill="rgba(0,0,0,0.7)"
                                        />
                                        <text
                                            x={mx} y={my + 2}
                                            textAnchor="middle"
                                            fontSize={8}
                                            fill="#fff"
                                            fontWeight={500}
                                        >
                                            {(edge.label || '').length > 18 ? edge.label.slice(0, 17) + '…' : edge.label}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {positions.map(pos => {
                        const node = nodes.find(n => n.id === pos.id);
                        if (!node) return null;
                        const colors = NODE_COLORS[node.type] || NODE_COLORS.Default;
                        const radius = NODE_SIZES[node.type] || NODE_SIZES.Default;
                        const isHovered = hoveredNode === node.id;
                        const isSelected = selectedNode === node.id;
                        const isConnected = selectedNode && edges.some(
                            e => (e.source === selectedNode && e.target === node.id) ||
                                (e.target === selectedNode && e.source === node.id)
                        );
                        const isDimmed = selectedNode && !isSelected && !isConnected;

                        const label = node.name || node.label || '';
                        const maxLabelLen = node.type === 'Character' ? 20 : 16;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNode(isSelected ? null : node.id);
                                    onNodeClick?.(node);
                                }}
                                opacity={isDimmed ? 0.15 : 1}
                                style={{ transition: 'opacity 0.3s' }}
                            >
                                {/* Glow ring on hover/select */}
                                {(isHovered || isSelected) && (
                                    <circle
                                        r={radius + 6}
                                        fill="none"
                                        stroke={colors.bg}
                                        strokeWidth={2}
                                        opacity={0.5}
                                        filter="url(#glow)"
                                    />
                                )}
                                {/* Node circle */}
                                <circle
                                    r={radius}
                                    fill={colors.bg}
                                    stroke={isSelected ? '#fff' : colors.border}
                                    strokeWidth={isSelected ? 3 : 1.5}
                                    style={{ transition: 'all 0.2s' }}
                                />
                                {/* Type icon */}
                                <text
                                    y={node.type === 'Character' ? -5 : -2}
                                    textAnchor="middle"
                                    fontSize={node.type === 'Character' ? '16' : '12'}
                                    fill={colors.text}
                                >
                                    {node.type === 'Character' ? '👤' :
                                        node.type === 'Location' ? '📍' :
                                            node.type === 'Event' ? '⚡' :
                                                node.type === 'Object' ? '📦' :
                                                    node.type === 'PlotThread' ? '🧵' : '●'}
                                </text>
                                {/* Name inside node (for characters) or below (for others) */}
                                {node.type === 'Character' ? (
                                    <text
                                        y={12}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fontWeight="700"
                                        fill={colors.text}
                                    >
                                        {label.length > maxLabelLen ? label.slice(0, maxLabelLen - 1) + '…' : label}
                                    </text>
                                ) : (
                                    <text
                                        y={radius + 14}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fontWeight="600"
                                        fill="currentColor"
                                        className="text-foreground"
                                        filter="url(#textShadow)"
                                    >
                                        {label.length > maxLabelLen ? label.slice(0, maxLabelLen - 1) + '…' : label}
                                    </text>
                                )}

                                {/* Hover tooltip — full name + type  */}
                                {isHovered && (
                                    <g>
                                        <rect
                                            x={-(Math.max(label.length * 4.5 + 30, 80)) / 2}
                                            y={-radius - 36}
                                            width={Math.max(label.length * 4.5 + 30, 80)}
                                            height={24}
                                            rx={6}
                                            fill="rgba(0,0,0,0.9)"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth={1}
                                        />
                                        <text
                                            y={-radius - 20}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill="#fff"
                                            fontWeight="500"
                                        >
                                            {label} · {node.type}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Selected Node Detail Card */}
            {selectedNode && (() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                const colors = NODE_COLORS[node.type] || NODE_COLORS.Default;
                const connectedEdges = edges.filter(e => e.source === selectedNode || e.target === selectedNode);

                return (
                    <div className="absolute top-3 left-3 z-10 w-72 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: colors.bg, color: colors.text }}>
                                {node.type === 'Character' ? '👤' : node.type === 'Location' ? '📍' : node.type === 'Event' ? '⚡' : node.type === 'PlotThread' ? '🧵' : '📦'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-foreground truncate">{node.name || node.label}</h4>
                                <Badge variant="outline" className="text-[9px] h-4" style={{ borderColor: colors.bg, color: colors.bg }}>
                                    {node.type}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSelectedNode(null)}>
                                <X className="w-3 h-3" />
                            </Button>
                        </div>

                        {node.properties?.description && (
                            <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{node.properties.description}</p>
                        )}

                        {node.properties?.traits?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {node.properties.traits.slice(0, 5).map((t, i) => (
                                    <Badge key={i} variant="secondary" className="text-[9px] h-4">{t}</Badge>
                                ))}
                            </div>
                        )}

                        {connectedEdges.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                                    {connectedEdges.length} Connection{connectedEdges.length !== 1 ? 's' : ''}
                                </p>
                                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {connectedEdges.slice(0, 10).map((edge, i) => {
                                        const otherId = edge.source === selectedNode ? edge.target : edge.source;
                                        const otherNode = nodes.find(n => n.id === otherId);
                                        const otherColors = NODE_COLORS[otherNode?.type] || NODE_COLORS.Default;
                                        return (
                                            <div key={i} className="flex items-center gap-1.5 text-[10px] p-1 rounded hover:bg-muted/30 cursor-pointer"
                                                onClick={() => { setSelectedNode(otherId); }}>
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: otherColors.bg }} />
                                                <span className="text-muted-foreground">{edge.label || 'connected'}</span>
                                                <span className="font-medium text-foreground truncate">{otherNode?.name || otherId}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

// ============================================================================
// TIMELINE COMPONENT
// ============================================================================
function StoryTimeline({ timelineData, graphData }) {
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Combine chronologicalEvents from timeline + events from graph
    const events = useMemo(() => {
        const allEvents = [];

        // From timeline data
        if (timelineData?.chronologicalEvents) {
            timelineData.chronologicalEvents.forEach(evt => {
                allEvents.push({
                    id: evt.id,
                    name: evt.name,
                    description: evt.description,
                    chapter: evt.chapter || 0,
                    timestamp: evt.timestamp || '',
                    participants: evt.participants || [],
                    location: evt.location || '',
                    type: 'chronological',
                });
            });
        }

        // From graph events
        if (graphData?.nodes) {
            graphData.nodes.filter(n => n.type === 'Event').forEach(evt => {
                // Avoid duplicates
                if (!allEvents.find(e => e.id === evt.id)) {
                    allEvents.push({
                        id: evt.id,
                        name: evt.name || evt.label,
                        description: evt.properties?.description || '',
                        chapter: evt.properties?.chapter || 0,
                        timestamp: evt.properties?.timestamp || '',
                        participants: evt.properties?.participants || [],
                        location: evt.properties?.location || '',
                        type: 'graph-event',
                    });
                }
            });
        }

        return allEvents.sort((a, b) => (a.chapter || 0) - (b.chapter || 0));
    }, [timelineData, graphData]);

    // Temporal issues
    const issues = useMemo(() => {
        return timelineData?.temporalIssues || [];
    }, [timelineData]);

    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <Clock className="w-5 h-5 mr-2 opacity-50" />
                No timeline events found. Run a workflow to extract events.
            </div>
        );
    }

    const maxChapter = Math.max(...events.map(e => e.chapter || 1), 1);

    return (
        <div className="w-full h-full overflow-y-auto p-6 ai-editor-scroll">
            {/* Duration & Pace */}
            {(timelineData?.storyDuration || timelineData?.narrativePace) && (
                <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {timelineData.storyDuration && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-400" />
                            Duration: <strong className="text-foreground">{timelineData.storyDuration}</strong>
                        </span>
                    )}
                    {timelineData.narrativePace && (
                        <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Pace: <strong className="text-foreground">{timelineData.narrativePace}</strong>
                        </span>
                    )}
                </div>
            )}

            {/* Timeline issues */}
            {issues.length > 0 && (
                <div className="mb-5 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs font-semibold text-amber-500 mb-2">⚠️ {issues.length} Temporal Issue(s)</p>
                    <div className="space-y-1.5">
                        {issues.map((issue, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                                <Badge variant="outline" className="text-[9px] h-4 mr-1.5" style={{
                                    borderColor: issue.severity === 'critical' ? '#EF4444' : issue.severity === 'high' ? '#F97316' : '#F59E0B',
                                    color: issue.severity === 'critical' ? '#EF4444' : issue.severity === 'high' ? '#F97316' : '#F59E0B',
                                }}>{issue.severity}</Badge>
                                {issue.description}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline visualization */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-500 opacity-30" />

                {events.map((event, idx) => {
                    const isSelected = selectedEvent === event.id;
                    const progress = maxChapter > 1 ? ((event.chapter || 1) - 1) / (maxChapter - 1) : 0;
                    const hue = 150 + progress * 120; // Green → Blue → Purple

                    return (
                        <div
                            key={event.id || idx}
                            className="relative flex gap-4 mb-4 group"
                            onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                        >
                            {/* Chapter dot */}
                            <div
                                className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-all group-hover:scale-110"
                                style={{
                                    backgroundColor: `hsla(${hue}, 70%, 50%, 0.2)`,
                                    border: `2px solid hsla(${hue}, 70%, 50%, 0.6)`,
                                    color: `hsl(${hue}, 70%, 60%)`,
                                }}
                            >
                                {event.chapter || idx + 1}
                            </div>

                            {/* Event card */}
                            <div className={`flex-1 rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? 'bg-muted/60 border-emerald-500/40 shadow-lg' : 'bg-card hover:bg-muted/30 border-border'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-foreground">{event.name}</h4>
                                    {event.timestamp && (
                                        <Badge variant="outline" className="text-[9px] h-4">{event.timestamp}</Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{event.description}</p>

                                {isSelected && (
                                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1 animate-in slide-in-from-top-1">
                                        {event.location && (
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {event.location}
                                            </p>
                                        )}
                                        {event.participants?.length > 0 && (
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {event.participants.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Flashbacks */}
            {timelineData?.flashbacks?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">⏪ Flashbacks</h4>
                    <div className="space-y-2">
                        {timelineData.flashbacks.map((fb, i) => (
                            <div key={i} className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2">
                                <span className="font-medium text-foreground">Position {fb.narrativePosition}:</span> {fb.description}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function StoryVisualization({ workflowId, graphData: propGraphData, timelineData: propTimelineData, isOpen, onClose }) {
    const [activeView, setActiveView] = useState('graph');
    const [graphData, setGraphData] = useState(propGraphData || { nodes: [], edges: [] });
    const [timelineData, setTimelineData] = useState(propTimelineData || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Fetch graph data from Neo4j API
    const fetchGraphData = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = workflowId
                ? `/api/story-graph/overview?workflowId=${workflowId}`
                : '/api/story-graph/overview';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.data) {
                setGraphData(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch graph:', err);
        } finally {
            setIsLoading(false);
        }
    }, [workflowId]);

    // Fetch on mount if no prop data
    useEffect(() => {
        if (!propGraphData || propGraphData.nodes?.length === 0) {
            fetchGraphData();
        }
    }, [propGraphData, fetchGraphData]);

    // Update from props
    useEffect(() => {
        if (propGraphData) setGraphData(propGraphData);
    }, [propGraphData]);
    useEffect(() => {
        if (propTimelineData) setTimelineData(propTimelineData);
    }, [propTimelineData]);

    if (!isOpen) return null;

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative w-full h-full'} bg-background border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl`}>
            {/* Header */}
            <div className="h-10 border-b border-border flex items-center justify-between px-3 bg-card/50 backdrop-blur shrink-0">
                <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-foreground">Story Visualization</h3>
                    <Badge className="text-[9px] h-4 bg-emerald-500/20 text-emerald-500 border-0">
                        {graphData.nodes?.length || 0} nodes · {graphData.edges?.length || 0} edges
                    </Badge>
                </div>

                <div className="flex items-center gap-1">
                    <Tabs value={activeView} onValueChange={setActiveView}>
                        <TabsList className="h-7 bg-muted/50">
                            <TabsTrigger value="graph" className="h-6 text-[11px] px-2 gap-1">
                                <Network className="w-3 h-3" /> Graph
                            </TabsTrigger>
                            <TabsTrigger value="timeline" className="h-6 text-[11px] px-2 gap-1">
                                <Clock className="w-3 h-3" /> Timeline
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="w-px h-5 bg-border mx-1" />

                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchGraphData} disabled={isLoading}>
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </Button>
                    {onClose && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading graph data...</span>
                    </div>
                ) : graphData.nodes?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Network className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No graph data available</p>
                        <p className="text-xs mt-1">Run a workflow to generate the knowledge graph</p>
                        <Button size="sm" variant="outline" className="mt-3" onClick={fetchGraphData}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                        </Button>
                    </div>
                ) : activeView === 'graph' ? (
                    <RelationshipGraph
                        graphData={graphData}
                        onNodeClick={(node) => console.log('Node clicked:', node)}
                    />
                ) : (
                    <StoryTimeline
                        timelineData={timelineData}
                        graphData={graphData}
                    />
                )}
            </div>
        </div>
    );
}
