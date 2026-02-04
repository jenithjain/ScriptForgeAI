# 🚀 Quick Start Guide - ScriptForge Workflows

## Get Started in 3 Minutes!

### 1. Set Up Environment Variables
Create or update `.env.local`:
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Access the Workflow System
Navigate to: http://localhost:3000/workflows

## First Workflow Creation

### Step 1: Create Workflow
1. Click **"Create Workflow"** button
2. You'll see the prompt input page (dark theme with examples)

### Step 2: Describe Your Project
Example prompts you can use:

**Mystery Thriller:**
```
Create a comprehensive workflow for developing a mystery thriller screenplay. 
I need help tracking multiple suspects, managing timeline consistency, 
validating plot twists, and ensuring character motivations are clear. 
The story involves a detective investigating a series of connected crimes.
```

**Sci-Fi Series:**
```
Build a workflow for a sci-fi series with complex world-building. 
Track alien species, future technology, multiple timelines with flashbacks, 
character relationships across planets, and generate promotional content.
```

**Character-Driven Drama:**
```
Help me develop a character-driven drama focusing on family dynamics. 
Need assistance with character arc development, dialogue enhancement, 
continuity checking across multiple POVs, and theme reinforcement.
```

### Step 3: Optional - Upload Files
- Click **"Upload"** to add supporting materials
- Supported: Documents, images, videos, audio
- Files are analyzed by Gemini AI for context

### Step 4: Generate
- Click **"Generate Workflow"**
- AI analyzes your input and creates an optimized workflow
- You'll be redirected to the visual canvas

## Using the Canvas

### Left Sidebar (Strategy)
- View AI's reasoning for the workflow
- See overall progress
- Click nodes to see detailed agent info
- Click edges to view/edit connections

### Main Canvas
- **Zoom**: Mouse wheel or controls
- **Pan**: Click and drag on empty space
- **Move Nodes**: Drag nodes to reposition
- **Connect**: Drag from one node's edge to another
- **Select**: Click node or edge to view details

### Right Sidebar (Modules)
- Browse available agents by category
- **Drag & Drop** agents to canvas
- Create custom workflows

### Executing Workflow
1. Click **"Run Campaign"** button (top center)
2. Watch nodes light up as they execute
3. View results in left sidebar
4. Check completed nodes in progress bar

## Quick Tips

### 💡 Best Practices
- Start with AI-generated workflow, then customize
- Use descriptive edge labels for data flow clarity
- Test with smaller workflows first
- Save frequently during editing

### 🎨 Customization
- **Add Agents**: Drag from right sidebar
- **Remove Agents**: Select and press Delete
- **Edit Connections**: Click edge, update semantic meaning
- **Reposition**: Drag nodes to organize workflow

### 🔍 Agent Categories
- **Analysis**: Story Intelligence, Temporal Reasoning
- **Knowledge**: Knowledge Graph, Intelligent Recall
- **Quality**: Continuity Validator
- **Creation**: Creative Co-Author, Cinematic Teaser

## Example Use Cases

### 1. New Script Development
```
Agents: Story Intelligence → Knowledge Graph → 
        Creative Co-Author → Continuity Validator
```

### 2. Script Review
```
Agents: Story Intelligence → Knowledge Graph → 
        Temporal Reasoning → Continuity Validator
```

### 3. Marketing Material
```
Agents: Story Intelligence → Knowledge Graph → 
        Cinematic Teaser Generator
```

### 4. Story Q&A
```
Agents: Story Intelligence → Knowledge Graph → 
        Intelligent Recall
```

## Troubleshooting

### Workflow not generating?
- ✅ Check `GOOGLE_GEMINI_API_KEY` is set
- ✅ Verify MongoDB connection
- ✅ Check browser console for errors

### Agents not executing?
- ✅ Ensure workflow is saved
- ✅ Check network connection
- ✅ View errors in left sidebar

### Canvas not loading?
- ✅ Refresh the page
- ✅ Clear browser cache
- ✅ Check console for React Flow errors

## Navigation

- **Dashboard**: `/workflows` - View all workflows
- **Create**: `/workflows/create` - New workflow
- **Canvas**: `/workflows/[id]` - Edit specific workflow
- **Home**: `/` - Return to main page
- **Profile**: `/profile` - User settings

## Keyboard Shortcuts

- **Delete**: Remove selected node/edge
- **Ctrl/Cmd + S**: Save workflow (if implemented)
- **Ctrl/Cmd + Z**: Undo (React Flow default)
- **Space + Drag**: Pan canvas

## Next Steps

After creating your first workflow:
1. ✅ Experiment with different agent combinations
2. ✅ Try multimodal inputs (upload script files)
3. ✅ Use Intelligent Recall to query your story
4. ✅ Generate a cinematic teaser
5. ✅ Save and iterate on your workflows

## Getting Help

- 📖 Full docs: `WORKFLOWS_README.md`
- 📊 Implementation details: `IMPLEMENTATION_SUMMARY.md`
- 🎯 Agent capabilities: `lib/agents/definitions.ts`

---

**Happy Scriptwriting! 🎬✨**
