"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Upload, FileText, Image, Video, Music, X, 
  Loader2, Coffee, Clapperboard, Shirt, Lightbulb
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

export default function CreateWorkflowPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [brief, setBrief] = useState('');
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleBriefChange = (e) => {
    const value = e.target.value;
    setBrief(value);
    setCharCount(value.length);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        
        let fileType = 'document';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';

        const newInput = {
          id: Date.now() + Math.random(),
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

    e.target.value = '';
  };

  const removeInput = (id) => {
    setInputs(prev => prev.filter(input => input.id !== id));
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

    setLoading(true);
    try {
      const response = await fetch('/api/scriptforge/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brief,
          inputs
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

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
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
                    <label className="text-sm font-medium text-gray-300">
                      Script Brief
                    </label>
                    <span className="text-xs text-gray-500">{charCount} characters</span>
                  </div>
                  <Textarea
                    value={brief}
                    onChange={handleBriefChange}
                    placeholder="Create a comprehensive script workflow for developing a sci-fi mystery series. I need help with character development, timeline management, continuity checking, and generating promotional content..."
                    className="min-h-[200px] max-h-[500px] resize-y bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Include: genre, characters, plot elements, goals, target audience, and any specific requirements
                  </p>
                </div>

                {/* File Uploads */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">
                      Attach Files (Optional)
                    </label>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {inputs.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {inputs.map((input) => (
                        <div
                          key={input.id}
                          className="flex items-center gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                        >
                          {getFileIcon(input.type)}
                          <span className="text-sm text-gray-300 flex-1 truncate">
                            {input.fileName}
                          </span>
                          <button
                            onClick={() => removeInput(input.id)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>



                {/* Generate Button */}
                <Button
                  onClick={handleGenerateWorkflow}
                  disabled={loading || !brief.trim()}
                  className="w-full h-14 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:bg-emerald-600 text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Workflow...
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
