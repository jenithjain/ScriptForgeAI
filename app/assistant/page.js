"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import {
  Send, Sparkles, TrendingUp, BarChart3, DollarSign,
  PieChart, AlertCircle, ArrowUpRight, Target
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  "Help me track character arcs across my screenplay",
  "Check for timeline inconsistencies in chapters 1-5",
  "Summarize Sarah's character development",
  "Find all scenes where Marcus and Elena interact",
  "Suggest plot ideas to resolve the mystery thread"
];

const DUMMY_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm ScriptForge AI, your intelligent writing assistant. I can help you maintain narrative continuity, track characters and timelines, detect inconsistencies, and provide creative suggestions for your screenplay or story. What would you like me to help with?",
    timestamp: "07:21 PM"
  }
];

export default function Assistant() {
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: "Analyzing your manuscript... ✓\n\nStory Context: Loaded 15 chapters\nCharacter Tracking: 12 main characters identified\nTimeline Validation: No inconsistencies found\nPlot Threads: 5 active, 2 resolved\n\nI've mapped Sarah's character arc from Chapter 1-15. Her transformation from skeptic to believer is well-paced. Suggested enhancement: Add a scene in Chapter 10 showing her internal conflict. Shall I provide detailed suggestions?",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <>
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden pb-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="mb-6 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground ivy-font">ScriptForge AI</h1>
              <p className="text-sm text-emerald-500 ivy-font">Smart Script Writing Assistant</p>
            </div>
          </div>
          <p className="text-muted-foreground ivy-font max-w-2xl mx-auto">
            Intelligent writing assistant with comprehensive story awareness and narrative continuity tracking
          </p>
        </div>

        {/* Chat Container */}
        <Card className="border-border/40 backdrop-blur-xl bg-card/50 shadow-2xl overflow-hidden animate-slide-up">
          <div className="flex flex-col h-[600px]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 animate-message-slide ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Avatar */}
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === 'assistant'
                        ? 'bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg'
                        : 'bg-muted'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Sparkles className="h-5 w-5 text-white" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      <div
                        className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'assistant'
                            ? 'bg-muted/50 text-foreground border border-border/40'
                            : 'bg-emerald-500 text-white'
                        } shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <p className="text-sm leading-relaxed ivy-font whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground ivy-font px-2">
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-4 animate-message-slide">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-muted/50 border border-border/40 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Suggested Prompts */}
            {messages.length === 1 && (
              <div className="px-6 py-4 border-t border-border/40 bg-muted/20 animate-fade-in">
                <p className="text-xs text-muted-foreground mb-3 ivy-font">Suggested prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs ivy-font hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all hover:scale-105"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your story, check character consistency, or get creative suggestions..."
                    className="resize-none min-h-[60px] max-h-[120px] pr-12 ivy-font bg-background/80 border-border/60 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                    rows={1}
                  />
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="outline" className="text-xs ivy-font">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Press Enter to send
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="h-[60px] px-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center ivy-font">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Shift + Enter</kbd> for new line
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: TrendingUp, label: "Sales Forecast", value: "Active" },
            { icon: BarChart3, label: "RFM Segmentation", value: "Ready" },
            { icon: Sparkles, label: "Campaign Agent", value: "Live" },
            { icon: Target, label: "Workflows", value: "Updated" }
          ].map((stat, idx) => (
            <Card
              key={idx}
              className="p-4 border-border/40 backdrop-blur-sm bg-card/30 hover:bg-card/50 transition-all hover:scale-105 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground ivy-font">{stat.label}</p>
                  <p className="text-sm font-semibold text-foreground ivy-font">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
    </div>
      <Footer />
      </>
  );
}
