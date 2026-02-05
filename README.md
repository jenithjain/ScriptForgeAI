<div align="center">

# 🎬 ScriptForge AI

### *A Collaborative Storytelling Ecosystem: Beyond Generic Chatbots*

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-6.0-008CC1?style=for-the-badge&logo=neo4j)](https://neo4j.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.0-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

**Purpose-Built Multi-Agent Intelligence with Intent-Aware Logic and Graph Memory**

[Features](#-key-features) • [Demo](#-live-demo) • [Installation](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

![ScriptForge Hero](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Powered_by_Gemini-orange?style=for-the-badge)

---

</div>

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [Agent Capabilities](#-agent-capabilities)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**ScriptForge AI** is a revolutionary intelligent scriptwriting platform that goes beyond generic chatbots. It's a complete **collaborative storytelling ecosystem** powered by seven specialized AI agents, visual workflow orchestration, and a graph-based memory system.

### 🎯 The Problem

Professional screenwriters face three critical challenges:
- 📚 **Continuity Nightmares** - Tracking hundreds of story elements across multiple drafts
- 🔀 **Fragmented Tools** - Jumping between note apps, timeline software, and editing tools
- 🤖 **Generic AI Limitations** - ChatGPT doesn't understand narrative structure or your story universe

### 💡 Our Solution

ScriptForge AI provides:
- **🧠 Multi-Agent Intelligence** - Seven specialized agents working in concert
- **🎨 Visual Workflow Builder** - n8n-style drag-and-drop orchestration
- **🕸️ Knowledge Graph Memory** - Neo4j-powered relationship tracking
- **🎬 Cinematic Output** - AI-generated video teasers with Veo 3
- **📊 TOON Protocol** - Custom notation for readable AI outputs

---

## ✨ Key Features

<details open>
<summary><b>🎨 Visual Workflow Builder</b></summary>

- **Drag-and-drop** agent orchestration
- **Auto-designs** optimal pipelines based on project requirements
- **No coding** required - describe your needs in plain English
- **Semantic edges** - connections carry contextual meaning
- **Real-time execution** - watch your workflow run live

</details>

<details open>
<summary><b>🧠 Seven Specialized AI Agents</b></summary>

| Agent | Purpose | Capabilities |
|-------|---------|-------------|
| 🧠 **Story Intelligence** | The Brain | Global context, manuscript parsing, style learning |
| 🕸️ **Knowledge Graph** | The Memory | Character/location/object tracking, relationships |
| ⏰ **Temporal Reasoner** | Timeline Police | Chronology tracking, flashback detection |
| 🛡️ **Continuity Validator** | The Editor | Error detection, intent awareness |
| ✨ **Creative Co-Author** | The Muse | Plot suggestions, dialogue enhancement |
| 🔍 **Intelligent Recall** | Ask Your Story | Natural language queries, cross-referencing |
| 🎬 **Teaser Generator** | The Mic-Drop | Video generation, visual prompts |

</details>

<details open>
<summary><b>📊 TOON (Token-Oriented Object Notation)</b></summary>

Custom symbolic notation for improved AI output readability:
- `⟹` for object properties
- `→` for array indices  
- `⊤` / `⊥` for boolean values
- `∅` for undefined/null

**Better than JSON** for human interpretation while maintaining structure.

</details>

<details open>
<summary><b>🎭 Intent-Aware Continuity</b></summary>

- Distinguishes **genuine errors** from **narrative devices** (e.g., foreshadowing)
- Provides **alerts without restricting** creative freedom
- **Severity classification** - critical vs. stylistic choices
- Understands **Chekhov's Gun** and intentional mysteries

</details>

<details open>
<summary><b>☁️ FORGER Editor (Future)</b></summary>

- **Cloud-based** collaborative script editor
- **Real-time team writing** with shared knowledge graph updates
- **Version control** integration
- **Conflict resolution** with AI assistance

</details>

<details open>
<summary><b>🎥 Multimodal Context</b></summary>

- **Processes PDFs**, scripts, images, and audio
- **Connects visual and textual** references
- **Maintains context** across different media types
- **Gemini-powered** multimodal understanding

</details>

---

## 🏗️ Architecture

### System Overview

![Architecture Ecosystem](./docs/architecture-ecosystem.png)
*A Collaborative Storytelling Ecosystem - Core features and capabilities*

### Technical Stack

![Architecture Stack](./docs/architecture-stack.png)
*The Architectural Stack & Tooling - Agent swarm, data foundation, and output layers*

### Agent Pipeline

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

---

## 🛠️ Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![React Flow](https://img.shields.io/badge/React_Flow-11.11.4-FF0072)
![Three.js](https://img.shields.io/badge/Three.js-0.180.0-000000?logo=three.js)

### Backend & AI
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)
![Veo](https://img.shields.io/badge/Veo-3-FF6B6B)
![Neo4j](https://img.shields.io/badge/Neo4j-6.0.1-008CC1?logo=neo4j)
![MongoDB](https://img.shields.io/badge/MongoDB-9.0-47A248?logo=mongodb)
![NextAuth](https://img.shields.io/badge/NextAuth-4.24.13-purple)

### Libraries & Tools
- **UI Components**: Radix UI, Framer Motion, Lucide React
- **Data Visualization**: Recharts, Force Graph (2D/3D)
- **Document Processing**: PDF-Parse, Mammoth, PDF-Lib
- **State Management**: Zustand
- **API**: REST endpoints with Next.js App Router

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
MongoDB (local or Atlas)
Neo4j Database (local or Aura)
```

### Installation

1️⃣ **Clone the repository**
```bash
git clone https://github.com/yourusername/scriptforge-ai.git
cd scriptforge-ai
```

2️⃣ **Install dependencies**
```bash
npm install
```

3️⃣ **Set up environment variables**

Create `.env.local` file:
```env
# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Database Connections
MONGODB_URI=mongodb://localhost:27017/scriptforge
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Video Generation (Veo 3)
VEO_API_KEY=your_veo_api_key
```

4️⃣ **Run development server**
```bash
npm run dev
```

5️⃣ **Open your browser**
```
http://localhost:3000
```

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

### 🧠 Story Intelligence Core
**Role:** The Brain  
**Inputs:** Manuscript, Script, Documents  
**Outputs:** Story Context, Style Profile, Structure Analysis

```typescript
capabilities: [
  'Global context awareness',
  'Manuscript parsing & analysis',
  'Style & tone learning',
  'Version tracking',
  'Narrative structure detection'
]
```

### 🕸️ Story Knowledge Graph Agent
**Role:** The Memory  
**Inputs:** Story Context, Manuscript, Scenes  
**Outputs:** Knowledge Graph, Entity Data, Relationships

```typescript
capabilities: [
  'Character tracking',
  'Location mapping',
  'Object & prop tracking',
  'Event sequencing',
  'Relationship graphs',
  'Plot thread management',
  'Entity state tracking'
]
```

### ⏰ Temporal & Causal Reasoning Agent
**Role:** Timeline Police  
**Inputs:** Knowledge Graph, Story Context, Events  
**Outputs:** Timeline, Causal Chains, Temporal Issues

```typescript
capabilities: [
  'Chronology tracking',
  'Flashback detection',
  'Flash-forward analysis',
  'Cause-effect validation',
  'Timeline consistency',
  'Temporal paradox detection'
]
```

### 🛡️ Continuity & Intent Validator
**Role:** The Editor  
**Inputs:** Knowledge Graph, Timeline, Manuscript  
**Outputs:** Continuity Report, Errors, Warnings

```typescript
capabilities: [
  'Contradiction detection',
  'Intent analysis',
  'Error classification',
  'Severity assessment',
  'Continuity validation',
  'Plot hole detection'
]
```

### ✨ Creative Co-Author Agent
**Role:** The Muse  
**Inputs:** Story Context, Knowledge Graph, User Intent  
**Outputs:** Suggestions, Improved Dialogue, Plot Ideas

```typescript
capabilities: [
  'Scene suggestions',
  'Plot development ideas',
  'Dialogue enhancement',
  'Character arc guidance',
  'Theme reinforcement',
  'Creative brainstorming',
  'Alternative scenarios'
]
```

### 🔍 Intelligent Recall Agent
**Role:** Ask Your Story  
**Inputs:** Knowledge Graph, Query, Story Context  
**Outputs:** Answer, References, Related Info

```typescript
capabilities: [
  'Natural language queries',
  'Character lookups',
  'Plot searches',
  'Event retrieval',
  'Cross-referencing',
  'Contextual answers',
  'Story Q&A'
]
```

### 🎬 Cinematic Teaser Generator
**Role:** The Mic-Drop  
**Inputs:** Story Context, Knowledge Graph, Preferences  
**Outputs:** Teaser Script, Visual Prompts, Video

```typescript
capabilities: [
  'Story essence extraction',
  'Trailer script generation',
  'Visual prompt creation',
  'Video generation (Veo3)',
  'Hook creation',
  'Mood & tone capture',
  'Key moment identification'
]
```

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

<details>
<summary><b>🎨 Click to expand screenshots</b></summary>

### Workflow Dashboard
![Dashboard Overview](https://via.placeholder.com/800x450.png?text=Workflow+Dashboard)

### Visual Canvas
![Workflow Canvas](https://via.placeholder.com/800x450.png?text=Visual+Workflow+Canvas)

### Agent Results
![Agent Modal](https://via.placeholder.com/800x450.png?text=Agent+Detail+Modal)

### Story Graph 3D
![Story Graph](https://via.placeholder.com/800x450.png?text=3D+Story+Knowledge+Graph)

### TOON Output
![TOON Format](https://via.placeholder.com/800x450.png?text=TOON+Notation+Display)

</details>

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

Found a bug or have a feature idea? Please [open an issue](https://github.com/yourusername/scriptforge-ai/issues) with:
- **Clear title** describing the issue
- **Steps to reproduce** (for bugs)
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

---

## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/yourusername/scriptforge-ai?style=social)
![GitHub Forks](https://img.shields.io/github/forks/yourusername/scriptforge-ai?style=social)
![GitHub Issues](https://img.shields.io/github/issues/yourusername/scriptforge-ai)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/yourusername/scriptforge-ai)
![Last Commit](https://img.shields.io/github/last-commit/yourusername/scriptforge-ai)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google AI** for Gemini 2.0 Flash and Veo 3 APIs
- **Neo4j** for graph database technology
- **React Flow** for the visual workflow library
- **Vercel** for hosting and deployment
- **Open Source Community** for invaluable tools and libraries

---

## 📞 Contact & Support

- 📧 **Email**: support@scriptforge.ai
- 💬 **Discord**: [Join our community](https://discord.gg/scriptforge)
- 🐦 **Twitter**: [@ScriptForgeAI](https://twitter.com/scriptforgeai)
- 📺 **YouTube**: [Video tutorials](https://youtube.com/@scriptforgeai)

---

## 🗺️ Roadmap

- [ ] **Q1 2026** - Real-time collaboration in FORGER Editor
- [ ] **Q2 2026** - Mobile app (iOS/Android)
- [ ] **Q3 2026** - Plugin system for custom agents
- [ ] **Q4 2026** - Integration with Final Draft & Celtx
- [ ] **Future** - Multi-language support
- [ ] **Future** - Voice-to-text screenplay dictation

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

**Made with ❤️ by the ScriptForge AI Team**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/scriptforge-ai)
[![Website](https://img.shields.io/badge/Website-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://scriptforge.ai)
[![Documentation](https://img.shields.io/badge/Docs-FF6B6B?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://docs.scriptforge.ai)

---

**ScriptForge AI** © 2026 • [Website](https://scriptforge.ai) • [Documentation](https://docs.scriptforge.ai) • [Support](mailto:support@scriptforge.ai)

</div>
