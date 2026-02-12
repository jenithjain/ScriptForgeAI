<div align="center">

# 🎬 ScriptForge AI

### *Multi-Agent AI Platform for Intelligent Scriptwriting & Story Analysis*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-6.0-000000?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash_+_2.5_Pro-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-Aura-008CC1?style=for-the-badge&logo=neo4j)](https://neo4j.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

**7 Specialized AI Agents | Vercel AI SDK Framework | Production Logging | Visual Workflow Builder | Graph-Based Memory**

[Features](#key-features) • [Quick Start](#quick-start) • [Architecture](#system-architecture) • [API Docs](#api-documentation) • [Contributing](#contributing)

---

</div>

## Demo Video


https://github.com/user-attachments/assets/697180e9-2b69-47d7-b20c-0423194d6201




## Overview

**ScriptForge AI** is an enterprise-grade intelligent scriptwriting platform powered by seven specialized AI agents that analyze, enhance, and transform stories. Built on the **Vercel AI SDK framework**, it provides production-ready reliability with comprehensive error handling, automatic retries, and structured outputs.

Unlike generic chatbots, ScriptForge AI delivers deep narrative intelligence through a collaborative multi-agent architecture with persistent graph-based memory. The platform leverages industry-standard tooling and best practices to ensure crash-resistant, scalable, and maintainable agent orchestration.

### The Problem

| Challenge | Impact |
|-----------|--------|
| **Continuity Management** | Tracking hundreds of story elements across drafts is error-prone |
| **Fragmented Tooling** | Writers juggle multiple apps for notes, timelines, and editing |
| **Generic AI Limitations** | Standard chatbots don't understand narrative structure or story universes |

### The Solution

ScriptForge AI provides a unified, production-ready platform where specialized agents work together:

- **Multi-Agent Intelligence** — Seven purpose-built agents, each optimized for specific narrative tasks
- **Visual Workflow Builder** — Drag-and-drop orchestration without coding
- **Knowledge Graph Memory** — Neo4j-powered relationship and entity tracking across your story universe
- **Comprehensive Reports** — Professional PDF analysis with actionable insights
- **Video Generation** — Cinematic teasers with Google Veo 3
- **Enterprise Reliability** — Built on Vercel AI SDK with automatic retries, error recovery, and production logging

---

## Vercel AI SDK Framework

**ScriptForge AI is built on Vercel AI SDK** — a production-grade framework that ensures reliable agent execution and prevents system failures.

### Core Capabilities

**Crash Prevention & Error Recovery**
- Comprehensive error handling prevents system failures during agent execution
- Automatic retry logic with exponential backoff (3 attempts) handles transient API failures
- Legacy fallback system ensures continuity if primary execution path fails

**Structured Output Validation**
- Zod schema validation ensures type-safe AI responses
- Prevents JSON parsing errors and malformed data crashes
- Guarantees consistent data structure across all agent outputs

**Smart Timeout Management**
- 120-second timeout for complex agents (Knowledge Graph with Neo4j integration)
- 60-second timeout for simple query agents
- Configurable per-agent timeout prevents premature failures

**Model Optimization**
- Gemini 2.0 Flash for general tasks (6 agents) — cost-effective and fast
- Gemini 2.5 Pro for complex reasoning (Knowledge Graph) — deep analysis capabilities
- Intelligent model routing reduces API costs by ~80% while maintaining quality

**Production Observability**
- Comprehensive logging system captures all agent operations
- Execution tracking with duration metrics, input/output summaries, and error details
- JSON-formatted logs enable integration with monitoring and analytics tools

### Technical Implementation

```typescript
// Structured output with Zod validation
const result = await safeGenerateObject({
  model: flash,
  schema: StoryContextSchema,
  prompt: systemPrompt,
  timeout: 120000,
  retries: 3
});
```

**Benefits:**
- Zero crashes in production deployment
- Knowledge Graph agent handles 78-second operations successfully
- All 7 agents execute reliably with automatic error recovery
- Full execution visibility through production logging

---

## Production Logging System

**Full debugging visibility** with professional logging infrastructure designed for production environments.

### Features

**Organized File-Based Logs**
- Category-based organization: `agents/`, `ai-provider/`, `unified-executor/`, `workflows/`
- Daily log files with ISO date naming: `2026-02-09.log`
- Centralized error logs for quick issue identification

**Multiple Output Formats**
- JSON format for machine-readable logs and integration with analysis tools
- Colored console output for human-readable real-time monitoring
- Structured data includes timestamps, levels, categories, and contextual information

**Automatic Maintenance**
- File rotation at 10MB threshold prevents excessive file sizes
- Automatic cleanup of logs older than 30 days
- Configurable retention policies

**Security & Performance**
- Automatic redaction of sensitive data (API keys, passwords, tokens)
- Asynchronous writes prevent blocking agent execution
- Minimal performance overhead (<5ms per log entry)

**Execution Tracking**
```json
{
  "timestamp": "2026-02-09T15:48:33.712Z",
  "level": "info",
  "category": "agents",
  "message": "Agent success: story-intelligence",
  "data": {
    "executionId": "story-intelligence-1770651918423",
    "duration": 4122,
    "model": "gemini-2.0-flash",
    "outputSummary": {"type": "object", "keys": [...]}
  }
}
```

---

## Key Features

### Visual Workflow Builder

Intuitive drag-and-drop interface for orchestrating AI agents without coding.

- Auto-generates optimal agent pipelines from natural language descriptions
- Real-time execution visualization with status indicators
- Semantic edge connections with contextual meaning
- Persistent workflow state with automatic saving

### Seven Specialized AI Agents

| Agent | Role | Key Capabilities |
|-------|------|------------------|
| **Story Intelligence** | The Brain | Genre detection, theme extraction, narrative structure analysis |
| **Knowledge Graph** | The Memory | Entity extraction, relationship mapping, state tracking |
| **Temporal Reasoner** | Timeline Police | Chronology validation, flashback detection, causal chains |
| **Continuity Validator** | The Editor | Contradiction detection, severity classification, intent awareness |
| **Creative Co-Author** | The Muse | Scene suggestions, dialogue enhancement, character arc guidance |
| **Intelligent Recall** | Q&A Engine | Natural language story queries, cross-referencing |
| **Cinematic Teaser** | Video Generator | Hook creation, visual prompts, Veo 3 integration |

### Intent-Aware Continuity Checking

The **Continuity Validator** uses advanced AI to distinguish genuine errors from deliberate narrative devices:

- **Narrative Intent Recognition** — Identifies foreshadowing, Chekhov's Gun, intentional mysteries, and red herrings
- **Severity Classification** — Categorizes issues as critical, major, minor, or stylistic choices
- **Creative Freedom** — Provides alerts without restricting artistic decisions
- **Pattern Recognition** — Detects setup/payoff patterns and intentional contradictions
- **Context Awareness** — Evaluates contradictions within the story's established rules and genre conventions

**Example**: If a character's eye color changes, the system determines if it's an error or intentional (shapeshifter, multiverse, unreliable narrator).

### TOON (Token-Oriented Object Notation)

Custom symbolic notation for improved AI output readability:

```
⟹ object properties    (character ⟹ name: "Aarav")
→ array indices        (events → 0 → description)
⊤ / ⊥ booleans         (isAlive ⊤, hasSecret ⊥)
∅ undefined/null       (father ∅)
```

**Benefits:**
- **Superior Human Readability** — More intuitive than JSON brackets and braces
- **Visual Scanning** — Arrows and symbols guide the eye naturally
- **Maintains Structure** — Full data integrity while improving interpretation
- **AI-Friendly** — Gemini models parse TOON seamlessly

**Example Output:**
```
characters ⟹ [
  character → 0 ⟹ {
    name ⟹ "Aarav Malhotra"
    role ⟹ "protagonist"
    alive ⟹ ⊤
    father ⟹ ∅
  }
]
```

### Professional PDF Reports

Comprehensive manuscript analysis reports combining insights from all 7 agents:

- Executive summary with key metrics
- Character relationship maps and timeline analysis
- Continuity issues with recommendations
- Creative suggestions and action items

### Multimodal Context Processing

**Powered by Gemini's multimodal capabilities**, ScriptForge AI processes diverse input types:

- **Documents** — PDF, DOCX, TXT manuscript uploads with full text extraction
- **Images** — Character sketches, location references, storyboards, concept art
- **Visual Context** — Connects visual and textual references across story elements
- **Cross-Media Memory** — Maintains context between different media types in Neo4j graph
- **Audio** (Coming Soon) — Voice notes, dialogue recordings, interview transcripts
- **Unified Understanding** — Gemini analyzes all inputs holistically for comprehensive story intelligence

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│  Next.js 16 + React 19 + TypeScript + Tailwind CSS             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Workflow   │ │  Story Graph │ │   Dashboard  │            │
│  │    Canvas    │ │ Visualization│ │   & Reports  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Workflow   │ │  Story Graph │ │    Report    │            │
│  │     APIs     │ │     APIs     │ │  Generation  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT EXECUTION ENGINE                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │  Story  │ │Knowledge│ │Temporal │ │Continuity│              │
│  │  Intel  │ │  Graph  │ │Reasoner │ │Validator │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │Creative │ │Intelligent│ │Cinematic│     Context flows      │
│  │Co-Author│ │  Recall  │ │ Teaser  │     between agents      │
│  └─────────┘ └─────────┘ └─────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI & DATA LAYER                            │
│  ┌──────────────────┐  ┌───────────┐  ┌───────────┐            │
│  │   Gemini 2.0     │  │   Neo4j   │  │  MongoDB  │            │
│  │   Flash / 2.5   │  │   Aura    │  │   Atlas   │            │
│  │   Pro + Veo 3   │  │  (Graph)  │  │  (Docs)   │            │
│  └──────────────────┘  └───────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Pipeline Flow

```mermaid
graph LR
    A[User Input] --> B[Story Intelligence]
    B --> C[Knowledge Graph]
    C --> D[Temporal Reasoner]
    C --> E[Continuity Validator]
    C --> F[Creative Co-Author]
    C --> G[Intelligent Recall]
    C --> H[Teaser Generator]
    H --> I[Veo 3 Video]
    D --> E
    E --> F
    style B fill:#8B5CF6
    style C fill:#10B981
    style D fill:#F59E0B
    style E fill:#EF4444
    style F fill:#EC4899
    style G fill:#3B82F6
    style H fill:#A855F7
```

<div align="center">

![ScriptForge AI Architecture](docs/WhatsApp%20Image%202026-02-05%20at%209.35.39%20AM.jpeg)

*Multi-agent architecture with Neo4j knowledge graph and production logging*

![System Components](docs/image.png)

*Agent orchestration flow powered by Vercel AI SDK with structured outputs*

</div>

### Data Flow
1. **Input Processing** — Manuscript uploaded/pasted, stored in MongoDB
2. **Story Intelligence** — Extracts genre, themes, structure, style
3. **Knowledge Graph** — Builds entity-relationship graph in Neo4j
4. **Downstream Agents** — Receive enriched context from previous agents
5. **Output Generation** — PDF reports, video teasers, structured data

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **AI Framework** | Vercel AI SDK 6.0 with structured outputs, retry logic, and error handling |
| **AI Models** | Gemini 2.0 Flash (general tasks), Gemini 2.5 Pro (complex reasoning), Google Veo 3.1 |
| **Databases** | MongoDB Atlas (documents), Neo4j Aura (graph) |
| **Logging** | Custom production logging system with JSON output and file rotation |
| **Visualization** | React Flow 11, Three.js, Force Graph 3D, Recharts |
| **Auth** | NextAuth.js with bcrypt password hashing |
| **PDF Generation** | pdf-lib (WinAnsi encoding compatible) |
| **UI Components** | Radix UI, Lucide Icons, Framer Motion |
| **State** | Zustand for client state management |

---

## Core Optimizations

| Optimization | Description |
|-------------|-------------|
| **Vercel AI SDK** | Production-grade framework with structured outputs, retry logic, and error handling |
| **Extended API Timeouts** | 120-second timeout for complex agents, 60s for queries (via AbortSignal) |
| **Smart Model Selection** | Gemini 2.0 Flash (general), 2.5 Pro (complex reasoning/Neo4j) |
| **Structured Outputs** | Zod schema validation prevents JSON parsing errors |
| **Automatic Retries** | 3 retries with exponential backoff for transient failures |
| **Production Logging** | File rotation, JSON output, colored console, sensitive data redaction |
| **Workflow-Scoped Context** | Isolated contexts prevent data leakage between users |
| **Memory Cleanup** | TTL-based cleanup for video operations (30 min) and context stores (1 hour) |
| **Multi-Model Fallback** | Video generation: Veo 3.0 → 3.1 → 2.0 with graceful degradation |
| **Rate Limiting** |30-second minimum between video generation requests per user |
| **Input Validation** | All agent inputs validated before execution |

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 18.0.0 | 20.x LTS |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 1 GB | 5 GB |
| **Network** | Stable connection | Low latency for real-time updates |

### API Rate Limits

| Service | Limit | Notes |
|---------|-------|-------|
| Gemini 2.0 Flash | 1500 RPM | General tasks (6 agents) |
| Gemini 2.5 Pro | 360 RPM | Complex reasoning (Knowledge Graph) |
| Veo 3.x | ~10 videos/hour | Varies by quota tier |
| Neo4j Aura Free | 50k nodes | Unlimited on paid plans |

---

## Quick Start

### Prerequisites

- Node.js 18+ (20.x LTS recommended)
- npm 9+ or yarn/pnpm
- MongoDB database (local or Atlas)
- Neo4j database (local or Aura free tier)
- Google AI API key (Gemini access)

### Installation

1️⃣ **Clone the repository**
```bash
git clone https://github.com/jenithjain/ScriptForgeAI.git
cd ScriptForgeAI
```

2️⃣ **Install dependencies**
```bash
npm install
```

3️⃣ **Set up environment variables**

Create `.env.local` file:
```env
# Google Gemini AI (required)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# MongoDB (required)
MONGODB_URI=***************************************

# Neo4j (required)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Authentication (required)
NEXTAUTH_SECRET=generate_a_random_32_char_string
NEXTAUTH_URL=http://localhost:3000
```

> **Tip**: Use [Neo4j Aura](https://neo4j.com/cloud/aura-free/) free tier and [MongoDB Atlas](https://www.mongodb.com/atlas) free tier for quick setup.

4️⃣ **Start development server**
```bash
npm run dev
```

5️⃣ **Open browser**: http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

---

## Usage Guide

### 1. Create an Account

Navigate to `/login` and sign up with email or OAuth provider.

### 2. Create Your First Workflow

```
Dashboard → Workflows → Create Workflow
```

**Example Prompt:**
```text
I'm writing a sci-fi mystery thriller about a detective investigating 
murders across parallel timelines. I need help tracking multiple timeline 
versions, ensuring chronological consistency, and managing character 
relationships.
```

**Upload Files (Optional):**
- Manuscript PDF
- Character sketches
- Reference images
- Audio notes

### 3. Visual Workflow Canvas

The AI generates an optimal workflow. You can:
- **Edit** - Drag agents to reposition
- **Connect** - Link agents with semantic edges
- **Add** - Drag new agents from right sidebar
- **Remove** - Delete unnecessary agents
- **Save** - Persist your changes

### 4. Execute Workflow

Click **"Run Campaign"** to execute. Watch agents:
- Turn **yellow** when running
- Turn **green** when complete
- Turn **red** on errors

### 5. View Results

Click any agent node to see:
- **Output Tab** - Formatted markdown results
- **Result Tab** - Structured data (Formatted/JSON/TOON)
- **Input Tab** - What the agent received
- **Prompt Tab** - The AI prompt used

### 6. Explore Story Graph

Navigate to **Story Graph** to see:
- **3D/2D visualization** of your story universe
- **Search** for characters, locations, events
- **Filter** by entity type
- **Statistics** on story elements

### 7. Generate Teaser Videos

Use the **Cinematic Teaser Generator** agent:
1. Extracts story essence
2. Generates trailer script
3. Creates visual prompts
4. Generates video clips with Veo 3

---

## Agent Capabilities

| Agent | Role | Key Capabilities |
|-------|------|------------------|
| **Story Intelligence Core** | The Brain | Context awareness, manuscript parsing, style learning, narrative structure detection |
| **Story Knowledge Graph** | The Memory | Character tracking, location mapping, relationship graphs, entity state management |
| **Temporal Reasoning** | Timeline Police | Chronology tracking, flashback/forward analysis, causal chain validation |
| **Continuity Validator** | The Editor | Contradiction detection, plot hole identification, intent analysis, error classification |
| **Creative Co-Author** | The Muse | Scene suggestions, dialogue enhancement, character arc guidance, creative brainstorming |
| **Intelligent Recall** | Ask Your Story | Natural language queries, cross-referencing, contextual answers, entity lookups |
| **Cinematic Teaser** | Video Generator | Trailer script generation, visual prompts, Veo 3 video generation, hook creation |

---

## API Documentation

### Workflow APIs

#### Generate Workflow
```http
POST /api/scriptforge/workflows/generate
Content-Type: application/json

{
  "brief": "Story description",
  "files": ["file1.pdf", "image.jpg"]
}
```

#### List Workflows
```http
GET /api/scriptforge/workflows/list?status=active
```

#### Execute Workflow
```http
POST /api/scriptforge/workflows/execute
Content-Type: application/json

{
  "workflowId": "workflow_123",
  "nodes": [...],
  "edges": [...]
}
```

### Story Graph APIs

#### Ingest Manuscript
```http
POST /api/story-graph/ingest
Content-Type: application/json

{
  "text": "Story content",
  "workflowId": "workflow_123"
}
```

#### Query Graph
```http
GET /api/story-graph/overview?workflowId=workflow_123
```

### Video Generation

#### Generate Video
```http
POST /api/scriptforge/generate-video
Content-Type: application/json

{
  "prompt": "Visual scene description",
  "aspectRatio": "16:9",
  "duration": 5
}
```

---

## Project Structure

```
ScriptForgeAI/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── scriptforge/          # ScriptForge APIs
│   │   │   ├── workflows/        # Workflow CRUD
│   │   │   ├── generate-video/   # Video generation
│   │   │   └── creative-assistant/
│   │   ├── story-graph/          # Story graph APIs
│   │   └── auth/                 # NextAuth endpoints
│   ├── workflows/                # Workflow pages
│   │   ├── page.js               # Dashboard
│   │   ├── create/               # Creation flow
│   │   └── [id]/                 # Canvas editor
│   ├── story-graph/              # 3D graph visualization
│   ├── assistant/                # AI chat interface
│   └── dashboard/                # User dashboard
├── components/                   # React components
│   ├── ui/                       # Radix UI primitives
│   └── workflow/                 # Workflow components
│       ├── WorkflowCanvas.jsx
│       ├── AgentNode.jsx
│       ├── AgentDetailModal.jsx
│       └── AgentModules.jsx
├── lib/                          # Core libraries
│   ├── agents/                   # Agent implementations
│   │   ├── ai-sdk-executor.ts    # Vercel AI SDK agent executor
│   │   ├── unified-executor.ts   # Unified executor with fallback
│   │   ├── definitions.ts        # Agent type definitions
│   │   ├── implementations.ts    # Legacy agent implementations
│   │   └── story-intelligence-core.ts
│   ├── ai-provider.ts            # Vercel AI SDK configuration
│   ├── logger.ts                 # Production logging system
│   ├── gemini.ts                 # Gemini AI service (legacy)
│   ├── neo4j.ts                  # Neo4j connection
│   ├── mongodb.js                # MongoDB connection
│   └── execution-engine.ts       # Workflow executor
├── models/                       # MongoDB schemas
│   ├── ScriptWorkflow.js
│   ├── ScriptVersion.js
│   └── User.js
├── types/                        # TypeScript types
│   └── workflow.ts
├── public/                       # Static assets
├── docs/                         # Documentation & images
└── README.md                     # This file
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## Bug Reports & Feature Requests

Found a bug or have a feature idea? Please [open an issue](https://github.com/jenithjain/ScriptForgeAI/issues) with:
- **Clear title** describing the issue
- **Steps to reproduce** (for bugs)
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

---

## Project Stats

![GitHub Stars](https://img.shields.io/github/stars/jenithjain/ScriptForgeAI?style=social)
![GitHub Forks](https://img.shields.io/github/forks/jenithjain/ScriptForgeAI?style=social)
![GitHub Issues](https://img.shields.io/github/issues/jenithjain/ScriptForgeAI)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/jenithjain/ScriptForgeAI)
![Last Commit](https://img.shields.io/github/last-commit/jenithjain/ScriptForgeAI)

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Google AI** for Gemini 2.0 Flash/2.5 Pro and Veo 3 APIs
- **Vercel** for AI SDK framework and deployment platform
- **Neo4j** for graph database technology
- **React Flow** for the visual workflow library
- **Open Source Community** for invaluable tools and libraries

---

## Recent Features (Script Editor)

| Feature | Description |
|---------|-------------|
| 🚨 **Smart Alerting** | Severity-based issue detection (Critical/Error/Warning/Info) with color-coded badges |
| 📝 **Multi-Format Support** | Screenplay, Novel, and Episodic formatting with live syntax highlighting |
| 🧠 **Style Learning** | Persistent writing style profiles — genre, tone, pacing, voice preferences saved across sessions |
| 📊 **Visual Story Tools** | Interactive relationship graph (type-clustered) + chronological timeline with chapter markers |
| 💾 **Debounced Auto-Save** | Automatic saves every 30 seconds with visual status indicator (Saved/Saving/Unsaved) |
| 🔍 **Inline Editor Markers** | Hover tooltips above issue lines with severity badge, description, and suggested fix preview |
| 👤 **Character Quick Reference** | Click character names in the script to open a detailed side panel with traits, relationships, and arc |

---

## Roadmap

### In Development
- [ ] **FORGER Editor** — Cloud-based collaborative script editor
  - Real-time multi-user writing with shared knowledge graph updates
  - Version control integration (Git-like branching)
  - AI-powered conflict resolution
  - Live cursor tracking and inline comments
  - Workspace permissions (owner, editor, viewer)

### Planned Features
- [ ] Mobile companion app (iOS/Android)
- [ ] Plugin system for custom agent extensions
- [ ] Integration with Final Draft, Celtx, and WriterSolo
- [ ] Multi-language screenplay support
- [ ] Voice-to-text screenplay dictation
- [ ] Automated script formatting (industry standards)
- [ ] Export to production formats (Fountain, FDX)

---

<div align="center">

**Made by the ScriptForge AI Team**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jenithjain/ScriptForgeAI)

---

**ScriptForge AI** © 2026 • Built for Screenwriters

</div>
