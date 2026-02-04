'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, CheckCircle, XCircle, Loader2, Play, Network, ExternalLink, Edit2, Save, Code, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import AgentIcon from './AgentIcon';

export default function AgentDetailModal({ agent, isOpen, onClose, onRunAgent }) {
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [viewMode, setViewMode] = useState('markdown'); // 'markdown' or 'json'
  const router = useRouter();

  // Initialize edited prompt when agent changes
  useEffect(() => {
    if (agent?.data) {
      setEditedPrompt(agent.data.customPrompt || agent.data.prompt || agent.data.promptContext || '');
      setIsEditingPrompt(false);
    }
  }, [agent]);

  if (!agent) return null;

  const isKnowledgeGraphAgent = agent.data?.agentType === 'knowledge-graph' || agent.data?.type === 'knowledge-graph';
  const isStoryIntelligenceAgent = agent.data?.agentType === 'story-intelligence' || agent.data?.type === 'story-intelligence';

  const handleOpenKnowledgeGraph = () => {
    const url = agent.data?.workflowId 
      ? `/story-graph?workflowId=${agent.data.workflowId}`
      : '/story-graph';
    router.push(url);
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
  
  // Debug log
  console.log('AgentDetailModal agent data:', {
    status: agent.data.status,
    hasResult: !!agent.data.result,
    hasOutput: !!agent.data.output,
    result: agent.data.result,
    output: agent.data.output
  });
  
  // Get JSON output
  const getJsonOutput = () => {
    const result = agent.data.result;
    if (!result) return 'No output generated yet';
    return JSON.stringify(result, null, 2);
  };

  // Format output as Markdown for better readability
  const getMarkdownOutput = () => {
    const result = agent.data.result;
    const output = agent.data.output;
    
    if (!result && !output) return 'No output generated yet';
    
    // Always prefer formatting the full result object if available
    if (result && typeof result === 'object') {
      return formatResultAsMarkdown(result);
    }
    
    // If there's a string output, use it
    if (typeof output === 'string') {
      return output;
    }
    
    return String(output || result);
  };

  // Convert JSON result to readable Markdown
  const formatResultAsMarkdown = (result) => {
    let markdown = '';
    
    // Handle if result is an array (e.g., intelligent-recall returns array of Q&A)
    if (Array.isArray(result)) {
      markdown += '## 📋 Results\n\n';
      result.forEach((item, i) => {
        if (item.query && item.answer) {
          // Intelligent Recall Q&A format
          markdown += `### ❓ ${item.query}\n\n`;
          markdown += `${item.answer}\n\n`;
          if (item.confidence !== undefined) {
            markdown += `*Confidence: ${Math.round(item.confidence * 100)}%*\n\n`;
          }
          markdown += '---\n\n';
        } else if (typeof item === 'string') {
          markdown += `- ${item}\n`;
        } else {
          markdown += `### Item ${i + 1}\n`;
          markdown += `${JSON.stringify(item, null, 2)}\n\n`;
        }
      });
      return markdown;
    }
    
    // Handle scene suggestions
    if (result.sceneSuggestions?.length) {
      markdown += '## 🎬 Scene Suggestions\n\n';
      result.sceneSuggestions.forEach((scene, i) => {
        if (typeof scene === 'string') {
          markdown += `${scene}\n\n---\n\n`;
        } else {
          markdown += `### ${i + 1}. ${scene.title || scene.name || 'Scene'}\n`;
          markdown += `${scene.description || scene.content || ''}\n\n`;
          if (scene.placement) markdown += `**Placement:** ${scene.placement}\n\n`;
          if (scene.characters?.length) markdown += `**Characters:** ${scene.characters.join(', ')}\n\n`;
          if (scene.purpose) markdown += `**Purpose:** ${scene.purpose}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle plot developments
    if (result.plotDevelopments?.length) {
      markdown += '## 📖 Plot Developments\n\n';
      result.plotDevelopments.forEach((plot, i) => {
        if (typeof plot === 'string') {
          markdown += `${plot}\n\n---\n\n`;
        } else {
          markdown += `### ${i + 1}. ${plot.title || plot.type || plot.name || 'Development'}\n`;
          markdown += `${plot.description || plot.content || ''}\n\n`;
          if (plot.impact) markdown += `**Impact:** ${plot.impact}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle dialogue improvements
    if (result.dialogueImprovements?.length) {
      markdown += '## 💬 Dialogue Improvements\n\n';
      result.dialogueImprovements.forEach((dialogue, i) => {
        if (typeof dialogue === 'string') {
          markdown += `${dialogue}\n\n---\n\n`;
        } else {
          markdown += `### ${i + 1}. ${dialogue.character || dialogue.title || 'Dialogue'}\n`;
          if (dialogue.original) markdown += `**Original:** "${dialogue.original}"\n\n`;
          if (dialogue.improved) markdown += `**Improved:** "${dialogue.improved}"\n\n`;
          if (dialogue.reason) markdown += `**Reason:** ${dialogue.reason}\n\n`;
          if (dialogue.description) markdown += `${dialogue.description}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle character arc guidance
    if (result.characterArcGuidance?.length) {
      markdown += '## 👤 Character Arc Guidance\n\n';
      result.characterArcGuidance.forEach((arc, i) => {
        if (typeof arc === 'string') {
          markdown += `${arc}\n\n---\n\n`;
        } else {
          markdown += `### ${i + 1}. ${arc.character || arc.name || arc.title || 'Character'}\n`;
          markdown += `${arc.guidance || arc.description || arc.content || ''}\n\n`;
          if (arc.currentState) markdown += `**Current State:** ${arc.currentState}\n\n`;
          if (arc.suggestedArc) markdown += `**Suggested Arc:** ${arc.suggestedArc}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle theme reinforcement (both singular and plural keys)
    const themeData = result.themeReinforcements || result.themeReinforcement;
    if (themeData?.length) {
      markdown += '## 🎭 Theme Reinforcement\n\n';
      themeData.forEach((theme, i) => {
        if (typeof theme === 'string') {
          markdown += `${theme}\n\n---\n\n`;
        } else {
          markdown += `### ${i + 1}. ${theme.theme || theme.title || theme.name || 'Theme'}\n`;
          markdown += `${theme.suggestion || theme.description || theme.content || ''}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle alternative scenarios
    if (result.alternativeScenarios?.length) {
      markdown += '## 🔀 Alternative Scenarios\n\n';
      result.alternativeScenarios.forEach((scenario, i) => {
        if (typeof scenario === 'string') {
          markdown += `${scenario}\n\n---\n\n`;
        } else {
          markdown += `### ${i + 1}. ${scenario.title || scenario.name || 'Scenario'}\n`;
          markdown += `${scenario.description || scenario.content || ''}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle story intelligence results
    if (result.genre || result.narrativeStructure || result.writingStyle) {
      markdown += `## 📚 Story Analysis\n\n`;
      if (result.genre) markdown += `**Genre:** ${result.genre}\n\n`;
      if (result.themes?.length) markdown += `**Themes:** ${result.themes.join(', ')}\n\n`;
      if (result.setting) markdown += `**Setting:** ${result.setting}\n\n`;
      if (result.timePeriod) markdown += `**Time Period:** ${result.timePeriod}\n\n`;
      if (result.mainConflict) markdown += `**Main Conflict:** ${result.mainConflict}\n\n`;
      
      if (result.tone) {
        markdown += `### 🎵 Tone\n`;
        if (typeof result.tone === 'object') {
          if (result.tone.formality) markdown += `- **Formality:** ${result.tone.formality}\n`;
          if (result.tone.sentiment) markdown += `- **Sentiment:** ${result.tone.sentiment}\n`;
          if (result.tone.pacing) markdown += `- **Pacing:** ${result.tone.pacing}\n`;
        } else {
          markdown += `${result.tone}\n`;
        }
        markdown += '\n';
      }
      
      if (result.narrativeStructure) {
        markdown += `### 📐 Narrative Structure\n`;
        if (typeof result.narrativeStructure === 'object') {
          if (result.narrativeStructure.type) markdown += `- **Type:** ${result.narrativeStructure.type}\n`;
          if (result.narrativeStructure.currentAct) markdown += `- **Current Act:** ${result.narrativeStructure.currentAct}\n`;
          if (result.narrativeStructure.totalActs) markdown += `- **Total Acts:** ${result.narrativeStructure.totalActs}\n`;
        } else {
          markdown += `${result.narrativeStructure}\n`;
        }
        markdown += '\n';
      }
      
      if (result.writingStyle) {
        markdown += `### ✍️ Writing Style\n`;
        if (typeof result.writingStyle === 'object') {
          if (result.writingStyle.perspective) markdown += `- **Perspective:** ${result.writingStyle.perspective}\n`;
          if (result.writingStyle.tense) markdown += `- **Tense:** ${result.writingStyle.tense}\n`;
          if (result.writingStyle.voice) markdown += `- **Voice:** ${result.writingStyle.voice}\n`;
        } else {
          markdown += `${result.writingStyle}\n`;
        }
        markdown += '\n';
      }
    }
    
    // Handle knowledge graph results
    if (result.characters?.length) {
      markdown += `## 👥 Characters (${result.characters.length})\n\n`;
      result.characters.forEach((char, i) => {
        if (typeof char === 'string') {
          markdown += `- ${char}\n`;
        } else {
          markdown += `- **${char.name || `Character ${i+1}`}** - ${char.role || char.description || 'Unknown role'}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.locations?.length) {
      markdown += `## 📍 Locations (${result.locations.length})\n\n`;
      result.locations.forEach((loc, i) => {
        if (typeof loc === 'string') {
          markdown += `- ${loc}\n`;
        } else {
          markdown += `- **${loc.name || `Location ${i+1}`}** - ${loc.type || loc.description || 'Location'}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.objects?.length) {
      markdown += `## 🎁 Objects & Props (${result.objects.length})\n\n`;
      result.objects.forEach((obj, i) => {
        if (typeof obj === 'string') {
          markdown += `- ${obj}\n`;
        } else {
          markdown += `- **${obj.name || `Object ${i+1}`}** - ${obj.significance || obj.description || ''}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.events?.length) {
      markdown += `## 📅 Events (${result.events.length})\n\n`;
      result.events.forEach((event, i) => {
        if (typeof event === 'string') {
          markdown += `${i + 1}. ${event}\n`;
        } else {
          markdown += `${i + 1}. **${event.name || event.title || `Event ${i+1}`}** - ${event.description || ''}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.relationships?.length) {
      markdown += `## 🔗 Relationships (${result.relationships.length})\n\n`;
      result.relationships.forEach((rel, i) => {
        if (typeof rel === 'string') {
          markdown += `- ${rel}\n`;
        } else {
          markdown += `- ${rel.from || rel.source} ↔ ${rel.to || rel.target}: ${rel.type || rel.relationship || ''}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.plotThreads?.length) {
      markdown += `## 🧵 Plot Threads (${result.plotThreads.length})\n\n`;
      result.plotThreads.forEach((thread, i) => {
        if (typeof thread === 'string') {
          markdown += `- ${thread}\n`;
        } else {
          markdown += `- **${thread.name || thread.title || `Thread ${i+1}`}**: ${thread.description || thread.status || ''}\n`;
        }
      });
      markdown += '\n';
    }
    
    // Handle continuity/validator results
    if (result.continuityScore !== undefined) {
      markdown += `## ✅ Continuity Report\n\n`;
      markdown += `**Score:** ${result.continuityScore}/100\n\n`;
    }
    
    if (result.contradictions?.length) {
      markdown += `### ⚠️ Contradictions (${result.contradictions.length})\n\n`;
      result.contradictions.forEach((c, i) => {
        if (typeof c === 'string') {
          markdown += `${i + 1}. ${c}\n`;
        } else {
          markdown += `${i + 1}. ${c.description || c.issue || JSON.stringify(c)}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.errors?.length) {
      markdown += `### ❌ Errors (${result.errors.length})\n\n`;
      result.errors.forEach((e, i) => {
        if (typeof e === 'string') {
          markdown += `${i + 1}. ${e}\n`;
        } else {
          markdown += `${i + 1}. **${e.type || 'Error'}**: ${e.message || e.description || JSON.stringify(e)}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.warnings?.length) {
      markdown += `### ⚠️ Warnings (${result.warnings.length})\n\n`;
      result.warnings.forEach((w, i) => {
        if (typeof w === 'string') {
          markdown += `${i + 1}. ${w}\n`;
        } else {
          markdown += `${i + 1}. ${w.message || w.description || JSON.stringify(w)}\n`;
        }
      });
      markdown += '\n';
    }
    
    if (result.recommendations?.length) {
      markdown += `### 💡 Recommendations\n\n`;
      result.recommendations.forEach((rec, i) => {
        if (typeof rec === 'string') {
          markdown += `${i + 1}. ${rec}\n`;
        } else {
          markdown += `${i + 1}. ${rec.suggestion || rec.description || JSON.stringify(rec)}\n`;
        }
      });
      markdown += '\n';
    }
    
    // Handle parse error fallback
    if (result._parseError) {
      markdown += `## ⚠️ Parse Error\n\n`;
      markdown += `The AI response could not be fully parsed. Here's what we recovered:\n\n`;
      if (result._rawResponse) {
        markdown += `\`\`\`\n${result._rawResponse.substring(0, 500)}${result._rawResponse.length > 500 ? '...' : ''}\n\`\`\`\n\n`;
      }
      markdown += `**Tip:** Try running the agent again for better results.\n\n`;
    }
    
    // Handle temporal/timeline results
    if (result.chronologicalEvents?.length) {
      markdown += `## ⏰ Timeline (${result.chronologicalEvents.length} events)\n\n`;
      result.chronologicalEvents.forEach((event, i) => {
        if (typeof event === 'string') {
          markdown += `${i + 1}. ${event}\n`;
        } else {
          markdown += `### ${event.timestamp || event.time || `Event ${i+1}`}\n`;
          markdown += `**${event.name || event.title || 'Event'}**\n\n`;
          if (event.description) markdown += `${event.description}\n\n`;
          if (event.participants?.length) markdown += `**Participants:** ${event.participants.join(', ')}\n\n`;
          if (event.location) markdown += `**Location:** ${event.location}\n\n`;
          if (event.chapter) markdown += `**Chapter:** ${event.chapter}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle flashbacks
    if (result.flashbacks?.length) {
      markdown += `## ⏪ Flashbacks (${result.flashbacks.length})\n\n`;
      result.flashbacks.forEach((fb, i) => {
        if (typeof fb === 'string') {
          markdown += `${i + 1}. ${fb}\n`;
        } else if (fb.event) {
          markdown += `### Flashback ${i + 1}\n`;
          markdown += `**Event:** ${fb.event.name || fb.event.title || 'Unknown'}\n\n`;
          if (fb.event.description) markdown += `${fb.event.description}\n\n`;
          if (fb.narrativePosition) markdown += `**Appears in Chapter:** ${fb.narrativePosition}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle flash-forwards
    if (result.flashForwards?.length) {
      markdown += `## ⏩ Flash-Forwards (${result.flashForwards.length})\n\n`;
      result.flashForwards.forEach((ff, i) => {
        if (typeof ff === 'string') {
          markdown += `${i + 1}. ${ff}\n`;
        } else if (ff.event) {
          markdown += `### Flash-Forward ${i + 1}\n`;
          markdown += `**Event:** ${ff.event.name || ff.event.title || 'Unknown'}\n\n`;
          if (ff.event.description) markdown += `${ff.event.description}\n\n`;
          if (ff.narrativePosition) markdown += `**Appears in Chapter:** ${ff.narrativePosition}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle causal chains
    if (result.causalChains?.length) {
      markdown += `## 🔗 Cause & Effect Chains (${result.causalChains.length})\n\n`;
      result.causalChains.forEach((chain, i) => {
        if (typeof chain === 'string') {
          markdown += `${i + 1}. ${chain}\n`;
        } else {
          markdown += `### Chain ${i + 1}\n`;
          markdown += `**Cause:** ${chain.cause}\n\n`;
          if (chain.effects?.length) markdown += `**Effects:** ${chain.effects.join(', ')}\n\n`;
          if (chain.validated !== undefined) markdown += `**Validated:** ${chain.validated ? '✅ Yes' : '❌ No'}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle temporal issues
    if (result.temporalIssues?.length) {
      markdown += `## ⚠️ Temporal Issues (${result.temporalIssues.length})\n\n`;
      result.temporalIssues.forEach((issue, i) => {
        if (typeof issue === 'string') {
          markdown += `${i + 1}. ${issue}\n`;
        } else {
          markdown += `### Issue ${i + 1}: ${issue.type || 'Unknown'}\n`;
          markdown += `${issue.description || ''}\n\n`;
          if (issue.severity) markdown += `**Severity:** ${issue.severity}\n\n`;
          if (issue.affectedEvents?.length) markdown += `**Affected Events:** ${issue.affectedEvents.join(', ')}\n\n`;
          if (issue.suggestion) markdown += `**Suggestion:** ${issue.suggestion}\n\n`;
          markdown += '---\n\n';
        }
      });
    }
    
    // Handle story duration and narrative pace
    if (result.storyDuration) {
      markdown += `**📅 Story Duration:** ${result.storyDuration}\n\n`;
    }
    if (result.narrativePace) {
      markdown += `**🏃 Narrative Pace:** ${result.narrativePace}\n\n`;
    }
    
    // Handle cinematic teaser results
    if (result.trailerScript || result.visualPrompts || result.teaserText) {
      markdown += `## 🎬 Cinematic Teaser\n\n`;
      if (result.teaserText) markdown += `${result.teaserText}\n\n`;
      if (result.trailerScript) {
        markdown += `### 🎥 Trailer Script\n\n`;
        markdown += `${result.trailerScript}\n\n`;
      }
      if (result.visualPrompts?.length) {
        markdown += `### 🖼️ Visual Prompts\n\n`;
        result.visualPrompts.forEach((prompt, i) => {
          if (typeof prompt === 'string') {
            markdown += `${i + 1}. ${prompt}\n`;
          } else {
            markdown += `${i + 1}. **${prompt.scene || `Scene ${i+1}`}**: ${prompt.description || ''}\n`;
          }
        });
        markdown += '\n';
      }
      if (result.hookLine) markdown += `**Hook:** *"${result.hookLine}"*\n\n`;
      if (result.mood) markdown += `**Mood:** ${result.mood}\n\n`;
    }
    
    // If nothing specific matched, show a generic but nice summary
    if (!markdown) {
      const keys = Object.keys(result);
      markdown = '## 📊 Result Summary\n\n';
      keys.forEach(key => {
        const value = result[key];
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        if (Array.isArray(value)) {
          if (value.length === 0) {
            markdown += `**${formattedKey}:** None\n\n`;
          } else if (typeof value[0] === 'string') {
            markdown += `**${formattedKey}:**\n`;
            value.forEach((item, i) => {
              markdown += `${i + 1}. ${item}\n`;
            });
            markdown += '\n';
          } else {
            markdown += `**${formattedKey}:** ${value.length} items\n\n`;
          }
        } else if (typeof value === 'object' && value !== null) {
          markdown += `**${formattedKey}:**\n`;
          Object.entries(value).forEach(([k, v]) => {
            markdown += `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}\n`;
          });
          markdown += '\n';
        } else if (value !== undefined && value !== null) {
          markdown += `**${formattedKey}:** ${value}\n\n`;
        }
      });
    }
    
    return markdown;
  };

  const promptText = agent.data.customPrompt || agent.data.prompt || agent.data.promptContext || 'Prompt will be generated during execution';

  const handleSavePrompt = () => {
    setIsEditingPrompt(false);
    // The edited prompt will be passed to onRunAgent
  };

  const handleRunWithPrompt = () => {
    onRunAgent?.(agent, editedPrompt);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card/95 backdrop-blur-xl border border-border flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
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
            
            {(agent.data.status !== 'running') ? (
              <div className="flex flex-col gap-2">
                {isKnowledgeGraphAgent && (
                  <Button
                    onClick={handleOpenKnowledgeGraph}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                  >
                    <Network className="w-4 h-4 mr-2" />
                    Open 3D Graph
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
                <Button
                  onClick={handleRunWithPrompt}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Agent
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  disabled
                  className="bg-amber-500/80 text-white shadow-lg cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="output" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="result">Full Result</TabsTrigger>
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
            </TabsList>

            <TabsContent value="output" className="mt-4 flex-1 min-h-0">
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Agent Output Summary
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(getMarkdownOutput(), 'output')}
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
                <div className="flex-1 min-h-0 rounded-lg border border-border bg-muted/50 overflow-auto">
                  <div className="h-full max-h-[calc(90vh-320px)] overflow-y-auto agent-modal-scroll">
                    <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-hr:border-border prose-pre:bg-background/50 prose-pre:text-xs prose-code:text-xs">
                      {getMarkdownOutput() === 'No output generated yet' ? (
                        <p className="text-muted-foreground italic">No output generated yet</p>
                      ) : (
                        <ReactMarkdown>{getMarkdownOutput()}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="result" className="mt-4 flex-1 min-h-0">
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Full Structured Result
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                      <Button
                        variant={viewMode === 'markdown' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('markdown')}
                        className={`text-xs h-7 px-2 ${viewMode === 'markdown' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}`}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Formatted
                      </Button>
                      <Button
                        variant={viewMode === 'json' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('json')}
                        className={`text-xs h-7 px-2 ${viewMode === 'json' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}`}
                      >
                        <Code className="w-3 h-3 mr-1" />
                        JSON
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(
                        agent.data.result ? JSON.stringify(agent.data.result, null, 2) : 'No result', 
                        'output'
                      )}
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
                </div>
                <div className="flex-1 min-h-0 rounded-lg border border-border bg-muted/50 overflow-auto">
                  <div className="h-full max-h-[calc(90vh-320px)] overflow-y-auto agent-modal-scroll">
                    {viewMode === 'markdown' ? (
                      <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-hr:border-border prose-pre:bg-background/50 prose-pre:text-xs prose-code:text-xs">
                        {getMarkdownOutput() === 'No output generated yet' ? (
                          <p className="text-muted-foreground italic">No output generated yet</p>
                        ) : (
                          <ReactMarkdown>{getMarkdownOutput()}</ReactMarkdown>
                        )}
                      </div>
                    ) : (
                      <pre className="p-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                        {agent.data.result 
                          ? JSON.stringify(agent.data.result, null, 2)
                          : 'No structured result available yet. Run the agent to generate output.'}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="input" className="mt-4 flex-1 min-h-0">
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
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
                <div className="flex-1 min-h-0 rounded-lg border border-border bg-muted/50 overflow-auto">
                  <div className="h-full max-h-[calc(90vh-320px)] overflow-y-auto agent-modal-scroll">
                    <pre className="p-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                      {inputText}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="mt-4 flex-1 min-h-0">
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Input Prompt {isEditingPrompt && <span className="text-amber-500">(Editing)</span>}
                  </h3>
                  <div className="flex gap-2">
                    {isEditingPrompt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSavePrompt}
                        className="text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPrompt(true)}
                        className="text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(editedPrompt || promptText, 'input')}
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
                </div>
                {isEditingPrompt ? (
                  <div className="space-y-2 flex-1 min-h-0">
                    <Textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      placeholder="Enter your custom prompt for this agent..."
                      className="h-[320px] w-full rounded-lg border border-border bg-background text-sm font-mono resize-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: You can customize the prompt to modify how the agent processes your content. Click "Done" when finished, then "Run Agent" to execute.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 rounded-lg border border-border bg-muted/50 overflow-auto">
                    <div className="h-full max-h-[calc(90vh-320px)] overflow-y-auto agent-modal-scroll">
                      <pre className="p-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                        {editedPrompt || promptText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {agent.data.error && (
          <>
            <Separator className="my-4" />
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Error Details</h4>
              </div>
              <p className="text-xs text-red-600 dark:text-red-300 font-mono break-all">
                {agent.data.error}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
