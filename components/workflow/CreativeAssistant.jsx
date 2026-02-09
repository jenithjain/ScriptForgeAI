'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Palette,
  Loader2,
  Video,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Film
} from 'lucide-react';

/**
 * Creative Assistant Component
 * 
 * Provides AI-powered creative suggestions for:
 * - Scene development
 * - Dialogue enhancement  
 * - Character arc progression
 * - Plot development
 * - Theme exploration
 * 
 * VIDEO GENERATION = VISUAL IDEATION TOOL FOR WRITERS
 * Helps writers quickly:
 * - Preview scene atmosphere and mood
 * - Visualize emotional beats
 * - See relationship dynamics and tone
 * NOT for production - just quick visual references for creative inspiration
 */
export default function CreativeAssistant({ 
  sceneText = '', 
  documentId = null,
  sceneId = null,
  onSuggestionSelect = () => {},
  className = ''
}) {
  const [activeIntent, setActiveIntent] = useState('scene');
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [videoGenerating, setVideoGenerating] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});
  
  // Track active polling operations for cleanup
  const pollingAbortRef = useRef(new Map());
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      // Cancel all active polling operations
      pollingAbortRef.current.forEach((controller, key) => {
        controller.abort();
      });
      pollingAbortRef.current.clear();
    };
  }, []);

  const intents = [
    { id: 'scene', label: 'Scenes', icon: Film, description: 'Scene suggestions' },
    { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, description: 'Dialogue improvements' },
    { id: 'character', label: 'Characters', icon: Users, description: 'Character development' },
    { id: 'plot', label: 'Plot', icon: TrendingUp, description: 'Plot directions' },
    { id: 'theme', label: 'Themes', icon: Palette, description: 'Theme exploration' },
  ];

  const fetchSuggestions = async () => {
    if (!sceneText.trim()) {
      setError('Please enter some scene text to get suggestions');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const response = await fetch('/api/scriptforge/creative-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSceneText: sceneText,
          intent: activeIntent,
          documentId,
          sceneId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateVideo = async (suggestionIndex, videoPrompt) => {
    const key = `${activeIntent}_${suggestionIndex}`;
    setVideoGenerating(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/scriptforge/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: '16:9',
          duration: 5
        })
      });

      const data = await response.json();

      // Check if this is concept-only mode or API error (no polling needed)
      if (data.mode === 'concept-only' || data.status === 'concept_only' || data.shouldPoll === false || !data.operationId) {
        // API unavailable - just show concept
        setVideoGenerating(prev => ({ ...prev, [key]: false }));
        return;
      }

      // Start polling for video completion only with valid operationId
      const operationId = data.operationId;
      pollVideoStatus(key, operationId);
    } catch (err) {
      console.error('Video generation error:', err);
      setVideoGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  const pollVideoStatus = async (key, operationId) => {
    // Create AbortController for this polling operation
    const abortController = new AbortController();
    pollingAbortRef.current.set(key, abortController);
    
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      // Check if aborted
      if (abortController.signal.aborted) {
        pollingAbortRef.current.delete(key);
        return;
      }
      
      if (attempts >= maxAttempts) {
        setVideoGenerating(prev => ({ ...prev, [key]: false }));
        pollingAbortRef.current.delete(key);
        return;
      }

      try {
        const response = await fetch(
          `/api/scriptforge/generate-video?operationId=${encodeURIComponent(operationId)}`,
          { signal: abortController.signal }
        );
        const data = await response.json();

        if (data.status === 'completed' && data.videoUrl) {
          setGeneratedVideos(prev => ({ ...prev, [key]: data.videoUrl }));
          setVideoGenerating(prev => ({ ...prev, [key]: false }));
          pollingAbortRef.current.delete(key);
          return;
        }

        if (data.status === 'failed') {
          setVideoGenerating(prev => ({ ...prev, [key]: false }));
          pollingAbortRef.current.delete(key);
          return;
        }

        attempts++;
        if (!abortController.signal.aborted) {
          setTimeout(poll, 5000);
        }
      } catch (err) {
        // Don't retry if aborted
        if (err.name === 'AbortError') {
          pollingAbortRef.current.delete(key);
          return;
        }
        attempts++;
        if (!abortController.signal.aborted) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const renderSuggestion = (suggestion, index) => {
    const isExpanded = expandedSuggestion === index;
    const key = `${activeIntent}_${index}`;
    const videoUrl = generatedVideos[key];
    const isVideoLoading = videoGenerating[key];

    // Get the video prompt from visualConcept
    const videoPrompt = suggestion.visualConcept?.videoPrompt || '';

    return (
      <Card 
        key={index} 
        className={`p-4 cursor-pointer transition-all border-border hover:border-purple-500/50 ${
          isExpanded ? 'ring-2 ring-purple-500/30' : ''
        }`}
        onClick={() => setExpandedSuggestion(isExpanded ? null : index)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Type Badge */}
            <Badge variant="outline" className="mb-2 text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
              {suggestion.type?.replace('Suggestion', '') || activeIntent}
            </Badge>

            {/* Main Content based on type */}
            {suggestion.type === 'sceneSuggestion' && (
              <>
                <h4 className="font-medium text-foreground mb-1">{suggestion.summary}</h4>
                <p className="text-sm text-muted-foreground">{suggestion.setting}</p>
                {suggestion.characters?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.characters.map((char, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}

            {suggestion.type === 'dialogueSuggestion' && (
              <>
                <h4 className="font-medium text-foreground mb-1">{suggestion.character}</h4>
                <div className="text-sm space-y-1">
                  <p className="text-red-400/80 line-through">"{suggestion.originalLine}"</p>
                  <p className="text-emerald-400">"{suggestion.suggestedLine}"</p>
                </div>
              </>
            )}

            {suggestion.type === 'characterSuggestion' && (
              <>
                <h4 className="font-medium text-foreground mb-1">{suggestion.character}</h4>
                <Badge variant="outline" className="text-xs mb-2">
                  {suggestion.suggestionType}
                </Badge>
                <p className="text-sm text-muted-foreground">{suggestion.description}</p>
              </>
            )}

            {suggestion.type === 'plotSuggestion' && (
              <>
                <h4 className="font-medium text-foreground mb-1">{suggestion.direction}</h4>
                {suggestion.twist && (
                  <p className="text-sm text-amber-400 italic">Twist: {suggestion.twist}</p>
                )}
                <p className="text-sm text-muted-foreground">{suggestion.stakesImpact}</p>
              </>
            )}

            {suggestion.type === 'themeSuggestion' && (
              <>
                <h4 className="font-medium text-foreground mb-1">{suggestion.theme}</h4>
                <p className="text-sm text-muted-foreground">{suggestion.currentPresence}</p>
              </>
            )}
          </div>

          <div className="shrink-0 ml-2">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-3" onClick={e => e.stopPropagation()}>
            {/* Additional Details */}
            {suggestion.purpose && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Purpose:</span>
                <p className="text-sm text-foreground">{suggestion.purpose}</p>
              </div>
            )}
            {suggestion.reason && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Reason:</span>
                <p className="text-sm text-foreground">{suggestion.reason}</p>
              </div>
            )}
            {suggestion.arcProgress && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Arc Progress:</span>
                <p className="text-sm text-foreground">{suggestion.arcProgress}</p>
              </div>
            )}
            {suggestion.enhancement && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Enhancement:</span>
                <p className="text-sm text-foreground">{suggestion.enhancement}</p>
              </div>
            )}
            {suggestion.symbolism && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Symbolism:</span>
                <p className="text-sm text-foreground">{suggestion.symbolism}</p>
              </div>
            )}

            {/* Visual Concept - Ideation Tool */}
            {videoPrompt && (
              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Visual Ideation Preview</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 italic">
                  Generate a quick visual to help you FEEL this scene's atmosphere and emotion
                </p>
                <p className="text-sm text-muted-foreground mb-3">{videoPrompt}</p>

                {/* Video Player */}
                {videoUrl && (
                  <video 
                    controls 
                    className="w-full rounded-lg max-h-48 bg-black mb-3"
                    src={videoUrl}
                  />
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => generateVideo(index, videoPrompt)}
                    disabled={isVideoLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isVideoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : videoUrl ? (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(videoPrompt, `video_${index}`)}
                  >
                    {copiedIndex === `video_${index}` ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Use Suggestion Button */}
            <Button 
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Use This Suggestion
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-foreground">Creative Assistant</h2>
      </div>

      {/* Intent Selector */}
      <Tabs value={activeIntent} onValueChange={setActiveIntent} className="mb-4">
        <TabsList className="grid grid-cols-5 h-auto">
          {intents.map(intent => {
            const Icon = intent.icon;
            return (
              <TabsTrigger 
                key={intent.id} 
                value={intent.id}
                className="flex flex-col items-center py-2 px-1 data-[state=active]:bg-purple-500/20"
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs">{intent.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Generate Button */}
      <Button 
        onClick={fetchSuggestions}
        disabled={isLoading || !sceneText.trim()}
        className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Suggestions...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Get {intents.find(i => i.id === activeIntent)?.label} Suggestions
          </>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Suggestions List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {suggestions?.suggestions?.length > 0 ? (
            suggestions.suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))
          ) : suggestions && (
            <div className="text-center text-muted-foreground py-8">
              No suggestions generated. Try adjusting your scene text.
            </div>
          )}

          {!suggestions && !isLoading && !error && (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Enter scene text above and click "Get Suggestions"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
