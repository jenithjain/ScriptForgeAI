"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Upload, FileText, Image, Video, Music, X,
  Loader2, Clapperboard, CheckCircle2, AlertCircle, FileType, Eye, EyeOff
} from "lucide-react";
import toast from "react-hot-toast";

const EXAMPLE_WORKFLOWS = [
  {
    id: 'mystery-thriller',
    icon: <FileText className="w-5 h-5" />,
    title: 'Mystery Thriller Script',
    description: 'Create a comprehensive script for a mystery thriller with complex character arcs and plot twists. Ensure continuity across timelines and maintain suspense throughout.'
  },
  {
    id: 'character-development',
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Character Development Deep Dive',
    description: 'Analyze and develop rich character backgrounds, relationships, and arcs for a multi-season series. Track character evolution and ensure consistency.'
  },
  {
    id: 'cinematic-teaser',
    icon: <Clapperboard className="w-5 h-5" />,
    title: 'Cinematic Teaser Creation',
    description: 'Generate a compelling teaser trailer for your story with visual prompts and video generation. Extract story essence and create engaging hooks.'
  }
];

const DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.rtf', '.csv', '.json'];

export default function CreateWorkflowPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [brief, setBrief] = useState('');
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [extractingFiles, setExtractingFiles] = useState({});
  const [expandedPreviews, setExpandedPreviews] = useState({});

  const handleBriefChange = (e) => {
    const value = e.target.value;
    setBrief(value);
    setCharCount(value.length);
  };

  const isDocumentFile = (fileName) => {
    const lowerName = fileName.toLowerCase();
    return DOCUMENT_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  };

  const extractTextFromFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        return {
          text: data.text,
          wordCount: data.wordCount,
          charCount: data.charCount,
          fileType: data.fileType
        };
      } else {
        throw new Error(data.error || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      const fileId = Date.now() + Math.random();
      const fileName = file.name;
      const isDocument = isDocumentFile(fileName);

      // Determine file type
      let fileType = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      // For documents, extract text
      if (isDocument) {
        setExtractingFiles(prev => ({ ...prev, [fileId]: true }));

        // Add placeholder while extracting
        const placeholderInput = {
          id: fileId,
          type: fileType,
          fileName: file.name,
          mimeType: file.type,
          extracting: true,
          extractedText: null,
          wordCount: 0,
          charCount: 0
        };
        setInputs(prev => [...prev, placeholderInput]);

        try {
          const extracted = await extractTextFromFile(file);

          // Update with extracted text
          setInputs(prev => prev.map(input =>
            input.id === fileId
              ? {
                  ...input,
                  extracting: false,
                  extractedText: extracted.text,
                  wordCount: extracted.wordCount,
                  charCount: extracted.charCount,
                  extractedFileType: extracted.fileType
                }
              : input
          ));

          toast.success(`Extracted ${extracted.wordCount.toLocaleString()} words from ${file.name}`);
        } catch (error) {
          // Update with error state
          setInputs(prev => prev.map(input =>
            input.id === fileId
              ? {
                  ...input,
                  extracting: false,
                  error: error.message || 'Failed to extract text'
                }
              : input
          ));
          toast.error(`Failed to extract text from ${file.name}`);
        } finally {
          setExtractingFiles(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }
      } else {
        // For non-documents (images, videos, audio), just store as base64
        const reader = new FileReader();

        reader.onload = async (event) => {
          const base64Data = event.target.result.split(',')[1];

          const newInput = {
            id: fileId,
            type: fileType,
            fileName: file.name,
            mimeType: file.type,
            base64Data
          };

          setInputs(prev => [...prev, newInput]);
          toast.success(`${file.name} uploaded`);
        };

        reader.readAsDataURL(file);
      }
    }

    e.target.value = '';
  };

  const removeInput = (id) => {
    setInputs(prev => prev.filter(input => input.id !== id));
    setExpandedPreviews(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const togglePreview = (id) => {
    setExpandedPreviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const appendTextToBrief = (text) => {
    const newBrief = brief ? `${brief}\n\n---\n\n${text}` : text;
    setBrief(newBrief);
    setCharCount(newBrief.length);
    toast.success('Text appended to brief');
  };

  const handleExampleClick = (example) => {
    setBrief(example.description);
    setCharCount(example.description.length);
  };

  const handleGenerateWorkflow = async () => {
    if (!brief.trim()) {
      toast.error('Please describe your workflow');
      return;
    }

    // Check if any files are still extracting
    if (Object.keys(extractingFiles).length > 0) {
      toast.error('Please wait for file extraction to complete');
      return;
    }

    setLoading(true);
    try {
      // Prepare inputs with extracted text included
      const processedInputs = inputs.map(input => ({
        ...input,
        // Include extracted text in the input for the API
        content: input.extractedText || input.base64Data
      }));

      const response = await fetch('/api/scriptforge/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brief,
          inputs: processedInputs
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Workflow generated!');
        router.push(`/workflows/${data.workflow._id}`);
      } else {
        toast.error(data.error || 'Failed to generate workflow');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (input) => {
    if (input.extracting) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (input.error) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (input.extractedText) return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;

    switch (input.type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white">
              AI-Powered <span className="bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Script Workflow</span> Generator
            </h1>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-lg">
            Share your vision, watch AI build a complete scriptwriting workflow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left: Brief Input */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/60 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Describe Your Script Project</CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-300">
                  Share your scriptwriting vision, and watch AI autonomously create a comprehensive workflow with research, creative agents, and continuity validation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Brief Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Script Brief
                    </label>
                    <span className="text-xs text-slate-500 dark:text-gray-500">{charCount.toLocaleString()} characters</span>
                  </div>
                  <Textarea
                    value={brief}
                    onChange={handleBriefChange}
                    placeholder="Create a comprehensive script workflow for developing a sci-fi mystery series. I need help with character development, timeline management, continuity checking, and generating promotional content..."
                    className="min-h-[200px] max-h-[500px] resize-y bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">
                    Include: genre, characters, plot elements, goals, target audience, and any specific requirements
                  </p>
                </div>

                {/* File Uploads */}
                <div>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Upload Documents
                    </label>
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                      PDF, Word, Text, Markdown, RTF supported
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf,.csv,.json,image/*,video/*,audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Drag and Drop Zone */}
                  <div
                    className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer mb-4"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-500/5');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-500/5');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-500/5');
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const event = { target: { files, value: '' } };
                        handleFileUpload(event);
                      }
                    }}
                  >
                    <FileType className="w-8 h-8 mx-auto text-slate-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      Drag & drop files here or click to browse
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                      Text will be automatically extracted from documents
                    </p>
                  </div>

                  {/* Uploaded Files List */}
                  {inputs.length > 0 && (
                    <div className="space-y-2">
                      {inputs.map((input) => (
                        <div
                          key={input.id}
                          className="bg-slate-100/80 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          {/* File Header */}
                          <div className="flex items-center gap-3 p-3">
                            <div className={`p-2 rounded-lg ${
                              input.error
                                ? 'bg-red-500/10'
                                : input.extractedText
                                  ? 'bg-emerald-500/10'
                                  : 'bg-slate-200 dark:bg-gray-700'
                            }`}>
                              {getFileIcon(input)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate">
                                {input.fileName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  {getFileExtension(input.fileName)}
                                </Badge>
                                {input.extracting && (
                                  <span className="text-xs text-amber-500">Extracting text...</span>
                                )}
                                {input.extractedText && (
                                  <span className="text-xs text-emerald-500">
                                    {input.wordCount.toLocaleString()} words extracted
                                  </span>
                                )}
                                {input.error && (
                                  <span className="text-xs text-red-400">{input.error}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {input.extractedText && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePreview(input.id)}
                                    className="h-8 px-2 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    {expandedPreviews[input.id] ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => appendTextToBrief(input.extractedText)}
                                    className="h-8 px-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                  >
                                    <span className="text-xs">Add to Brief</span>
                                  </Button>
                                </>
                              )}
                              <button
                                onClick={() => removeInput(input.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Extracted Text Preview */}
                          {input.extractedText && expandedPreviews[input.id] && (
                            <div className="border-t border-slate-200 dark:border-gray-700">
                              <ScrollArea className="h-40">
                                <pre className="p-3 text-xs text-slate-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                                  {input.extractedText.slice(0, 2000)}
                                  {input.extractedText.length > 2000 && '...'}
                                </pre>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateWorkflow}
                  disabled={loading || !brief.trim() || Object.keys(extractingFiles).length > 0}
                  className="w-full h-14 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:bg-emerald-600 text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Workflow...
                    </>
                  ) : Object.keys(extractingFiles).length > 0 ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Extracting Text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Workflow
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Quick Examples */}
          <div>
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/60 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  <CardTitle className="text-slate-900 dark:text-white">Quick Examples</CardTitle>
                </div>
                <CardDescription className="text-slate-700 dark:text-slate-300">
                  Click to use these example workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {EXAMPLE_WORKFLOWS.map((example) => (
                  <Card
                    key={example.id}
                    className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group hover:shadow-lg"
                    onClick={() => handleExampleClick(example)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                          {example.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {example.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                            {example.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
