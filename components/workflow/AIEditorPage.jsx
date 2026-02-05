'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  AlertCircle, AlertTriangle, Info, CheckCircle, XCircle,
  Sparkles, FileText, Clock, GitCompare, BookOpen,
  Pencil, Check, Send, Bot, User, Zap, Terminal,
  Maximize2, Minimize2, PanelBottomClose, PanelBottom,
  PanelRightClose, PanelRight, RefreshCw, Copy, ArrowLeft,
  Database, Network, Link2, Users, MapPin, Minus, Plus,
  MessageSquare, Eye, EyeOff, Undo2, Redo2, Bold, Italic,
  History, GitBranch, Save, Share2, MousePointer2, Focus, AlignJustify
} from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from "socket.io-client";
import { nanoid } from 'nanoid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

// Custom scrollbar and Word document styles
const scrollbarStyles = `
  .ai-editor-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .ai-editor-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .ai-editor-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
  }
  .ai-editor-scroll::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }

  /* Remote Cursor Styles */
  .remote-cursor-flag {
    position: absolute;
    top: -16px;
    left: 0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    color: white;
    font-weight: bold;
    white-space: nowrap;
    z-index: 20;
    pointer-events: none;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  .remote-cursor-caret {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    z-index: 20;
    pointer-events: none;
  }

  /* Word Document Style */
  .word-document {
    background: #f5f5f5;
    min-height: 100%;
    padding: 40px;
  }
  
  .dark .word-document {
    background: #1a1a1a;
  }

  .script-page {
    background: white;
    max-width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 1in 1.25in;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-family: var(--font-courier-prime), 'Courier New', Courier, monospace;
    font-size: 12pt;
    line-height: 1.5;
    position: relative;
  }

  .dark .script-page {
    background: #0d0d0d;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  /* Screenplay formatting */
  .script-line {
    margin-bottom: 0;
    min-height: 18px;
  }

  .script-line.scene-heading {
    text-transform: uppercase;
    font-weight: bold;
    margin-top: 24px;
  }

  .script-line.action {
    margin-top: 12px;
  }

  .script-line.character {
    text-align: center;
    text-transform: uppercase;
    margin-top: 12px;
    margin-left: 2in;
    margin-right: 2in;
  }

  .script-line.parenthetical {
    text-align: center;
    margin-left: 1.5in;
    margin-right: 2in;
  }

  .script-line.dialogue {
    margin-left: 1in;
    margin-right: 1.5in;
  }

  .script-line.transition {
    text-align: right;
    text-transform: uppercase;
    margin-top: 12px;
  }

  /* Comment thread marker */
  .comment-marker {
    position: absolute;
    right: -50px;
    width: 20px;
    height: 20px;
    background: #0ea5e9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 10px;
    color: white;
  }

  /* Issue highlight in document */
  .issue-highlight {
    background: rgba(245, 158, 11, 0.2);
    border-bottom: 2px wavy #f59e0b;
    cursor: pointer;
    position: relative;
  }

  .issue-highlight:hover {
    background: rgba(245, 158, 11, 0.3);
  }
`;

// Issue types configuration
const ISSUE_TYPES = {
  error: { icon: XCircle, color: '#EF4444', label: 'Error' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Warning' },
  info: { icon: Info, color: '#3B82F6', label: 'Info' },
  hint: { icon: Sparkles, color: '#10B981', label: 'Hint' }
};

const CATEGORY_ICONS = {
  semantic: BookOpen,
  temporal: Clock,
  continuity: GitCompare,
  style: Pencil
};

// Helper function to detect line type for screenplay formatting
const detectLineType = (line, prevLine, nextLine) => {
  const trimmed = line.trim();
  const upperTrimmed = trimmed.toUpperCase();

  // Scene heading (INT./EXT.)
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(upperTrimmed)) {
    return 'scene-heading';
  }

  // Transition (CUT TO:, FADE IN:, etc.)
  if (/^(CUT TO:|FADE IN:|FADE OUT:|DISSOLVE TO:|SMASH CUT:|TIME CUT:|MATCH CUT:)/.test(upperTrimmed) ||
    /^(CUT TO|FADE TO|FADE OUT|THE END)$/.test(upperTrimmed)) {
    return 'transition';
  }

  // Character name (all caps, centered position logic)
  if (trimmed === trimmed.toUpperCase() &&
    trimmed.length > 0 &&
    trimmed.length < 40 &&
    !trimmed.includes('.') &&
    /^[A-Z\s\(\)]+$/.test(trimmed)) {
    return 'character';
  }

  // Parenthetical
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return 'parenthetical';
  }

  // Check if previous line was character or parenthetical (then this is dialogue)
  if (prevLine) {
    const prevType = detectLineType(prevLine, null, null);
    if (prevType === 'character' || prevType === 'parenthetical') {
      if (trimmed.length > 0) {
        return 'dialogue';
      }
    }
  }

  // Default to action
  if (trimmed.length > 0) {
    return 'action';
  }

  return 'empty';
};

// Parse screenplay into structured format
const parseScreenplay = (content, problems) => {
  if (!content) return [];

  const rawLines = content.split('\n');
  const parsedLines = rawLines.map((line, idx) => {
    const prevLine = idx > 0 ? rawLines[idx - 1] : null;
    const nextLine = idx < rawLines.length - 1 ? rawLines[idx + 1] : null;

    const lineType = detectLineType(line, prevLine, nextLine);
    const problem = problems.find(p => p.line === idx + 1);

    return {
      number: idx + 1,
      content: line,
      type: lineType,
      hasProblem: !!problem,
      problem: problem || null,
      pendingChange: problem ? {
        original: problem.originalText || line,
        suggested: problem.suggestedFix || null,
        status: 'pending' // pending, accepted, rejected
      } : null
    };
  });

  return parsedLines;
};

export default function AIEditorPage({
  isOpen,
  onClose,
  workflow,
  nodes,
  onApplyEdit
}) {
  const [problems, setProblems] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(220);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(true);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('problems');
  const [scriptContent, setScriptContent] = useState('');
  const [scriptLines, setScriptLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [neo4jReferences, setNeo4jReferences] = useState([]);
  const [resolvedProblems, setResolvedProblems] = useState(new Set());
  const [acceptedChanges, setAcceptedChanges] = useState([]);
  const [rejectedChanges, setRejectedChanges] = useState([]);
  const [pendingChangesInDoc, setPendingChangesInDoc] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showIssueHighlights, setShowIssueHighlights] = useState(true);

  // Real-time Collaboration State
  const [socket, setSocket] = useState(null);
  const [collaborators, setCollaborators] = useState({}); // { [userId]: { name, color, line, timestamp } }
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Focus / Zen Mode
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Toggle Focus Mode
  const toggleFocusMode = useCallback((enabled) => {
    setIsFocusMode(enabled);
    if (enabled) {
      setIsBottomPanelOpen(false);
      setIsRightPanelOpen(false);
      setIsReferencePanelOpen(false);
      setIsVersionPanelOpen(false);
      setShowIssueHighlights(false);
      toast("Focus Mode On", { icon: "🧘" });
    } else {
      // Restore default state? Or just let user open what they need
      // Optionally restore some:
      setIsBottomPanelOpen(true);
      setIsRightPanelOpen(true);
      setShowIssueHighlights(true);
      toast("Focus Mode Off", { icon: "⚡" });
    }
  }, []);

  const currentUser = useMemo(() => {
    // Persist identity for session
    if (typeof window !== 'undefined') {
      // Set basic share URL immediately on client side (fallback if socket fails)
      if (!shareUrl) {
        const docId = workflow?.id || workflow?._id || 'demo-doc';
        setShareUrl(`${window.location.origin}/workflows/${docId}?share=true`);
      }

      const stored = localStorage.getItem('sf_user_identity');
      if (stored) return JSON.parse(stored);

      const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const identity = {
        id: nanoid(),
        name: `Writer ${Math.floor(Math.random() * 1000)}`,
        color: randomColor
      };
      localStorage.setItem('sf_user_identity', JSON.stringify(identity));
      return identity;
    }
    return { id: 'anon', name: 'Anonymous', color: '#333' };
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    // Create socket connection
    const socketInstance = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    socketInstance.on('connect', () => {
      console.log("Socket connected:", socketInstance.id);
      const docId = workflow?.id || workflow?._id || 'demo-doc';
      setShareUrl(`${window.location.origin}/workflows/${docId}?share=true`);
      socketInstance.emit('join-document', docId, currentUser);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn("Socket connection failed (likely dev mode):", err.message);
      // Don't clear shareUrl, keep fallback
    });

    socketInstance.on('user-joined', (user) => {
      toast.success(`${user.name} joined the session`, { icon: '👋' });
    });

    socketInstance.on('cursor-update', (data) => {
      // data: { userId, userName, color, line, offset }
      setCollaborators(prev => ({
        ...prev,
        [data.userId]: { ...data, lastActive: Date.now() }
      }));
    });

    socketInstance.on('receive-changes', (data) => {
      // data: { lineId, content, senderId }
      if (data.senderId === currentUser.id) return;

      setScriptLines(prev => prev.map(line => {
        if (line.number === data.lineId) {
          return { ...line, content: data.content };
        }
        return line;
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [workflow, currentUser]);

  // Resizing Refs
  const isDraggingBottom = useRef(false);
  const isDraggingRight = useRef(false);

  // Autosave ref
  const autosaveTimeoutRef = useRef(null);

  // Debounce refs for cursor tracking and graph syncing
  const cursorDebounceRef = useRef(null);
  const graphSyncDebounceRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingBottom.current) {
        // Calculate new height from bottom
        const newHeight = window.innerHeight - e.clientY;
        // Clamp height (min 100px, max 80vh)
        if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
          setBottomPanelHeight(newHeight);
        }
      }
      if (isDraggingRight.current) {
        // Calculate new width from right
        const newWidth = window.innerWidth - e.clientX;
        // Clamp width (min 200px, max 50vw)
        if (newWidth > 250 && newWidth < window.innerWidth * 0.5) {
          setRightPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingBottom.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Cleanup debounce timers
      if (cursorDebounceRef.current) {
        clearTimeout(cursorDebounceRef.current);
      }
      if (graphSyncDebounceRef.current) {
        clearTimeout(graphSyncDebounceRef.current);
      }
    };
  }, []);

  const handleDragBottomStart = (e) => {
    e.preventDefault();
    isDraggingBottom.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDragRightStart = (e) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Version Control State
  const [versions, setVersions] = useState([]);
  const [versionMessage, setVersionMessage] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState(null); // ID of version pending restore confirmation

  const chatEndRef = useRef(null);
  const editorScrollRef = useRef(null);
  const lineRefs = useRef({});
  const editableRefs = useRef({});

  // Sync Knowledge Graph with debouncing
  const syncGraphWithScript = useCallback(async (content) => {
    const wfId = workflow?._id || workflow?.id;
    if (!wfId || !content) return;

    // Clear any existing graph sync timer
    if (graphSyncDebounceRef.current) {
      clearTimeout(graphSyncDebounceRef.current);
    }

    // Debounce: Only sync after 2 seconds of inactivity
    graphSyncDebounceRef.current = setTimeout(() => {
      // Fire and forget (or toast promise) - don't block UI
      toast.promise(
        fetch('/api/script-editor/sync-graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content,
            workflowId: wfId,
            chapterNumber: 1,
            replaceGraph: true // Flag to replace instead of append
          })
        }).then(async res => {
          if (!res.ok) throw new Error('Sync failed');
          return res.json();
        }),
        {
          loading: 'Syncing Knowledge Graph...',
          success: 'Knowledge Graph Updated',
          error: 'Graph Sync Failed'
        },
        {
          style: { minWidth: '250px', fontSize: '12px' },
          success: { duration: 2000 }
        }
      );
    }, 2000); // 2 second debounce
  }, [workflow]);

  // Version Control Functions
  const fetchVersions = useCallback(async () => {
    const wfId = workflow?._id || workflow?.id;
    if (!wfId) return;
    try {
      const res = await fetch(`/api/script-editor/versions?workflowId=${wfId}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch versions', error);
    }
  }, [workflow]);

  const handleSaveVersion = async () => {
    const wfId = workflow?._id || workflow?.id;
    if (!scriptContent || !wfId) return;
    setIsSavingVersion(true);
    try {
      const res = await fetch('/api/script-editor/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: wfId,
          content: scriptContent,
          message: versionMessage || 'Manual checkpoint',
          stats: {
            totalLines: scriptContent.split('\n').length
          },
          acceptedChanges,
          rejectedChanges
        })
      });
      if (!res.ok) throw new Error('Save failed');

      setVersionMessage('');
      toast.success('Version saved successfully');

      // Sync with Knowledge Graph on manual save as well
      syncGraphWithScript(scriptContent);

      fetchVersions();
    } catch (error) {
      toast.error('Failed to save version');
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleRestoreVersion = (version, e) => {
    // Aggressively prevent default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation();
    }

    // Step 1: Request confirmation if not already confirming this version
    if (confirmRestoreId !== version._id) {
      setConfirmRestoreId(version._id);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setConfirmRestoreId(null), 3000);
      return false;
    }

    // Step 2: Actually restore
    try {
      // Ensure content is a string to prevent parser crashes
      const contentToRestore = typeof version.content === 'string' ? version.content : String(version.content || '');

      setScriptContent(contentToRestore);

      if (version.acceptedChanges && Array.isArray(version.acceptedChanges)) {
        setAcceptedChanges(version.acceptedChanges);
      } else {
        setAcceptedChanges([]);
      }

      if (version.rejectedChanges && Array.isArray(version.rejectedChanges)) {
        setRejectedChanges(version.rejectedChanges);
      } else {
        setRejectedChanges([]);
      }

      setConfirmRestoreId(null);
      toast.success(`Restored version from ${new Date(version.createdAt).toLocaleString()}`);
    } catch (err) {
      console.error("Error restoring version:", err);
      toast.error("Failed to restore version");
    }

    return false;
  };

  // Fetch versions on load
  useEffect(() => {
    if (workflow) {
      fetchVersions();
    }
  }, [workflow, fetchVersions]);

  // Extract problems from agent outputs
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const extractedProblems = [];
    const extractedReferences = [];
    let problemIndex = 0;

    const addProblem = (data, type, category, source) => {
      let problemLine = data.lineNumber || data.line;
      let originalText = data.original || data.originalText || data.problematic_text || '';

      // SMART LINE DETECTION:
      // If we have the original text, find which line it actually belongs to in the current script.
      // This fixes issues where agents return incorrect or outdated line numbers,
      // or when the random fallback was assigning issues to random paragraphs.

      // Use scriptContent if available, otherwise fallback to workflow brief
      const currentScript = scriptContent || workflow?.brief || '';

      if (currentScript) {
        let lines = currentScript.split('\n');

        let cleanOriginal = originalText ? originalText.trim() : '';
        let foundLineIdx = -1;

        // Strategy 1: Use provided original text with loose matching
        if (cleanOriginal) {
          // 1. Exact match search
          foundLineIdx = lines.findIndex(l => l.includes(cleanOriginal));

          // 2. Normalized Match (ignore case and whitespace)
          if (foundLineIdx === -1) {
            const normalizedOriginal = cleanOriginal.toLowerCase().replace(/\s+/g, ' ');
            foundLineIdx = lines.findIndex(l => l.toLowerCase().replace(/\s+/g, ' ').includes(normalizedOriginal));
          }

          // 3. Fuzzy match (if exact match fails) - check if snippet is in line
          if (foundLineIdx === -1 && cleanOriginal.length > 10) {
            const snippet = cleanOriginal.length > 30 ? cleanOriginal.substring(0, 30) : cleanOriginal;
            foundLineIdx = lines.findIndex(l => l.includes(snippet));
          }

          // 4. Reverse fuzzy - check if line is in snippet (for short lines)
          if (foundLineIdx === -1 && cleanOriginal.length > 10) {
            foundLineIdx = lines.findIndex(l => l.length > 10 && cleanOriginal.includes(l.trim()));
          }

          if (foundLineIdx !== -1) {
            problemLine = foundLineIdx + 1;
          }
        }

        const message = data.description || data.message || String(data);

        // Strategy 2: If no original text, try to find QUOTED text in the problem message
        // e.g. "Simran's eyes are described as 'piercing blue'..."
        if (foundLineIdx === -1 && (!cleanOriginal || (cleanOriginal && problemLine === (data.lineNumber || data.line)))) {
          const quotedMatches = message.match(/'([^']+)'/g); // Find text in single quotes

          if (quotedMatches && quotedMatches.length > 0) {
            for (const quoted of quotedMatches) {
              const textToFind = quoted.replace(/'/g, '').trim();
              if (textToFind.length > 10) { // Only search for substantial chunks
                let matchIdx = lines.findIndex(l => l.includes(textToFind));
                if (matchIdx !== -1) {
                  problemLine = matchIdx + 1;
                  // Also update originalText so we can highlight it
                  if (!cleanOriginal) originalText = textToFind;
                  foundLineIdx = matchIdx;
                  break;
                }
              }
            }
          }
        }

        // Strategy 3: Keyword/Entity Density Matching (when other methods fail)
        // Detect significant words in the error message and find the line with the most overlaps
        if (foundLineIdx === -1 && message) {
          // Extract words that look significant (Capitalized words, or longer words)
          // Remove common words usually found in AI critiques
          const stopWords = ['The', 'A', 'An', 'In', 'On', 'During', 'However', 'Therefore', 'This', 'That', 'It', 'Is', 'Are', 'Was', 'Were', 'Scene', 'Chapter', 'Character', 'Dialogue', 'Action', 'Transition', 'Issue', 'Error', 'Warning', 'Text'];

          // Tokenizer: split by non-word chars, filter short/stop words
          const words = message.split(/[^a-zA-Z0-9]+/)
            .filter(w => w.length > 3) // Filter short words
            .filter(w => !stopWords.includes(w))
            .filter(w => /^[A-Z]/.test(w) || w.length > 6); // Prefer capitalized or long words

          // Only proceed if we have enough distinct keywords to be meaningful
          const uniqueWords = [...new Set(words)];

          if (uniqueWords.length >= 2) {
            let bestLineIdx = -1;
            let maxScore = 0;

            lines.forEach((line, idx) => {
              if (line.trim().length < 10) return; // skip very short lines

              let matches = 0;
              uniqueWords.forEach(w => {
                if (line.includes(w)) matches++;
              });

              if (matches > 0) {
                // Score favors density to avoid matching long paragraphs just because they are long
                // But finding multiple keywords is key
                const score = matches;
                if (score > maxScore) {
                  maxScore = score;
                  bestLineIdx = idx;
                }
              }
            });

            // Require at least 2 keyword matches or a very strong partial match
            if (bestLineIdx !== -1 && maxScore >= 2) {
              problemLine = bestLineIdx + 1;
              foundLineIdx = bestLineIdx;
              // Set originalText to the found line content to help highlighting
              if (!cleanOriginal) originalText = lines[bestLineIdx];
            }
          }
        }
      }

      // If we still don't have a line number, default to line 1 to avoid random highlighting errors
      // Use 0 or null to indicate "general script issue" if your UI supports it, otherwise 1 is safer than random.
      if (!problemLine) {
        problemLine = 1;
      }


      const problem = {
        id: `problem-${problemIndex++}`,
        type: data.severity === 'high' ? 'error' : data.severity === 'low' ? 'info' : 'warning',
        category,
        title: data.title || data.type || 'Issue Detected',
        message: data.description || data.message || String(data),
        location: data.location || data.scene || 'Script',
        line: problemLine,
        column: data.column || null,
        source,
        originalText: originalText,
        suggestedFix: data.suggestion || data.fix || data.suggestedText || data.corrected_text || '',
        explanation: data.explanation || data.reason || '',
        status: 'pending',
        // Neo4j reference data
        references: data.references || data.evidence || [],
        entityType: data.entityType || data.entity_type || null,
        entityId: data.entityId || data.entity_id || null,
        relatedEntities: data.relatedEntities || data.related_entities || []
      };
      extractedProblems.push(problem);

      // Extract Neo4j references if available
      if (data.references || data.evidence || data.knowledge_graph_ref) {
        extractedReferences.push({
          problemId: problem.id,
          type: category,
          entities: data.references || data.evidence || [data.knowledge_graph_ref],
          source: source
        });
      }
    };

    // Parse all agent outputs
    const agentMappings = [
      { type: 'story-intelligence', category: 'style', name: 'Story Intelligence' },
      { type: 'temporal-reasoning', category: 'temporal', name: 'Temporal Reasoning' },
      { type: 'continuity-validator', category: 'continuity', name: 'Continuity Validator' },
      { type: 'creative-coauthor', category: 'style', name: 'Creative Co-Author' },
      { type: 'knowledge-graph', category: 'semantic', name: 'Knowledge Graph' }
    ];

    agentMappings.forEach(({ type, category, name }) => {
      const agent = nodes.find(n => n?.data?.agentType === type);
      if (agent?.data?.result || agent?.data?.output) {
        const data = agent.data.result || agent.data.output;

        if (typeof data === 'object') {
          const issueFields = [
            'errors', 'warnings', 'issues', 'problems',
            'temporal_issues', 'temporalIssues', 'timeline_errors',
            'continuity_errors', 'contradictions', 'plot_holes', 'plotHoles',
            'suggestions', 'improvements', 'style_issues', 'styleIssues',
            'character_issues', 'characterIssues', 'location_issues', 'locationIssues',
            'paradoxes', 'inconsistencies'
          ];

          issueFields.forEach(field => {
            const items = data[field];
            if (Array.isArray(items)) {
              items.forEach(item => {
                addProblem(
                  typeof item === 'string' ? { description: item } : item,
                  field.includes('error') ? 'error' : 'warning',
                  category,
                  name
                );
              });
            }
          });

          // Extract Neo4j knowledge graph references
          if (type === 'knowledge-graph' && data.entities) {
            if (Array.isArray(data.entities)) {
              data.entities.forEach(entity => {
                extractedReferences.push({
                  type: 'entity',
                  name: entity.name,
                  entityType: entity.type,
                  properties: entity.properties || {},
                  relationships: entity.relationships || []
                });
              });
            }
          }
        }
      }
    });

    setProblems(extractedProblems);
    setNeo4jReferences(extractedReferences);

    // Initial AI message
    if (extractedProblems.length > 0 && chatMessages.length === 0) {
      setChatMessages([{
        id: 'initial',
        role: 'assistant',
        content: `I've analyzed your script and found **${extractedProblems.length} issues** that need attention.\n\nClick on any problem in the bottom panel to see the diff and get AI-powered fix suggestions with Neo4j evidence.`,
        timestamp: new Date()
      }]);
    }
  }, [nodes, workflow, scriptContent]);

  // Initialize script content once, preferring latest version if available
  useEffect(() => {
    // If we have versions, try to use the latest one
    if (versions.length > 0) {
      // If content is empty OR matches the raw brief (meaning it hasn't been edited manually yet),
      // we upgrade it to the latest version history.
      // We compare trimmed values to avoid whitespace issues.
      if (!scriptContent || (workflow?.brief && scriptContent.trim() === workflow.brief.trim())) {
        if (versions[0].content !== scriptContent) {
          setScriptContent(versions[0].content);
          if (versions[0].acceptedChanges) setAcceptedChanges(versions[0].acceptedChanges);
          if (versions[0].rejectedChanges) setRejectedChanges(versions[0].rejectedChanges);
          // toast("Loaded latest saved version from history", { icon: '🕒' });
        }
      }
    }
    // Otherwise fallback to brief if nothing else exists
    else if (workflow?.brief && !scriptContent) {
      setScriptContent(workflow.brief);
    }
  }, [workflow, versions, scriptContent]);

  // Build script content with diff highlighting
  useEffect(() => {
    // Determine the source of content - prefer current state if modified, else workflow brief
    const contentToParse = scriptContent || workflow?.brief;

    if (contentToParse) {
      // Parse screenplay with structure detection
      const parsedLines = parseScreenplay(contentToParse, problems);
      setScriptLines(parsedLines);

      // If we initialized from workflow brief, ensure state is set
      if (!scriptContent && workflow?.brief) {
        setScriptContent(workflow.brief);
      }

      // Initialize pending changes in document
      const pendingChanges = {};
      problems.forEach(problem => {
        if (problem.line && problem.suggestedFix) {
          pendingChanges[problem.id] = {
            lineNumber: problem.line,
            original: problem.originalText,
            suggested: problem.suggestedFix,
            status: 'pending'
          };
        }
      });
      setPendingChangesInDoc(pendingChanges);
    }
  }, [scriptContent, workflow, problems]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle editable content blur (when user finishes editing a line)
  const handleEditableBlur = useCallback((lineNumber, e) => {
    const newContent = e.currentTarget.innerText;

    // Update the line content in state
    setScriptLines(prev => prev.map(line =>
      line.number === lineNumber
        ? { ...line, content: newContent }
        : line
    ));

    // Update the full script content
    const updatedContent = scriptLines.map(line =>
      line.number === lineNumber ? newContent : line.content
    ).join('\n');

    setScriptContent(updatedContent);

    // Trigger debounced graph sync
    syncGraphWithScript(updatedContent);
  }, [scriptLines, syncGraphWithScript]);

  // Handle keydown in editable content
  const handleEditableKeyDown = useCallback((lineNumber, e) => {
    // Handle Enter key to create new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Get current content
      const currentContent = e.currentTarget.innerText;

      // Update current line
      setScriptLines(prev => {
        const currentLineIndex = prev.findIndex(l => l.number === lineNumber);
        if (currentLineIndex === -1) return prev;

        // Insert new line after current
        const newLines = [...prev];
        newLines.splice(currentLineIndex + 1, 0, {
          number: lineNumber + 0.5, // Temporary number
          content: '',
          type: 'empty',
          hasProblem: false,
          problem: null,
          pendingChange: null
        });

        // Renumber all lines
        return newLines.map((line, idx) => ({
          ...line,
          number: idx + 1
        }));
      });

      // Focus on the new line
      setTimeout(() => {
        const nextLineRef = editableRefs.current[lineNumber + 1];
        if (nextLineRef) {
          nextLineRef.focus();
        }
      }, 50);
    }
  }, []);

  const handleProblemClick = (problem) => {
    setSelectedProblem(problem);

    // Scroll to the line in the editor
    setTimeout(() => {
      const lineElement = lineRefs.current[problem.line];
      if (lineElement && editorScrollRef.current) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Add AI message with suggestion (only if not already resolved)
    if (!resolvedProblems.has(problem.id)) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `**${problem.title}**\n\n${problem.message}`,
        problem: problem,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newMessage]);
    }
  };

  const handleAcceptFix = async (problem) => {
    let fixToApply = null;

    // ALWAYS generate a fresh fix via Gemini, as the 'suggestedFix' from agents 
    // is often just a prompt/instruction (e.g. "Provide a clearer timeline...") 
    // rather than the actual rewritten text.
    try {
      const loadingId = toast.loading("Generating fix...");

      // Safely determine text to fix - ALWAYS prefer the full line content for context
      let textToFix = null;
      const currentLine = scriptLines.find(l => l.number === problem.line);
      if (currentLine) textToFix = currentLine.content;

      // Fallback if line lookup fails
      if (!textToFix) textToFix = problem.originalText;

      if (!textToFix) {
        toast.dismiss(loadingId);
        toast.error("Cannot find text to fix.");
        return;
      }

      // Use the 'suggestedFix' (instruction) as the issue description if available
      const issueDescription = problem.suggestedFix || problem.message || problem.title;

      // Call API
      const response = await fetch('/api/script-editor/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: issueDescription,
          text: textToFix
        })
      });

      toast.dismiss(loadingId);

      if (!response.ok) throw new Error("API Failed");
      const data = await response.json();

      if (data.edits && data.edits.length > 0) {
        fixToApply = data.edits[0].new_text;
        // Update the problem object purely for reference
        problem.suggestedFix = fixToApply;
      } else {
        toast.error("AI could not generate a fix.");
        return;
      }

    } catch (e) {
      console.error("Auto-fix generation failed", e);
      toast.error("Failed to generate fix.");
      return;
    }

    // Double check we have something to apply
    if (!fixToApply) return;

    // 1. Calculate the new lines array
    const updatedLines = scriptLines.map(line => {
      if (line.number === problem.line) {
        return {
          ...line,
          content: fixToApply,
          hasProblem: false,
          problem: null,
          pendingChange: null,
          acceptedChange: true
        };
      }
      return line;
    });

    // 2. Update all states based on the calculated values
    setScriptLines(updatedLines);

    const newStringContent = updatedLines.map(l => l.content).join('\n');
    setScriptContent(newStringContent);

    // 3. Mark problem as resolved
    setResolvedProblems(prev => new Set([...prev, problem.id]));

    // Track accepted changes
    const newChangeRecord = {
      id: problem.id,
      original: problem.originalText,
      applied: fixToApply,
      timestamp: new Date()
    };
    setAcceptedChanges(prev => [...prev, newChangeRecord]);

    // Update pending changes in document
    setPendingChangesInDoc(prev => {
      const updated = { ...prev };
      if (updated[problem.id]) {
        updated[problem.id].status = 'accepted';
      }
      return updated;
    });

    // Remove from problems list
    setProblems(prev => prev.filter(p => p.id !== problem.id));

    // Clear selection if this was the selected problem
    if (selectedProblem?.id === problem.id) {
      setSelectedProblem(null);
    }

    // Update chat messages to show resolution
    setChatMessages(prev => prev.map(msg => {
      if (msg.problem?.id === problem.id) {
        return { ...msg, problem: { ...msg.problem, resolved: true, resolution: 'accepted', suggestedFix: fixToApply } };
      }
      return msg;
    }));

    onApplyEdit?.(problem, 'accept');
    toast.success('Change accepted and applied to document');

    // 4. Trigger side effects (Sync & Autosave) after state updates are scheduled
    // Sync Graph immediately with the new content
    syncGraphWithScript(newStringContent);

    // AUTO-SAVE VERSION: ensure the latest edits persist to history immediately
    const autoSaveAcceptedChanges = [...acceptedChanges, newChangeRecord];

    setTimeout(() => {
      const wfId = workflow?._id || workflow?.id;
      if (newStringContent && wfId) {
        fetch('/api/script-editor/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: wfId,
            content: newStringContent,
            message: `Auto-save: Accepted fix for "${problem.title}"`,
            stats: { totalLines: newStringContent.split('\n').length },
            acceptedChanges: autoSaveAcceptedChanges,
            rejectedChanges: rejectedChanges
          })
        }).then(() => {
          fetchVersions(); // Refresh history list
        });
      }
    }, 100);

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `✓ Change accepted: "${problem.originalText?.substring(0, 30)}..." → "${fixToApply?.substring(0, 30)}..."`,
      timestamp: new Date()
    }]);
  };

  const handleRejectFix = (problem) => {
    // Mark problem as resolved (rejected) but keep original content
    setResolvedProblems(prev => new Set([...prev, problem.id]));

    // Track rejected changes
    setRejectedChanges(prev => [...prev, {
      id: problem.id,
      original: problem.originalText,
      rejected: problem.suggestedFix,
      timestamp: new Date()
    }]);

    // Update pending changes in document
    setPendingChangesInDoc(prev => {
      const updated = { ...prev };
      if (updated[problem.id]) {
        updated[problem.id].status = 'rejected';
      }
      return updated;
    });

    // Remove from problems list
    setProblems(prev => prev.filter(p => p.id !== problem.id));

    // Clear problem marker from script lines
    setScriptLines(prev => prev.map(line => {
      if (line.problem?.id === problem.id) {
        return { ...line, hasProblem: false, problem: null, pendingChange: null, rejectedChange: true };
      }
      return line;
    }));

    // Clear selection if this was the selected problem
    if (selectedProblem?.id === problem.id) {
      setSelectedProblem(null);
    }

    // Update chat messages
    setChatMessages(prev => prev.map(msg => {
      if (msg.problem?.id === problem.id) {
        return { ...msg, problem: { ...msg.problem, resolved: true, resolution: 'rejected' } };
      }
      return msg;
    }));

    onApplyEdit?.(problem, 'reject');
    toast('Change rejected - original text preserved');

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `✗ Change rejected: Keeping original text`,
      timestamp: new Date()
    }]);
  };

  // Handle manual editing of script lines
  const handleLineEdit = (lineNumber, newContent) => {
    // 1. Calculate new state based on current scriptLines
    const updatedLines = scriptLines.map(line => {
      if (line.number === lineNumber) {
        return { ...line, content: newContent, manuallyEdited: true };
      }
      return line;
    });

    const newStringContent = updatedLines.map(l => l.content).join('\n');

    // 2. Queue state updates
    setScriptLines(updatedLines);
    setScriptContent(newStringContent);

    // 3. Handle side effects (Autosave)
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      const wfId = workflow?._id || workflow?.id;
      if (wfId) {
        fetch('/api/script-editor/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: wfId,
            content: newStringContent,
            message: `Auto-save: Manual edit`,
            stats: { totalLines: newStringContent.split('\n').length },
            acceptedChanges: acceptedChanges,
            rejectedChanges: rejectedChanges
          })
        }).then(() => {
          fetchVersions();
          syncGraphWithScript(newStringContent);
        });
      }
    }, 2000);
  };

  const handleFixAllIssues = async () => {
    if (pendingProblems.length === 0) {
      toast.success("No pending issues to fix!");
      return;
    }

    setIsProcessing(true);
    // Construct a consolidated instruction
    let batchInstruction = `Please fix ALL of the following issues identified in the script. Ensure consistency across the entire text.\n\nISSUES TO FIX:\n`;

    pendingProblems.forEach((p, idx) => {
      batchInstruction += `${idx + 1}. [Line ${p.line}] ${p.title}: ${p.message}\n`;
    });

    try {
      // Use the Agent API for high-level rewriting
      const response = await fetch('/api/script-editor/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: batchInstruction,
          scriptContent: scriptContent
        })
      });

      if (!response.ok) throw new Error("Batch Fix Request failed");
      const data = await response.json();

      if (data.changes && data.changes.length > 0) {
        const newMessages = data.changes.map((change, idx) => {
          let matchLine = 1;
          const lines = scriptContent.split('\n');
          const foundIdx = lines.findIndex(l => l.includes(change.original_text.substring(0, 30)));
          if (foundIdx !== -1) matchLine = foundIdx + 1;

          return {
            id: `msg-agent-batch-${Date.now()}-${idx}`,
            role: 'assistant',
            problem: {
              id: `agent-batch-proposal-${Date.now()}-${idx}`,
              title: "Batch Fix",
              message: change.explanation || "Auto-fix for multiple issues",
              originalText: change.original_text,
              suggestedFix: change.new_text,
              line: matchLine,
              status: 'pending',
              resolved: false
            },
            timestamp: new Date()
          };
        });

        // Add the summary message with batch action
        const batchProblemPayload = newMessages.map(m => m.problem);
        const summaryMessage = {
          id: `msg-batch-all-${Date.now()}`,
          role: 'assistant',
          isBatchAction: true,
          resolveAllPending: true, // Flag to indicate this cleans up the issue list
          content: `I've analyzed all ${pendingProblems.length} issues and generated ${data.changes.length} consolidated fixes to address them consistently.`,
          batchProblems: batchProblemPayload,
          timestamp: new Date()
        };

        setChatMessages(prev => [...prev, ...newMessages, summaryMessage]);
        if (!isRightPanelOpen) setIsRightPanelOpen(true);

      } else {
        toast.error("Could not generate batch fixes.");
      }

    } catch (err) {
      console.error("Fix All Error", err);
      toast.error("Failed to generate fixes");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptAll = (problems, resolveAllPending = false) => {
    // 1. Calculate new lines applying all changes
    const updatedLines = scriptLines.map(line => {
      const matchingProblem = problems.find(p => p.line === line.number);
      if (matchingProblem) {
        return {
          ...line,
          content: matchingProblem.suggestedFix,
          hasProblem: false,
          problem: null,
          pendingChange: null,
          acceptedChange: true
        };
      }
      return line;
    });

    // 2. Queue State
    setScriptLines(updatedLines);
    const newStringContent = updatedLines.map(l => l.content).join('\n');
    setScriptContent(newStringContent);

    // 3. Mark Resolved
    const executedIds = new Set(problems.map(p => p.id));
    setResolvedProblems(prev => new Set([...prev, ...executedIds]));

    // If this was a "Fix All" action, mark ALL originally pending problems as resolved too
    // to clear the bottom panel
    if (resolveAllPending) {
      const allPendingIds = pendingProblems.map(p => p.id);
      setResolvedProblems(prev => new Set([...prev, ...allPendingIds]));
    }

    const newChanges = problems.map(p => ({
      id: p.id,
      original: p.originalText,
      applied: p.suggestedFix,
      timestamp: new Date()
    }));
    setAcceptedChanges(prev => [...prev, ...newChanges]);

    // 4. Update Chat UI to reflect resolution
    setChatMessages(prev => prev.map(msg => {
      if (msg.problem && executedIds.has(msg.problem.id)) {
        return { ...msg, problem: { ...msg.problem, resolved: true, resolution: 'accepted' } };
      }
      if (msg.isBatchAction && msg.batchProblems && msg.batchProblems.some(p => executedIds.has(p.id))) {
        return { ...msg, batchResolved: true };
      }
      return msg;
    }));

    toast.success(`Applied ${problems.length} fixes & updated document.`);

    // 5. Side Effects
    syncGraphWithScript(newStringContent);

    setTimeout(() => {
      if (newStringContent && workflow?.id) {
        const wfId = workflow.id;
        fetch('/api/script-editor/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: wfId,
            content: newStringContent,
            message: `Auto-save: Accepted ${problems.length} changes (Batch Fix)`,
            stats: { totalLines: newStringContent.split('\n').length },
            acceptedChanges: [...acceptedChanges, ...newChanges],
            rejectedChanges: rejectedChanges
          })
        }).then(() => {
          fetchVersions();
        });
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat immediately
    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }]);

    const currentInput = inputMessage;
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Determine context for the correction from selected problem
      let textToFix = '';
      let issueDescription = currentInput;
      let targetLineNumber = null;

      if (selectedProblem) {
        targetLineNumber = selectedProblem.line;
        // Try to find current content of the line from state
        const currentLine = scriptLines.find(l => l.number === targetLineNumber);
        textToFix = currentLine ? currentLine.content : selectedProblem.originalText;

        // If the user input is brief, combine with problem description for context
        if (currentInput.length < 50 && selectedProblem.message) {
          issueDescription = `Context: ${selectedProblem.title} - ${selectedProblem.message}. User Request: ${currentInput}`;
        }
      }

      // --- NEW AGENT LOGIC (If no specific problem selected) ---
      if (!selectedProblem) {
        // If we have script content, treat this as a global Agent Request
        if (scriptContent) {
          const response = await fetch('/api/script-editor/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instruction: currentInput,
              scriptContent: scriptContent
            })
          });

          if (!response.ok) throw new Error("Agent Request failed");
          const data = await response.json();

          if (data.changes && data.changes.length > 0) {
            // Convert agent changes to "Problem" style cards for the chat UI
            const newMessages = data.changes.map((change, idx) => {
              // Try to find the line number for the original text
              let matchLine = 1;
              const lines = scriptContent.split('\n');
              const foundIdx = lines.findIndex(l => l.includes(change.original_text.substring(0, 30))); // Fuzzy match start
              if (foundIdx !== -1) matchLine = foundIdx + 1;

              return {
                id: `msg-agent-${Date.now()}-${idx}`,
                role: 'assistant',
                content: idx === 0 ? "I've drafted some changes based on your request. Review them below:" : "",
                problem: {
                  id: `agent-proposal-${Date.now()}-${idx}`,
                  title: "AI Proposal",
                  message: change.explanation || "Suggested Edit",
                  originalText: change.original_text,
                  suggestedFix: change.new_text,
                  line: matchLine,
                  status: 'pending',
                  resolved: false
                },
                timestamp: new Date()
              };
            });

            setChatMessages(prev => [...prev, ...newMessages]);

            // Add Batch Action if multiple
            if (data.changes.length > 1) {
              const batchProblemPayload = newMessages.map(m => m.problem);
              setChatMessages(prev => [...prev, {
                id: `msg-batch-${Date.now()}`,
                role: 'system',
                isBatchAction: true,
                content: `Generated ${data.changes.length} proposals.`,
                batchProblems: batchProblemPayload,
                timestamp: new Date()
              }]);
            }
          } else {
            setChatMessages(prev => [...prev, {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: "I analyzed the script but couldn't determine a specific change to make based on that instruction. Could you be more specific?",
              timestamp: new Date()
            }]);
          }
          setIsProcessing(false);
          return;
        }
      }

      // --- EXISTING PROBLEM CORRECTION LOGIC ---
      if (!textToFix) {
        return;
      }

      // Call the Correction API
      const response = await fetch('/api/script-editor/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: issueDescription,
          text: textToFix
        })
      });

      if (!response.ok) throw new Error('Correction request failed');

      const data = await response.json();

      if (data.edits && data.edits.length > 0) {
        const edit = data.edits[0];

        // The API now handles cleaning, so use new_text directly
        // Fallback for empty strings to avoid "..." issue
        const cleanFixedText = edit.new_text || edit.newText || "(No change generated)";

        const newProblem = {
          id: `fix-${Date.now()}`,
          line: targetLineNumber,
          title: "AI Correction",
          message: issueDescription,
          originalText: edit.original_text || textToFix,
          suggestedFix: cleanFixedText,
          explanation: "Generated by AI Script Correction Engine",
          status: 'pending',
          resolved: false
        };

        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "I've generated a fix based on your instructions.",
          problem: newProblem,
          timestamp: new Date()
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "I analyzed the text but didn't perform any edits. The text might already match your intent or I couldn't determine a precise fix.",
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('AI Error:', error);
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I encountered an error while communicating with the correction engine.",
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeStyles = (type) => ISSUE_TYPES[type] || ISSUE_TYPES.warning;

  // Filter out resolved problems
  const pendingProblems = useMemo(() =>
    problems.filter(p => p.status === 'pending' && !resolvedProblems.has(p.id)),
    [problems, resolvedProblems]
  );
  const errorCount = pendingProblems.filter(p => p.type === 'error').length;
  const warningCount = pendingProblems.filter(p => p.type === 'warning').length;

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Top Bar */}
        <div className="h-12 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Workflow
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-sm">AI Script Editor</span>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                BETA
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
              className={`h-8 gap-1 text-xs ${isVersionPanelOpen ? 'bg-muted text-accent-foreground' : ''}`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReferencePanelOpen(!isReferencePanelOpen)}
              className="h-8 gap-1 text-xs"
            >
              <Database className="w-3.5 h-3.5" />
              Neo4j
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)} className="h-8">
              {isBottomPanelOpen ? <PanelBottomClose className="w-4 h-4" /> : <PanelBottom className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className="h-8">
              {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version Control Panel */}
          {isVersionPanelOpen && (
            <div className="w-64 border-r border-border bg-card/95 flex flex-col z-20">
              <div className="h-10 border-b border-border flex items-center justify-between px-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold">Version History</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVersionPanelOpen(false)}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              </div>

              <div className="p-3 border-b border-border space-y-2">
                <Textarea
                  value={versionMessage}
                  onChange={(e) => setVersionMessage(e.target.value)}
                  placeholder="Commit message..."
                  className="h-16 text-xs resize-none mb-1"
                />
                <Button type="button" size="sm" className="w-full h-7 text-xs gap-2" onClick={handleSaveVersion} disabled={isSavingVersion}>
                  <Save className="w-3.5 h-3.5" />
                  {isSavingVersion ? 'Saving...' : 'Save Version'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto ai-editor-scroll">
                <div className="p-2 space-y-2">
                  {versions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">No history yet</p>
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div key={version._id} className="p-2.5 rounded border border-border bg-muted/20 hover:bg-muted/40 transition-colors group">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium line-clamp-1">{version.message}</span>
                          <Badge variant="outline" className="text-[9px] h-4 leading-none">{new Date(version.createdAt).toLocaleDateString()}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Button
                            type="button"
                            variant={confirmRestoreId === version._id ? "destructive" : "ghost"}
                            size="sm"
                            className={`h-5 px-1.5 text-[10px] transition-opacity ${confirmRestoreId === version._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            onClick={(e) => handleRestoreVersion(version, e)}
                          >
                            {confirmRestoreId === version._id ? "Confirm?" : "Restore"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Neo4j References Panel - Small Left Sidebar */}
          {isReferencePanelOpen && (
            <div className="w-64 border-r border-border bg-card/95 flex flex-col">
              <div className="h-10 border-b border-border flex items-center justify-between px-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-semibold">Neo4j References</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsReferencePanelOpen(false)}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto ai-editor-scroll">
                <div className="p-3 space-y-3">
                  {selectedProblem ? (
                    <>
                      {/* Current Issue Evidence */}
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-2">
                          Evidence for Issue
                        </p>
                        <p className="text-xs text-foreground mb-2">{selectedProblem.title}</p>

                        {/* Entity References */}
                        {selectedProblem.relatedEntities?.length > 0 && (
                          <div className="space-y-1.5">
                            {selectedProblem.relatedEntities.map((entity, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-background/50">
                                <Users className="w-3 h-3 text-purple-400" />
                                <span className="text-[10px]">{entity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Graph Relationships */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Graph Connections
                        </p>

                        <div className="p-2 rounded border border-border bg-muted/20">
                          <div className="flex items-center gap-2 text-[10px]">
                            <Network className="w-3 h-3 text-emerald-500" />
                            <span className="text-muted-foreground">Source:</span>
                            <span className="font-medium">{selectedProblem.source}</span>
                          </div>
                        </div>

                        <div className="p-2 rounded border border-border bg-muted/20">
                          <div className="flex items-center gap-2 text-[10px]">
                            <Link2 className="w-3 h-3 text-amber-500" />
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium capitalize">{selectedProblem.category}</span>
                          </div>
                        </div>

                        {selectedProblem.line && (
                          <div className="p-2 rounded border border-border bg-muted/20">
                            <div className="flex items-center gap-2 text-[10px]">
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">Line {selectedProblem.line}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Select a problem to see Neo4j evidence
                      </p>
                    </div>
                  )}

                  {/* Knowledge Graph Entities */}
                  {neo4jReferences.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Knowledge Graph
                      </p>
                      {neo4jReferences.slice(0, 5).map((ref, idx) => (
                        <div key={idx} className="p-2 rounded border border-border/50 bg-card/50">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                              <Network className="w-3 h-3 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium truncate">{ref.name || ref.type}</p>
                              <p className="text-[9px] text-muted-foreground">{ref.entityType || ref.source}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Script Editor with Word Document Style */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Editor Header - Word-like toolbar */}
                <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 gap-3 shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate min-w-0 max-w-[300px]">{workflow?.name || 'Untitled Script'}</span>
                  {isFocusMode && <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 gap-1"><Focus className="w-3 h-3" /> Zen Mode</Badge>}
                  <div className="h-5 w-px bg-border mx-2" />

                  {/* Focus Mode Toggle */}
                  <div className="flex items-center gap-2 mr-2 shrink-0">
                    <Switch
                      id="focus-mode"
                      checked={isFocusMode}
                      onCheckedChange={toggleFocusMode}
                    />
                    <label htmlFor="focus-mode" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                      Focus Mode
                    </label>
                  </div>

                  {!isFocusMode && (
                    <>
                      <div className="h-5 w-px bg-border mx-2" />

                      {/* Edit indicator */}
                      {isEditing && (
                        <Badge className="bg-blue-500/20 text-blue-500 border-0 text-[10px]">
                          <Pencil className="w-3 h-3 mr-1" />
                          Editing
                        </Badge>
                      )}

                      {/* Issue Highlights Toggle */}
                      <Button
                        variant={showIssueHighlights ? "default" : "ghost"}
                        size="sm"
                        className={`h-7 text-xs gap-1.5 ${showIssueHighlights ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : ''}`}
                        onClick={() => setShowIssueHighlights(!showIssueHighlights)}
                      >
                        {showIssueHighlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {showIssueHighlights ? 'Issues Visible' : 'Issues Hidden'}
                      </Button>
                    </>
                  )}

                  {/* Share Button (Google Docs Style) */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 ml-2 bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20 shrink-0"
                    onClick={() => setIsShareDialogOpen(true)}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>

                  {/* Active Collaborators */}
                  <div className="flex items-center ml-4 shrink-0">
                    <div className="flex -space-x-1.5">
                      {/* Current User */}
                      <div
                        className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] text-white font-bold z-10"
                        style={{ backgroundColor: currentUser.color }}
                        title={`${currentUser.name} (You)`}
                      >
                        {currentUser.name[0]}
                      </div>
                      {/* Other Users */}
                      {Object.values(collaborators).map(c => (
                        <div
                          key={c.userId}
                          className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] text-white font-bold"
                          style={{ backgroundColor: c.color }}
                          title={c.userName}
                        >
                          {c.userName[0]}
                        </div>
                      ))}
                    </div>
                    {Object.keys(collaborators).length > 0 && (
                      <span className="ml-2 text-[10px] text-muted-foreground">{Object.keys(collaborators).length} online</span>
                    )}
                  </div>

                  <div className="flex-1" />

                  {/* Stats */}
                  {!isFocusMode && (
                    <div className="flex items-center gap-3 text-xs">
                      {pendingProblems.length > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-500 border-0">
                          {pendingProblems.length} pending changes
                        </Badge>
                      )}
                      {acceptedChanges.length > 0 && (
                        <Badge className="bg-emerald-500/20 text-emerald-500 border-0">
                          {acceptedChanges.length} accepted
                        </Badge>
                      )}
                      {rejectedChanges.length > 0 && (
                        <Badge className="bg-red-500/20 text-red-500 border-0">
                          {rejectedChanges.length} rejected
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Word Document Style Editor */}
                <div ref={editorScrollRef} className="flex-1 overflow-y-auto ai-editor-scroll word-document">
                  <div className="script-page">
                    {/* Script Content */}
                    {scriptLines.map((line, idx) => {
                      const isSelected = selectedProblem?.line === line.number;
                      const lineCollaborators = Object.values(collaborators).filter(c => c.line === line.number && c.userId !== currentUser.id);

                      return (
                        <div
                          key={idx}
                          ref={(el) => { lineRefs.current[line.number] = el; }}
                          className={`script-line ${line.type} relative group`}
                          style={{
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                          }}
                        >
                          {/* Remote Cursors */}
                          {lineCollaborators.map(user => (
                            <div key={user.userId} className="absolute left-0 top-0 bottom-0 pointer-events-none z-10">
                              <div
                                className="remote-cursor-caret animation-pulse"
                                style={{ backgroundColor: user.color, left: `${(user.offset || 0) * 8}px` }}
                              />
                              <div
                                className="remote-cursor-flag shadow-sm"
                                style={{ backgroundColor: user.color, left: `${(user.offset || 0) * 8}px` }}
                              >
                                {user.name}
                              </div>
                            </div>
                          ))}

                          {/* Line number (subtle, on hover) */}
                          <span className="absolute left-[-40px] text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            {line.number}
                          </span>

                          {/* Line content */}
                          {line.hasProblem && showIssueHighlights ? (
                            <span
                              className="issue-highlight cursor-pointer"
                              onClick={() => handleProblemClick(line.problem)}
                            >
                              {line.content || '\u00A0'}
                              <span className="absolute right-[-30px]">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              </span>
                            </span>
                          ) : line.acceptedChange ? (
                            <div className="relative py-1 px-2 -mx-2 rounded bg-emerald-500/10 border-l-4 border-emerald-500">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {line.content || '\u00A0'}
                              </span>
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded">
                                <CheckCircle className="w-3 h-3" />
                                accepted
                              </span>
                            </div>
                          ) : line.rejectedChange ? (
                            <div className="relative py-1 px-2 -mx-2 rounded bg-muted/30 border-l-4 border-muted-foreground/30">
                              <span className="text-foreground">
                                {line.content || '\u00A0'}
                              </span>
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                <XCircle className="w-3 h-3" />
                                kept original
                              </span>
                            </div>
                          ) : (
                            /* Editable line - like Google Docs */
                            <span
                              ref={(el) => { editableRefs.current[line.number] = el; }}
                              contentEditable
                              suppressContentEditableWarning
                              className={`outline-none min-w-[20px] inline-block ${line.hasProblem ? 'cursor-pointer' : ''} focus:bg-blue-500/10 focus:ring-1 focus:ring-blue-500/30 rounded px-1 -mx-1`}
                              onBlur={(e) => handleEditableBlur(line.number, e)}
                              onInput={(e) => {
                                if (socket) {
                                  const docId = workflow?.id || workflow?._id || 'demo-doc';
                                  socket.emit('send-changes', {
                                    documentId: docId,
                                    lineId: line.number,
                                    content: e.currentTarget.innerText,
                                    senderId: currentUser.id
                                  });
                                }
                              }}
                              onKeyUp={(e) => {
                                if (socket) {
                                  // Clear existing cursor debounce timer
                                  if (cursorDebounceRef.current) {
                                    clearTimeout(cursorDebounceRef.current);
                                  }

                                  // Debounce cursor updates to 500ms
                                  cursorDebounceRef.current = setTimeout(() => {
                                    const sel = window.getSelection();
                                    const offset = sel.focusOffset;
                                    const docId = workflow?.id || workflow?._id || 'demo-doc';
                                    socket.emit('cursor-move', {
                                      documentId: docId,
                                      userId: currentUser.id,
                                      userName: currentUser.name,
                                      color: currentUser.color,
                                      line: line.number,
                                      offset: offset
                                    });
                                  }, 500);
                                }
                              }}
                              onClick={(e) => {
                                if (socket) {
                                  // Clear existing cursor debounce timer
                                  if (cursorDebounceRef.current) {
                                    clearTimeout(cursorDebounceRef.current);
                                  }

                                  // Debounce cursor updates to 300ms for clicks (faster than keyup)
                                  cursorDebounceRef.current = setTimeout(() => {
                                    const sel = window.getSelection();
                                    const offset = sel.focusOffset;
                                    const docId = workflow?.id || workflow?._id || 'demo-doc';
                                    socket.emit('cursor-move', {
                                      documentId: docId,
                                      userId: currentUser.id,
                                      userName: currentUser.name,
                                      color: currentUser.color,
                                      line: line.number,
                                      offset: offset
                                    });
                                  }, 300);
                                }
                              }}
                              onKeyDown={(e) => handleEditableKeyDown(line.number, e)}
                              onFocus={() => setIsEditing(true)}
                            >
                              {line.content || '\u00A0'}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {scriptLines.length === 0 && (
                      <div className="py-20 text-center text-muted-foreground">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No Script Content</p>
                        <p className="text-sm mt-2">Run the Story Intelligence agent to analyze your script.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Panel - Problems */}
            {isBottomPanelOpen && !isFocusMode && (
              <div className="flex flex-col border-t border-border bg-card/95 relative" style={{ height: bottomPanelHeight }}>
                {/* Resize Handle */}
                <div
                  className="absolute top-[-4px] left-0 right-0 h-2 cursor-row-resize hover:bg-emerald-500/50 z-50 transition-colors opacity-0 hover:opacity-100"
                  onMouseDown={handleDragBottomStart}
                />
                <div className="h-9 border-b border-border flex items-center justify-between px-2 bg-muted/30">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                    <TabsList className="h-full bg-transparent gap-1 p-0">
                      <TabsTrigger
                        value="problems"
                        className="h-full px-3 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                        Problems
                        {pendingProblems.length > 0 && (
                          <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-red-500/20 text-red-500 border-0">
                            {pendingProblems.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="output"
                        className="h-full px-3 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none"
                      >
                        <Terminal className="w-3.5 h-3.5 mr-1.5" />
                        Output
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        {errorCount} errors
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        {warningCount} warnings
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-[calc(100%-36px)] overflow-y-auto ai-editor-scroll">
                  {activeTab === 'problems' ? (
                    <div className="relative flex flex-col min-h-full">
                      {pendingProblems.length > 0 && (
                        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur p-2 flex items-center justify-between border-b border-border shadow-sm shrink-0">
                          <div className="flex items-center gap-2 pl-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-semibold text-foreground">
                              {pendingProblems.length} Suggested Fixes
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleFixAllIssues}
                            disabled={isProcessing}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm transition-all hover:scale-105"
                          >
                            {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
                            Fix All
                          </Button>
                        </div>
                      )}
                      <div className="divide-y divide-border/50 flex-1">
                        {pendingProblems.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                            <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                            No problems detected
                          </div>
                        ) : (
                          pendingProblems.map(problem => {
                            const typeConfig = getTypeStyles(problem.type);
                            const Icon = typeConfig.icon;

                            return (
                              <div
                                key={problem.id}
                                onClick={() => handleProblemClick(problem)}
                                className={`flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors ${selectedProblem?.id === problem.id ? 'bg-muted/70 border-l-2 border-emerald-500' : ''
                                  }`}
                              >
                                <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: typeConfig.color }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">{problem.title}</span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-4 px-1"
                                      style={{ borderColor: `${typeConfig.color}40`, color: typeConfig.color }}
                                    >
                                      {problem.source}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{problem.message}</p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                                  {problem.line && <span className="font-mono">Ln {problem.line}</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 font-mono text-xs text-muted-foreground">
                      <p className="text-emerald-500">[AI Script Editor]</p>
                      <p>Analyzed {nodes?.length || 0} agents.</p>
                      <p>Found {problems.length} potential issues.</p>
                      <p>Neo4j references loaded: {neo4jReferences.length}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI Assistant with Solution View */}
          {!isRightPanelOpen && (
            <div className={`w-12 border-l border-border bg-background flex flex-col items-center py-4 gap-4 z-10 shrink-0 ${isFocusMode ? 'hidden' : ''}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-muted/50 hover:bg-emerald-500/10 hover:text-emerald-500"
                onClick={() => setIsRightPanelOpen(true)}
                title="Open AI Assistant"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="h-px w-6 bg-border" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Chat History">
                <History className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <div
                className="text-xs font-semibold text-muted-foreground tracking-widest uppercase opacity-50 select-none pb-4 whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
              >
                AI Assistant
              </div>
            </div>
          )}

          {isRightPanelOpen && (
            <div className="border-l border-border bg-card/95 flex flex-col relative shrink-0" style={{ width: rightPanelWidth }}>
              {/* Resize Handle */}
              <div
                className="absolute left-[-4px] top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/50 z-50 transition-colors opacity-0 hover:opacity-100 flex items-center justify-center group"
                onMouseDown={handleDragRightStart}
              />

              <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setChatMessages([])} title="Clear Chat">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setIsRightPanelOpen(false)} title="Collapse Sidepanel">
                    <PanelRightClose className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto ai-editor-scroll">
                <div className="p-4 space-y-4">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="space-y-2">
                      <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-500/20' : msg.role === 'system' ? 'bg-muted' : 'bg-purple-500/20'
                          }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-emerald-500" /> :
                            msg.role === 'system' ? <Info className="w-4 h-4 text-muted-foreground" /> :
                              <Bot className="w-4 h-4 text-purple-500" />}
                        </div>
                        <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block rounded-lg px-3 py-2 text-sm max-w-[90%] ${msg.role === 'user' ? 'bg-emerald-500 text-white' :
                            msg.role === 'system' ? 'bg-muted text-muted-foreground text-xs' : 'bg-muted/70'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      </div>

                      {/* Solution Card - Enhanced IDE-style */}
                      {msg.problem && !msg.problem.resolved && (
                        <div className="ml-10 rounded-lg border border-border bg-card overflow-hidden">
                          {/* Solution Header */}
                          <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs font-semibold">Suggested Fix</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] h-5">
                              Line {msg.problem.line}
                            </Badge>
                          </div>

                          {/* Issue Description */}
                          <div className="px-3 py-2 bg-amber-500/5 border-b border-border">
                            <p className="text-xs text-muted-foreground mb-1">Issue:</p>
                            <p className="text-xs text-foreground">{msg.problem.message}</p>
                          </div>

                          {/* Diff View - Code Review Style */}
                          <div className="p-3 space-y-2">
                            {/* Original Text (to be removed) */}
                            {msg.problem.originalText && (
                              <div className="rounded border border-red-500/20 overflow-hidden">
                                <div className="px-2 py-1 bg-red-500/10 flex items-center gap-2 text-red-500">
                                  <Minus className="w-3 h-3" />
                                  <span className="text-[10px] font-semibold uppercase">Current</span>
                                </div>
                                <div className="px-3 py-2 bg-red-500/5 font-mono text-xs text-red-400">
                                  <span className="line-through">{msg.problem.originalText}</span>
                                </div>
                              </div>
                            )}

                            {/* Suggested Text (to be added) */}
                            {msg.problem.suggestedFix && (
                              <div className="rounded border border-emerald-500/20 overflow-hidden">
                                <div className="px-2 py-1 bg-emerald-500/10 flex items-center gap-2 text-emerald-500">
                                  <Plus className="w-3 h-3" />
                                  <span className="text-[10px] font-semibold uppercase">Suggested</span>
                                </div>
                                <div className="px-3 py-2 bg-emerald-500/5 font-mono text-xs text-emerald-400">
                                  {msg.problem.suggestedFix}
                                </div>
                              </div>
                            )}

                            {/* Explanation */}
                            {msg.problem.explanation && (
                              <div className="mt-2 p-2 rounded bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Info className="w-3 h-3 text-blue-500" />
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Why this change?</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">{msg.problem.explanation}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons - IDE Style */}
                          <div className="px-3 py-2 bg-muted/30 border-t border-border flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 flex-1 gap-1.5"
                              onClick={() => handleAcceptFix(msg.problem)}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept Change
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs flex-1 gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10"
                              onClick={() => handleRejectFix(msg.problem)}
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.problem.suggestedFix || '');
                                toast.success('Copied to clipboard');
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Batch Actions Summary */}
                      {msg.isBatchAction && !msg.batchResolved && msg.batchProblems && (
                        <div className="ml-10 rounded-lg border border-indigo-500/30 bg-indigo-500/5 overflow-hidden">
                          <div className="px-3 py-2 border-b border-indigo-500/10 flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-500">Batch Actions</span>
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-500 text-[9px]">{msg.batchProblems.length} proposals</Badge>
                          </div>
                          <div className="p-3">
                            <Button
                              className="w-full text-xs gap-2 bg-indigo-500 hover:bg-indigo-600"
                              onClick={() => handleAcceptAll(msg.batchProblems, msg.resolveAllPending)}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept All Changes
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Resolved state indicator */}
                      {(msg.problem?.resolved || msg.batchResolved) && (
                        <div className="ml-10 p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex items-center gap-2">
                            {(msg.problem?.resolution === 'accepted' || msg.batchResolved) ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-emerald-500 font-medium">
                                  {msg.batchResolved ? 'All changes accepted' : 'Change applied to document'}
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs text-red-500 font-medium">Change rejected</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="bg-muted/70 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-border">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about issues..."
                    className="min-h-[50px] max-h-[100px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 shrink-0"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Share2 className="w-4 h-4 text-blue-600" />
              </div>
              Share to Web
            </DialogTitle>
            <DialogDescription>
              Publish and share this link with others to collaborate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                id="share-link"
                value={shareUrl || "Generating link..."}
                readOnly
                className="font-mono text-xs h-9 bg-muted/30"
              />
              <Button size="sm" className="shrink-0 h-9" onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied!');
                setIsShareDialogOpen(false);
              }}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy
              </Button>
            </div>

            <div className="rounded border border-border p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-sm"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">You ({currentUser.name})</span>
                    <span className="text-[10px] text-muted-foreground">Session Owner</span>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-600 border border-green-500/20 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
