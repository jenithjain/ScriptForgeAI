'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, XCircle, Loader2, Play, Network, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentIcon from './AgentIcon';

export default function AgentDetailModal({ agent, isOpen, onClose, onRunAgent }) {
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const router = useRouter();

  if (!agent) return null;

  const isKnowledgeGraphAgent = agent.data?.agentType === 'knowledge-graph' || agent.data?.type === 'knowledge-graph';
  const isStoryIntelligenceAgent = agent.data?.agentType === 'story-intelligence' || agent.data?.type === 'story-intelligence';

  const handleOpenKnowledgeGraph = () => {
    router.push('/story-graph');
  };

  const handleCopy = async (text, type) => {
    await navigator.clipboard.writeText(text);
    if (type === 'input') {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const getStatusInfo = () => {
    switch (agent.data.status) {
      case 'running':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-amber-500" />,
          text: 'Running',
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-500/10'
        };
      case 'success':
      case 'complete':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
          text: 'Complete',
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-500/10'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: 'Error',
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-500/10'
        };
      default:
        return {
          icon: <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />,
          text: 'Idle',
          color: 'text-muted-foreground',
          bg: 'bg-muted'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const inputText = agent.data.input 
    ? (typeof agent.data.input === 'object' ? JSON.stringify(agent.data.input, null, 2) : String(agent.data.input))
    : 'No input available yet';
  
  const outputText = agent.data.output || agent.data.result
    ? (typeof (agent.data.output || agent.data.result) === 'object' 
        ? JSON.stringify(agent.data.output || agent.data.result, null, 2) 
        : String(agent.data.output || agent.data.result))
    : 'No output generated yet';

  const promptText = agent.data.prompt || agent.data.promptContext || 'Prompt will be generated during execution';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card/95 backdrop-blur-xl border border-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-xl shrink-0 border border-border"
                style={{ 
                  backgroundColor: `${agent.data.color}15`,
                }}
              >
                <AgentIcon name={agent.data.icon} className="w-7 h-7" color={agent.data.color} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                  {agent.data.label}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mb-3">
                  {agent.data.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
                    <span className="flex items-center gap-1.5">
                      {statusInfo.icon}
                      {statusInfo.text}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-muted text-emerald-600 dark:text-emerald-400 border-border">
                    ID: {agent.id}
                  </Badge>
                </div>
              </div>
            </div>
            
            {agent.data.status !== 'running' && (
              <div className="flex flex-col gap-2">
                {isKnowledgeGraphAgent && (
                  <Button
                    onClick={handleOpenKnowledgeGraph}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Network className="w-4 h-4 mr-2" />
                    Open 3D Graph
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
                <Button
                  onClick={() => onRunAgent?.(agent)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Agent
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prompt">Input Prompt</TabsTrigger>
            <TabsTrigger value="input">Input Data</TabsTrigger>
            <TabsTrigger value="output">Output Result</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Input Prompt
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(promptText, 'input')}
                  className="text-xs"
                >
                  {copiedInput ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-muted/50 p-4">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                  {promptText}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="input" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Input Context & Data
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(inputText, 'input')}
                  className="text-xs"
                >
                  {copiedInput ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-muted/50 p-4">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                  {inputText}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="output" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Generated Output
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(outputText, 'output')}
                  className="text-xs"
                >
                  {copiedOutput ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-muted/50 p-4">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                  {outputText}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {agent.data.error && (
          <>
            <Separator className="my-4" />
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Error Details</h4>
              </div>
              <p className="text-xs text-red-600 dark:text-red-300 font-mono">
                {agent.data.error}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
