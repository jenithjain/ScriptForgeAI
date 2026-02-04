'use client';

import { Handle, Position } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Play, Eye } from 'lucide-react';
import AgentIcon from './AgentIcon';

export default function AgentNode({ data, isConnectable, id }) {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return 'border-amber-500/50';
      case 'success': return 'border-emerald-500/50';
      case 'error': return 'border-red-500/50';
      default: return 'border-border';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running': return <Loader2 className="w-3 h-3 animate-spin text-amber-500" />;
      case 'success': return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'running': return <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">Running</Badge>;
      case 'success': return <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">Complete</Badge>;
      default: return <Badge variant="outline" className="border-border bg-muted text-muted-foreground text-[10px]">Ready</Badge>;
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2.5 h-2.5 !bg-emerald-500 !border-2 !border-background"
      />
      
      <Card 
        className={`w-[280px] bg-card/95 backdrop-blur-xl border ${getStatusColor()} hover:border-emerald-500/50 transition-all hover:shadow-xl group relative overflow-hidden cursor-pointer`}
        onClick={() => data.onNodeClick?.(id, data)}
      >
        {/* Colored top border accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: data.color }}
        />
        
        {/* Node ID Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {getStatusIcon()}
        </div>

        <CardContent className="p-4 pt-5">
          {/* Icon and Title */}
          <div className="flex items-start gap-3 mb-3">
            <div 
              className="p-2.5 rounded-xl shrink-0"
              style={{ 
                backgroundColor: `${data.color}15`,
              }}
            >
              <AgentIcon name={data.icon} className="w-5 h-5" color={data.color} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-sm mb-1 leading-tight">
                {data.label}
              </h3>
              {getStatusBadge()}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
            {data.description}
          </p>

          {/* Prompt Display */}
          {data.prompt && (
            <div className="mb-3 p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                GEMINI PROMPT
              </div>
              <div className="text-[10px] text-muted-foreground line-clamp-3 font-mono leading-relaxed">
                {typeof data.prompt === 'string'
                  ? data.prompt.substring(0, 120) + '...'
                  : 'Prompt will be generated during execution'}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-border mb-3" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-8 shadow-lg shadow-emerald-500/20 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                data.onRun?.(data.agentType);
              }}
            >
              <Play className="w-3 h-3 mr-1.5" />
              Run
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="px-3 h-8 border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                data.onNodeClick?.(id, data);
              }}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>

          {/* Output Preview */}
          {data.result && (
            <div className="mt-3 p-2.5 bg-muted/50 rounded-lg border border-border">
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                OUTPUT
              </div>
              <div className="text-[10px] text-muted-foreground line-clamp-2 font-mono">
                {typeof data.result === 'object' 
                  ? JSON.stringify(data.result).substring(0, 80) + '...'
                  : String(data.result).substring(0, 80) + '...'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2.5 h-2.5 !bg-emerald-500 !border-2 !border-background"
      />
    </>
  );
}
