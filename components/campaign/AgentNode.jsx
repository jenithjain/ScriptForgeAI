'use client';

import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from 'reactflow';
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Calendar, 
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Settings2,
  Download,
  X,
  ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCampaignStore } from '@/lib/store';
import { motion } from 'framer-motion';

const iconMap = {
  strategy: Sparkles,
  copy: FileText,
  image: ImageIcon,
  research: Search,
  timeline: Calendar,
  distribution: Send,
};

const typeColorMap = {
  strategy: 'bg-blue-500/10 border-blue-500/30',
  copy: 'bg-orange-500/10 border-orange-500/30',
  image: 'bg-pink-500/10 border-pink-500/30',
  research: 'bg-green-500/10 border-green-500/30',
  timeline: 'bg-red-500/10 border-red-500/30',
  distribution: 'bg-indigo-500/10 border-indigo-500/30',
};

const badgeColorMap = {
  idle: 'bg-muted/50 text-muted-foreground border-border',
  loading: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  complete: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
};

const badgeLabelMap = {
  strategy: 'Research',
  copy: 'Creative',
  image: 'Creative',
  research: 'Research',
  timeline: 'Strategy',
  distribution: 'Scheduling',
  communication: 'Communication',
};

function AgentNode({ data, id }) {
  const { nodes, edges, brief, strategy, updateNodeStatus } = useCampaignStore();
  const [lightboxImage, setLightboxImage] = React.useState(null);

  const Icon = iconMap[data.type] || Sparkles;
  const colorClass = typeColorMap[data.type] || typeColorMap.strategy;
  const badgeClass = badgeColorMap[data.status] || badgeColorMap.idle;

  const handleRunAgent = async () => {
    if (data.status === 'loading') return;

    updateNodeStatus(id, 'loading');

    try {
      const response = await fetch('/api/campaign/execute-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: id,
          nodes,
          edges,
          brief,
          strategy: strategy?.rationale || '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateNodeStatus(id, 'complete', result.output);
      } else {
        updateNodeStatus(id, 'error', undefined, result.error);
      }
    } catch (error) {
      updateNodeStatus(id, 'error', undefined, error.message);
    }
  };

  const displayOutput = data.output || '';
  const truncatedOutput = displayOutput.length > 200 
    ? displayOutput.substring(0, 200) + '...' 
    : displayOutput;

  const handleDownloadImage = (imageUrl, index) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `campaign-image-${id}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: data.isExecuting ? [1, 1.05, 1] : 1,
      }}
      transition={{ 
        duration: 0.3,
        scale: data.isExecuting ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}
      }}
      className="relative"
    >
      {/* Executing pulse ring */}
      {data.isExecuting && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-emerald-500"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3! h-3! bg-primary! border-2! border-primary/50!"
      />

      {/* Agent Card */}
      <div
        className={`
          relative w-[280px] rounded-lg border-2 bg-card
          ${colorClass}
          ${data.isExecuting ? 'border-emerald-500 shadow-emerald-500/50' : ''}
          shadow-md hover:shadow-lg transition-all duration-300
        `}
      >
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className={`
              p-1.5 rounded-md ${colorClass} border
            `}>
              <Icon className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10px] text-muted-foreground font-medium">ID: {data.id || id.substring(0, 10)}</p>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/10 border-emerald-500/20">
                  <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground text-sm truncate">{data.label}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={data.openSettings}
            >
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {data.promptContext || 'AI-powered content generation module'}
          </p>

          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <Badge className="text-[10px] px-2 py-0.5 h-5 bg-primary/10 text-primary border-primary/20">
              {badgeLabelMap[data.type] || 'General'}
            </Badge>
            
            {/* Status Badge */}
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border
              ${badgeClass}
            `}>
              {data.status === 'idle' && 'Ready'}
              {data.status === 'loading' && (
                <>
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Processing
                </>
              )}
              {data.status === 'complete' && (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Complete
                </>
              )}
              {data.status === 'error' && (
                <>
                  <AlertCircle className="w-2.5 h-2.5" />
                  Error
                </>
              )}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 min-h-[100px] max-h-[250px] overflow-y-auto campaign-sidebar-scroll">
          {data.status === 'idle' && (
            <div className="text-xs text-muted-foreground">
              <p className="leading-relaxed">{data.promptContext || 'Ready to generate content based on campaign strategy.'}</p>
            </div>
          )}

          {data.status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Generating content...</p>
            </div>
          )}

          {data.status === 'complete' && (
            <div className="text-xs text-foreground">
              {data.type === 'image' ? (
                (() => {
                  try {
                    const parsed = JSON.parse(displayOutput);
                    const imgs = parsed?.images ?? [];
                    if (Array.isArray(imgs) && imgs.length > 0) {
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {imgs.map((it, idx) => (
                            <div 
                              key={idx} 
                              className="relative rounded-md overflow-hidden border border-border group cursor-pointer"
                              onClick={() => setLightboxImage({ url: it.url, index: idx, theme: it.theme })}
                            >
                              <img src={it.url} alt={`generated-${idx}`} className="w-full h-24 object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch {}
                  return <p className="whitespace-pre-wrap leading-relaxed">{truncatedOutput}</p>;
                })()
              ) : (
                <>
                  <p className="whitespace-pre-wrap leading-relaxed">{truncatedOutput}</p>
                  {displayOutput.length > 200 && (
                    <button 
                      className="text-xs text-primary hover:text-primary/80 mt-2 underline"
                      onClick={data.openSettings}
                    >
                      View full output
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {data.status === 'error' && (
            <div className="text-xs text-destructive">
              <p className="font-medium mb-1">Error occurred:</p>
              <p className="text-[10px]">{data.error || 'Unknown error'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30">
          {(data.status === 'idle' || data.status === 'error') && (
            <Button
              onClick={handleRunAgent}
              disabled={data.status === 'loading'}
              className="w-full h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
            >
              <Play className="w-3 h-3 mr-1.5" />
              Run Agent
            </Button>
          )}

          {data.status === 'complete' && (
            <div className="flex gap-2">
              <Button
                onClick={data.openSettings}
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                Edit
              </Button>
              <Button
                onClick={handleRunAgent}
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3! h-3! bg-primary! border-2! border-primary/50!"
      />

      {/* Image Lightbox Modal - Portal to body */}
      {lightboxImage && typeof document !== 'undefined' && createPortal(
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
          onClick={() => setLightboxImage(null)}
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
              <p style={{ color: '#f9fafb', fontWeight: '600', fontSize: '14px' }}>Image {lightboxImage.index + 1}</p>
              {lightboxImage.theme && (
                <span style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: '500'
                }}>
                  {lightboxImage.theme}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadImage(lightboxImage.url, lightboxImage.index);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <button
                onClick={() => setLightboxImage(null)}
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
              src={lightboxImage.url} 
              alt={`Campaign image ${lightboxImage.index + 1}`} 
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
    </motion.div>
  );
}

export default memo(AgentNode);
