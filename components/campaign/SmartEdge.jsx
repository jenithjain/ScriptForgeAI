'use client';

import React, { useState, memo } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  useStore 
} from 'reactflow';
import { Settings } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCampaignStore } from '@/lib/store';
import { motion } from 'framer-motion';

function SmartEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLogic, setEditedLogic] = useState(data?.transferLogic || '');
  const { updateEdgeTransferLogic } = useCampaignStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Check if the target node is loading (for animation)
  const targetNodeLoading = useStore((state) => {
    const targetNode = state.nodeInternals.get(id.split('->')[1]);
    return targetNode?.data?.status === 'loading';
  });

  const handleSave = () => {
    updateEdgeTransferLogic(id, editedLogic);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedLogic(data?.transferLogic || '');
    setIsEditing(false);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: targetNodeLoading ? '#10b981' : '#334155',
          strokeWidth: 2,
          animation: targetNodeLoading ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  group relative flex items-center gap-2 px-3 py-1.5 rounded-full
                  bg-linear-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-sm
                  border border-white/10 shadow-lg
                  hover:from-emerald-600/90 hover:to-teal-600/90
                  transition-all duration-200
                  ${targetNodeLoading ? 'animate-pulse' : ''}
                `}
              >
                <span className="text-xs font-medium text-white">
                  {data?.label || 'Context'}
                </span>
                <Settings className="w-3 h-3 text-white/70 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
              </motion.button>
            </PopoverTrigger>

            <PopoverContent 
              className="w-96 bg-card/95 backdrop-blur-xl border-white/10"
              side="top"
            >
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-white mb-1">
                    Edge Transfer Logic
                  </h4>
                  <p className="text-xs text-white/60">
                    Define how data flows from the source node to the target node
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80">
                    Connection Label
                  </label>
                  <input
                    type="text"
                    value={data?.label || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-md bg-black/20 border border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80">
                    Transfer Instructions
                  </label>
                  <Textarea
                    value={editedLogic}
                    onChange={(e) => setEditedLogic(e.target.value)}
                    placeholder="Describe what information should flow and how it should be used..."
                    className="min-h-[120px] text-sm bg-black/20 border-white/10 text-white resize-none"
                  />
                  <p className="text-xs text-white/50">
                    Be specific about which aspects of the source output should influence the target
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="flex-1 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </EdgeLabelRenderer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}

export default memo(SmartEdge);
