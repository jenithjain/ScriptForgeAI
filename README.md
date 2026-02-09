<div align="center">

# 🎬 ScriptForge AI

### *Multi-Agent AI Platform for Intelligent Scriptwriting & Story Analysis*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Pro-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-Aura-008CC1?style=for-the-badge&logo=neo4j)](https://neo4j.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

**7 Specialized AI Agents | Visual Workflow Builder | Graph-Based Story Memory | Video Generation**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Docs](#-api-reference) • [Contributing](#-contributing)

---

</div>

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Performance & Optimization](#-performance--optimization)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [AI Agents](#-ai-agents)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 Overview

**ScriptForge AI** is an intelligent scriptwriting platform powered by seven specialized AI agents that analyze, enhance, and transform stories. Unlike generic chatbots, it provides deep narrative intelligence through a collaborative multi-agent architecture with persistent graph-based memory.

### The Problem

| Challenge | Impact |
|-----------|--------|
| **Continuity Management** | Tracking hundreds of story elements across drafts is error-prone |
| **Fragmented Tooling** | Writers juggle multiple apps for notes, timelines, and editing |
| **Generic AI Limitations** | Standard chatbots don't understand narrative structure or story universes |

### The Solution

ScriptForge AI provides a unified platform where specialized agents work together:

- **🧠 Multi-Agent Intelligence** — Seven purpose-built agents, each optimized for specific tasks
- **🎨 Visual Workflow Builder** — Drag-and-drop orchestration without coding
- **🕸️ Knowledge Graph Memory** — Neo4j-powered relationship and entity tracking
- **📊 Comprehensive Reports** — Professional PDF analysis with actionable insights
- **🎬 Video Generation** — Cinematic teasers with Google Veo 3

---

## ✨ Key Features

### 🎨 Visual Workflow Builder
Intuitive drag-and-drop interface for orchestrating AI agents without coding.
- Auto-generates optimal agent pipelines from natural language descriptions
- Real-time execution visualization with status indicators
- Semantic edge connections with contextual meaning
- Persistent workflow state with automatic saving

### 🧠 Seven Specialized AI Agents

| Agent | Role | Key Capabilities |
|-------|------|------------------|
| **Story Intelligence** | The Brain | Genre detection, theme extraction, narrative structure analysis |
| **Knowledge Graph** | The Memory | Entity extraction, relationship mapping, state tracking |
| **Temporal Reasoner** | Timeline Police | Chronology validation, flashback detection, causal chains |
| **Continuity Validator** | The Editor | Contradiction detection, severity classification, intent awareness |
| **Creative Co-Author** | The Muse | Scene suggestions, dialogue enhancement, character arc guidance |
| **Intelligent Recall** | Q&A Engine | Natural language story queries, cross-referencing |
| **Cinematic Teaser** | Video Generator | Hook creation, visual prompts, Veo 3 integration |

### 🎭 Intent-Aware Continuity Checking
The **Continuity Validator** uses advanced AI to distinguish genuine errors from deliberate narrative devices:

- **🎯 Understands Narrative Intent** — Recognizes foreshadowing, Chekhov's Gun, intentional mysteries, and red herrings
- **📊 Severity Classification** — Categories issues as critical, major, minor, or stylistic choices
- **🎨 Creative Freedom** — Alerts without restricting artistic decisions
- **🔍 Pattern Recognition** — Identifies setup/payoff patterns and intentional contradictions
- **💡 Context-Aware** — Evaluates contradictions within the story's established rules and genre

**Example**: If a character's eye color changes, the system determines if it's an error or intentional (shapeshifter, multiverse, unreliable narrator).

### 📊 TOON (Token-Oriented Object Notation)
Custom symbolic notation for improved AI output readability:

```
⟹ object properties    (character ⟹ name: "Aarav")
→ array indices        (events → 0 → description)
⊤ / ⊥ booleans         (isAlive ⊤, hasSecret ⊥)
∅ undefined/null       (father ∅)
```

**Benefits:**
- 🎯 **Superior Human Readability** — More intuitive than JSON brackets and braces
- 🔍 **Visual Scanning** — Arrows and symbols guide the eye naturally
- 📦 **Maintains Structure** — Full data integrity while improving interpretation
- 🚀 **AI-Friendly** — Gemini models parse TOON seamlessly

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

### 📄 Professional PDF Reports
Comprehensive manuscript analysis reports combining insights from all 7 agents:
- Executive summary with key metrics
- Character relationship maps and timeline analysis
- Continuity issues with recommendations
- Creative suggestions and action items

### 🎥 Multimodal Context Processing
**Powered by Gemini's multimodal capabilities**, ScriptForge AI processes diverse input types:

- **📄 Documents** — PDF, DOCX, TXT manuscript uploads with full text extraction
- **🖼️ Images** — Character sketches, location references, storyboards, concept art
- **🎬 Visual Context** — Connects visual and textual references across story elements
- **🔗 Cross-Media Memory** — Maintains context between different media types in Neo4j graph
- **🎤 Audio** (Coming Soon) — Voice notes, dialogue recordings, interview transcripts
- **🧠 Unified Understanding** — Gemini analyzes all inputs holistically for comprehensive story intelligence

---

## 🏗️ System Architecture

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
│  │   Gemini 2.5     │  │   Neo4j   │  │  MongoDB  │            │
│  │   Flash / Pro    │  │   Aura    │  │   Atlas   │            │
│  │   + Veo 3.1      │  │  (Graph)  │  │  (Docs)   │            │
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

### Data Flow
1. **Input Processing** — Manuscript uploaded/pasted, stored in MongoDB
2. **Story Intelligence** — Extracts genre, themes, structure, style
3. **Knowledge Graph** — Builds entity-relationship graph in Neo4j
4. **Downstream Agents** — Receive enriched context from previous agents
5. **Output Generation** — PDF reports, video teasers, structured data

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **Visualization** | React Flow 11, Three.js, Force Graph 3D, Recharts |
| **AI Models** | Gemini 2.5 Flash, Gemini 2.5 Pro, Google Veo 3.1 |
| **Databases** | MongoDB Atlas (documents), Neo4j Aura (graph) |
| **Auth** | NextAuth.js with bcrypt password hashing |
| **PDF Generation** | pdf-lib (WinAnsi encoding compatible) |
| **UI Components** | Radix UI, Lucide Icons, Framer Motion |
| **State** | Zustand for client state management |

---

## ⚡ Performance & Optimization

### Recent Optimizations (February 2026)

#### 🚀 Gemini API Timeout Fix (Critical)
**Problem**: Gemini SDK was ignoring our 120-second timeout configuration, defaulting to 60 seconds and causing Knowledge Graph agent failures.

**Solution**: 
- ✅ Timeout now passed at **model creation level** via `getGenerativeModel()` second parameter
- ✅ All model getters (`getReasoningModel`, `getKnowledgeGraphModel`, etc.) accept timeout parameter
- ✅ Default increased from 60s to **120 seconds** (120000ms)
- ✅ Debug logging added for timeout verification
- ✅ Centralized model creation in `lib/gemini.ts`

**Impact**: Knowledge Graph agent now completes 61-second operations successfully without timeout errors.

### Core Optimizations

| Optimization | Description |
|-------------|-------------|
| **Extended API Timeouts** | 120-second timeout on all Gemini API calls (fixed at SDK level) |
| **Workflow-Scoped Context** | Isolated contexts prevent data leakage between users |
| **Memory Cleanup** | TTL-based cleanup for video operations (30 min) and context stores (1 hour) |
| **Exponential Backoff** | Automatic retry with backoff for transient API failures |
| **Multi-Model Fallback** | Video generation: Veo 3.0 → 3.1 → 2.0 with graceful degradation |
| **Rate Limiting** | 30-second minimum between video generation requests per user |
| **Input Validation** | All agent inputs validated before execution |
| **JSON Parsing Resilience** | Handles markdown code blocks, truncation, and malformed responses |

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
| Gemini 2.5 Flash | 1500 RPM | Shared across agents |
| Gemini 2.5 Pro | 360 RPM | Used for Knowledge Graph |
| Veo 3.x | ~10 videos/hour | Varies by quota tier |
| Neo4j Aura Free | 50k nodes | Unlimited on paid plans |

---

## 🚀 Quick Start

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
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scriptforge

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

## 📚 Usage Guide

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
- ✏️ **Edit** - Drag agents to reposition
- 🔗 **Connect** - Link agents with semantic edges
- ➕ **Add** - Drag new agents from right sidebar
- 🗑️ **Remove** - Delete unnecessary agents
- 💾 **Save** - Persist your changes

### 4. Execute Workflow

Click **"Run Campaign"** to execute. Watch agents:
- 🟡 Turn **yellow** when running
- 🟢 Turn **green** when complete
- 🔴 Turn **red** on errors

### 5. View Results

Click any agent node to see:
- **Output Tab** - Formatted markdown results
- **Result Tab** - Structured data (Formatted/JSON/TOON)
- **Input Tab** - What the agent received
- **Prompt Tab** - The AI prompt used

### 6. Explore Story Graph

Navigate to **Story Graph** to see:
- 🎭 **3D/2D visualization** of your story universe
- 🔍 **Search** for characters, locations, events
- 🎯 **Filter** by entity type
- 📊 **Statistics** on story elements

### 7. Generate Teaser Videos

Use the **Cinematic Teaser Generator** agent:
1. Extracts story essence
2. Generates trailer script
3. Creates visual prompts
4. Generates video clips with Veo 3

---

## 🤖 Agent Capabilities

| Agent | Role | Key Capabilities |
|-------|------|------------------|
| 🧠 **Story Intelligence Core** | The Brain | Context awareness, manuscript parsing, style learning, narrative structure detection |
| 🕸️ **Story Knowledge Graph** | The Memory | Character tracking, location mapping, relationship graphs, entity state management |
| ⏰ **Temporal Reasoning** | Timeline Police | Chronology tracking, flashback/forward analysis, causal chain validation |
| 🛡️ **Continuity Validator** | The Editor | Contradiction detection, plot hole identification, intent analysis, error classification |
| ✨ **Creative Co-Author** | The Muse | Scene suggestions, dialogue enhancement, character arc guidance, creative brainstorming |
| 🔍 **Intelligent Recall** | Ask Your Story | Natural language queries, cross-referencing, contextual answers, entity lookups |
| 🎬 **Cinematic Teaser** | The Mic-Drop | Trailer script generation, visual prompts, Veo 3 video generation, hook creation |

---

## 🔌 API Documentation

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

## 📁 Project Structure

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
│   ├── agents/                   # Agent definitions
│   │   ├── definitions.ts
│   │   ├── implementations.ts
│   │   └── story-intelligence-core.ts
│   ├── gemini.ts                 # Gemini AI service
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

## 📸 Screenshots

> **Coming Soon:** Screenshots will be added once the UI is finalized. The platform includes a visual workflow canvas, 3D story knowledge graph visualization, agent detail modals, and comprehensive dashboard views.

---

## 🤝 Contributing

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

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? Please [open an issue](https://github.com/jenithjain/ScriptForgeAI/issues) with:
- **Clear title** describing the issue
- **Steps to reproduce** (for bugs)
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

---

## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/jenithjain/ScriptForgeAI?style=social)
![GitHub Forks](https://img.shields.io/github/forks/jenithjain/ScriptForgeAI?style=social)
![GitHub Issues](https://img.shields.io/github/issues/jenithjain/ScriptForgeAI)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/jenithjain/ScriptForgeAI)
![Last Commit](https://img.shields.io/github/last-commit/jenithjain/ScriptForgeAI)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google AI** for Gemini 2.5 Flash/Pro and Veo 3 APIs
- **Neo4j** for graph database technology
- **React Flow** for the visual workflow library
- **Vercel** for hosting and deployment
- **Open Source Community** for invaluable tools and libraries

---

## 🗺️ Roadmap

### In Development
- [ ] ☁️ **FORGER Editor** — Cloud-based collaborative script editor
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

### ⭐ Star us on GitHub — it motivates us a lot!

**Made with ❤️ by the ScriptForge AI Team**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jenithjain/ScriptForgeAI)

---

**ScriptForge AI** © 2026 • Built with ❤️ for Screenwriters

</div>
