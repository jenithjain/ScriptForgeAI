'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Loader2, 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle,
  User,
  MapPin,
  Package,
  Zap,
  GitBranch,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManuscriptInputModal({ 
  isOpen, 
  onClose, 
  onAnalysisComplete 
}) {
  const [manuscriptText, setManuscriptText] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!manuscriptText.trim() || manuscriptText.length < 50) {
      toast.error('Please enter at least 50 characters of manuscript text');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/story-graph/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: manuscriptText,
          chapterNumber,
          storeInGraph: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast.success(`Analyzed chapter ${chapterNumber}! Found ${data.stats.charactersFound} characters.`);
        onAnalysisComplete?.(data);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze manuscript');
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      setManuscriptText(text);
      toast.success(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setManuscriptText('');
    setChapterNumber(1);
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card/95 backdrop-blur-xl border border-border overflow-hidden">
        <DialogHeader className="">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Brain className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Story Intelligence Core
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Analyze manuscript text to extract characters, locations, events, and relationships
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left: Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Manuscript Text</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Chapter:</Label>
                <Input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-center"
                />
              </div>
            </div>

            <Textarea
              value={manuscriptText}
              onChange={(e) => setManuscriptText(e.target.value)}
              placeholder="Paste your manuscript text here... (scene, chapter, or excerpt)"
              className="h-[300px] resize-none font-mono text-sm bg-muted/50"
            />

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="manuscript-upload"
              />
              <Button
                variant="outline"
                size="sm"
                className=""
                onClick={() => document.getElementById('manuscript-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant="outline"
                size="sm"
                className=""
                onClick={handleReset}
              >
                Clear
              </Button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {manuscriptText.length} characters
              </span>
            </div>

            <Button
              variant="default"
              size="default"
              onClick={handleAnalyze}
              disabled={isAnalyzing || manuscriptText.length < 50}
              className="w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Manuscript
                </>
              )}
            </Button>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Analysis Results</Label>

            {!result && !isAnalyzing && (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Analysis results will appear here</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-[300px] flex items-center justify-center border border-purple-500/30 rounded-lg bg-purple-500/5">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
                  <p className="text-sm text-purple-400 font-medium">Extracting story elements...</p>
                  <p className="text-xs text-muted-foreground mt-1">Using Gemini AI for deep analysis</p>
                </div>
              </div>
            )}

            {result && !isAnalyzing && (
              <ScrollArea className="h-[380px] border border-border rounded-lg bg-muted/20 p-4">
                {result.success ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-500">Analysis Complete</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.analysis?.summary}</p>
                    </div>

                    <Separator className="" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard icon={User} label="Characters" count={result.stats?.charactersFound || 0} color="#8B5CF6" />
                      <StatCard icon={MapPin} label="Locations" count={result.stats?.locationsFound || 0} color="#10B981" />
                      <StatCard icon={Package} label="Objects" count={result.stats?.objectsFound || 0} color="#F59E0B" />
                      <StatCard icon={Zap} label="Events" count={result.stats?.eventsFound || 0} color="#EF4444" />
                      <StatCard icon={GitBranch} label="Plots" count={result.stats?.plotThreadsFound || 0} color="#EC4899" />
                      <StatCard icon={Brain} label="Relations" count={result.stats?.relationshipsFound || 0} color="#3B82F6" />
                    </div>

                    <Separator className="" />

                    {/* Characters */}
                    {result.analysis?.characters && result.analysis.characters.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-purple-400 mb-2">CHARACTERS</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.analysis.characters.map((char, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                              {char.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locations */}
                    {result.analysis?.locations && result.analysis.locations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-400 mb-2">LOCATIONS</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.analysis.locations.map((loc, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30">
                              {loc.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {result.analysis?.events && result.analysis.events.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 mb-2">EVENTS</h4>
                        <div className="space-y-1">
                          {result.analysis.events.slice(0, 5).map((evt, i) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              • {evt.name}
                            </div>
                          ))}
                          {result.analysis.events.length > 5 && (
                            <div className="text-xs text-muted-foreground italic">
                              + {result.analysis.events.length - 5} more events
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                      <p className="text-sm text-red-400">Analysis failed</p>
                      <p className="text-xs text-muted-foreground mt-1">{result.error}</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            )}

            {result?.success && (
              <Button
                variant="outline"
                size="default"
                className="w-full border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                onClick={() => window.open('/story-graph', '_blank')}
              >
                View in Knowledge Graph →
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, count, color }) {
  return (
    <div className="p-2 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-lg font-bold" style={{ color }}>{count}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
