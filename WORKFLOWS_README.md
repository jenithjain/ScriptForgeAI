# ScriptForge AI Workflow System

## Overview
ScriptForge AI provides an intelligent, end-to-end workflow system for scriptwriting and filmmaking. Built with n8n-style visual workflow editor using React Flow, powered by Google's Gemini AI.

## Features

### 🎯 AI-Powered Workflow Generation
- **Intelligent Analysis**: Describe your scriptwriting project and let Gemini AI automatically design an optimal workflow
- **Multimodal Input**: Support for text, documents, images, videos, and audio files
- **Context-Aware**: AI understands your genre, characters, plot elements, and goals

### 🧠 Seven Specialized Agents

#### 1. Story Intelligence Core (The Brain)
- Global context awareness across your entire manuscript
- Manuscript parsing and structural analysis
- Style & tone learning and consistency
- Version tracking and change management
- **Capabilities**: Genre detection, theme extraction, narrative structure analysis

#### 2. Story Knowledge Graph Agent (The Memory)
- Character tracking and relationship mapping
- Location and setting management
- Object and prop tracking
- Event sequencing and timeline
- Plot thread management
- Entity state changes over time
- **Output**: Comprehensive knowledge graph of your story universe

#### 3. Temporal & Causal Reasoning Agent (Timeline Police)
- Chronology tracking and validation
- Flashback and flash-forward detection
- Cause-effect relationship mapping
- Timeline consistency checking
- Temporal paradox detection
- **Output**: Validated timeline with causal chains

#### 4. Continuity & Intent Validator (The Editor)
- Contradiction detection across your manuscript
- Distinction between errors and intentional narrative choices
- Severity classification of issues
- Plot hole detection
- Character consistency validation
- **Output**: Detailed continuity report with actionable insights

#### 5. Creative Co-Author Agent (The Muse)
- Scene suggestions based on story context
- Plot development ideas and alternatives
- Dialogue enhancement and improvement
- Character arc guidance and development
- Theme reinforcement
- Creative brainstorming support
- **Output**: Contextual creative suggestions

#### 6. Intelligent Recall Agent (Ask Your Story)
- Natural language queries about your story
- Character and plot lookups
- Event retrieval and cross-referencing
- Contextual Q&A system
- **Output**: Intelligent answers with references

#### 7. Cinematic Teaser Generator (The Mic-Drop)
- Story essence extraction
- Trailer script generation (powered by Gemini)
- Visual prompt creation for key scenes
- Video generation integration (Veo3 ready)
- Hook and mood capture
- **Output**: Complete teaser package with visual prompts

### 🎨 n8n-Style Visual Editor
- **Drag-and-Drop Interface**: Intuitive agent placement
- **Editable Connections**: Each edge has semantic meaning
- **Collapsible Sidebars**: 
  - Left: Agent reasoning and strategy
  - Right: Available modules and agents
- **Real-time Execution**: Watch your workflow run with live status updates
- **Beautiful Theme**: Dark mode design matching ScriptForge aesthetics

### 📊 Workflow Management
- **Dashboard**: View all your workflow drafts
- **Status Tracking**: draft, active, running, completed, error
- **Progress Monitoring**: See which agents have completed
- **Version Control**: Track workflow iterations
- **Quick Actions**: Edit, run, or delete workflows

## Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 19, React Flow
- **AI Engine**: Google Gemini 2.0 Flash
- **Database**: MongoDB (Mongoose)
- **Styling**: Tailwind CSS, Radix UI
- **State**: Zustand (if needed)

### File Structure
```
app/
  workflows/
    page.js              # Workflow list dashboard
    create/
      page.js            # Workflow creation with prompt input
    [id]/
      page.js            # Individual workflow canvas
    layout.js            # Workflows layout with navigation

components/
  workflow/
    WorkflowCanvas.jsx   # Main n8n-style canvas component
    AgentModules.jsx     # Draggable agent modules sidebar

lib/
  agents/
    definitions.ts       # Agent type definitions and metadata
    implementations.ts   # Agent logic implementations
  scriptforge-ai.ts      # Gemini AI service for workflow generation
  models/
    ScriptWorkflow.js    # MongoDB model for workflows

api/
  scriptforge/
    workflows/
      generate/          # Generate workflow from brief
      list/              # List user's workflows
      save/              # Save/update/delete workflows
      execute/           # Execute workflow agents
```

## API Endpoints

### POST /api/scriptforge/workflows/generate
Generate a new workflow from a brief
```json
{
  "brief": "Create a mystery thriller with complex character arcs...",
  "inputs": [
    {
      "type": "text",
      "content": "Additional context..."
    }
  ]
}
```

### GET /api/scriptforge/workflows/list
List all workflows for the authenticated user
Query params: `?status=draft|active|running|completed|error`

### PUT /api/scriptforge/workflows/save
Update a workflow
```json
{
  "workflowId": "...",
  "updates": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### DELETE /api/scriptforge/workflows/save?id=...
Delete a workflow

### POST /api/scriptforge/workflows/execute
Execute a workflow
```json
{
  "workflowId": "..."
}
```

## Usage Flow

### 1. Create Workflow
1. Navigate to `/workflows`
2. Click "Create Workflow"
3. Describe your scriptwriting project in the prompt box
4. Optionally upload files (scripts, images, videos, etc.)
5. Click "Generate Workflow"
6. AI analyzes your input and creates an optimal agent workflow

### 2. Edit Workflow
1. View the generated workflow in the visual canvas
2. Drag and drop agents from the right sidebar
3. Connect agents by dragging between nodes
4. Click edges to edit their semantic meaning
5. Click nodes to view details and configure
6. Save your changes

### 3. Execute Workflow
1. Click "Run Campaign" to execute the workflow
2. Watch as each agent processes sequentially
3. View results in the left sidebar
4. Check the progress bar for completion status

### 4. View Results
- Each completed agent shows its output
- Continuity reports highlight issues
- Creative suggestions appear contextually
- Knowledge graphs visualize story elements

## Agent Data Flow

```
User Input → Story Intelligence Core
             ↓
         Knowledge Graph Agent
             ↓
     Temporal Reasoning Agent
             ↓
     Continuity Validator
             ↓ (parallel)
   Creative Co-Author ←→ Intelligent Recall
             ↓
    Cinematic Teaser Generator
```

## Customization

### Adding New Agents
1. Define agent in `lib/agents/definitions.ts`
2. Implement logic in `lib/agents/implementations.ts`
3. Add to `AGENT_CATEGORIES` for sidebar organization

### Modifying Workflow Generation
Update the prompt in `lib/scriptforge-ai.ts` → `generateWorkflow()`

### Styling
- Canvas theme: `components/workflow/WorkflowCanvas.jsx`
- Node appearance: `AgentNode` component
- Edge styling: Update `onConnect` callback

## Environment Variables
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Future Enhancements
- [ ] Real-time collaboration on workflows
- [ ] Export workflows as JSON
- [ ] Import workflows from templates
- [ ] Agent marketplace
- [ ] Veo3 video generation integration
- [ ] Workflow versioning and rollback
- [ ] Advanced analytics dashboard
- [ ] Integration with screenwriting software
- [ ] Mobile app support

## Support
For issues or feature requests, please contact the ScriptForge team.

---

Built with ❤️ using Google Gemini AI
