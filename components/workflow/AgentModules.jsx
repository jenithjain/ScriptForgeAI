'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AGENT_DEFINITIONS, AGENT_CATEGORIES } from '@/lib/agents/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical } from 'lucide-react';

export default function AgentModules({ onAgentDrag }) {
  const handleDragStart = (event, agent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'agent',
      agentType: agent.id,
      label: agent.name,
      description: agent.description,
      icon: agent.icon,
      color: agent.color
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-2">
        {Object.entries(AGENT_CATEGORIES).map(([category, agentIds]) => (
          <div key={category}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{category}</h3>
            <div className="space-y-3">
              {agentIds.map((agentId) => {
                const agent = AGENT_DEFINITIONS[agentId];
                return (
                  <Card
                    key={agent.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, agent)}
                    className="p-3 cursor-grab active:cursor-grabbing bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group relative overflow-hidden"
                  >
                    {/* Colored left border accent */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: agent.color }}
                    />
                    
                    <div className="flex items-start gap-3">
                      <div 
                        className="p-2 rounded-lg text-lg shrink-0 group-hover:scale-110 transition-transform shadow-sm"
                        style={{ 
                          backgroundColor: `${agent.color}15`,
                          boxShadow: `0 0 15px ${agent.color}20`
                        }}
                      >
                        {agent.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-white text-xs leading-tight">{agent.name}</h4>
                          <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                          {agent.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 2).map((capability, idx) => (
                            <Badge 
                              key={idx}
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 bg-slate-950/50 text-slate-400 border-0 font-normal"
                            >
                              {capability.length > 20 ? capability.substring(0, 20) + '...' : capability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
