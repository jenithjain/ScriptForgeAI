# Campaign AI - AI-Powered Marketing Campaign Generator

## Overview

Campaign AI is an autonomous AI agent that functions as a complete brand campaign strategist. It takes a high-level marketing brief and executes a multi-step workflow involving research, reasoning, and orchestration of various generative tools to create a cohesive, strategically-sound campaign package.

## Features

### 🧠 Abstract Reasoning & Strategy Formation
The AI agent deconstructs your marketing brief and autonomously formulates a core strategic concept, analyzing:
- Target audience demographics and psychographics
- Campaign objectives and key messaging
- Brand tone and voice guidelines
- Channel strategy and success metrics

### 🔀 Orchestration of Specialized Agents
The workflow consists of multiple specialized AI agents:

- **Strategy Agent**: Audience intelligence and market analysis
- **Copy Agent**: Marketing copy, headlines, and captions
- **Image Agent**: Visual asset generation prompts
- **Research Agent**: Market research and influencer identification
- **Timeline Agent**: Campaign scheduling and planning
- **Distribution Agent**: Content distribution strategy

### 🎨 Interactive Campaign Canvas
React Flow-powered canvas featuring:
- Visual workflow representation with n8n-style nodes
- Real-time agent execution status
- Interactive edge editing for data flow customization
- Live progress tracking
- Asset regeneration and editing capabilities

### 🔗 Semantic Edges
Edges between nodes aren't just connections - they're intelligent data flow controllers:
- Define what data passes between agents
- Customize how information influences downstream tasks
- Click any edge to modify transfer logic
- Visual feedback during data flow

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **AI Models**: 
  - Gemini 2.0 Flash Thinking (reasoning tasks)
  - Gemini 2.0 Flash (general content generation)
  - Gemini 1.5 Flash (image prompt generation)
- **Workflow Visualization**: React Flow
- **State Management**: Zustand
- **Animations**: Framer Motion
- **UI Components**: Radix UI + Custom Components
- **Styling**: Tailwind CSS 4

## File Structure

```
app/
├── campaign/
│   ├── layout.js                 # Campaign section layout with navigation
│   ├── page.js                   # Brief input page
│   └── canvas/
│       └── page.js               # Interactive workflow canvas
├── api/
│   └── campaign/
│       ├── generate-strategy/
│       │   └── route.ts          # Strategy generation endpoint
│       ├── generate-workflow/
│       │   └── route.ts          # Workflow graph generation
│       └── execute-node/
│           └── route.ts          # Node execution endpoint

components/
├── campaign/
│   ├── AgentNode.jsx             # Custom React Flow node component
│   └── SmartEdge.jsx             # Interactive edge component
└── ui/
    ├── dialog.jsx                # Dialog component
    └── popover.jsx               # Popover component

lib/
├── gemini.ts                     # Gemini API client setup
├── store.ts                      # Zustand campaign state store
└── execution-engine.ts           # Workflow execution logic

types/
└── workflow.ts                   # TypeScript type definitions
```

## Usage

### 1. Navigate to Campaign AI
After logging in, click "Campaign AI" in the navigation menu.

### 2. Describe Your Campaign
Enter a detailed marketing brief including:
- Product or service description
- Target audience details
- Campaign occasion or timing
- Key focus areas
- Preferred channels

Example:
```
Launch a social media campaign for our new sustainable coffee brand 
targeting Gen Z in Mumbai for World Environment Day. Focus on 
eco-friendly packaging and carbon-neutral delivery.
```

### 3. Generate Workflow
Click "Generate Workflow" to trigger the AI. The system will:
1. Analyze your brief using Gemini 2.0 Flash Thinking
2. Generate a strategic rationale
3. Create a workflow graph with specialized agent nodes
4. Redirect you to the interactive canvas

### 4. Execute Agents
On the canvas:
- View the strategic rationale in the left sidebar
- Click "Run Campaign" to execute all agents in order
- Or click individual agent nodes to run them separately
- Monitor progress in real-time

### 5. Customize & Refine
- Click agent nodes to edit generated content
- Click edge labels to modify data flow logic
- Regenerate any agent output as needed
- Export the final campaign package

## API Endpoints

### POST `/api/campaign/generate-strategy`
Generates campaign strategy from brief.

**Request:**
```json
{
  "brief": "Your campaign description..."
}
```

**Response:**
```json
{
  "title": "Campaign Name",
  "rationale": "<html>Strategic analysis...</html>"
}
```

### POST `/api/campaign/generate-workflow`
Creates workflow graph with semantic edges.

**Request:**
```json
{
  "brief": "Your campaign description...",
  "rationale": "Strategic analysis..."
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "agentNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Audience Analyzer",
        "type": "strategy",
        "status": "idle",
        "promptContext": "Analyze target demographics..."
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "smartEdge",
      "data": {
        "label": "Audience Insights",
        "transferLogic": "Extract demographics and use to tailor tone..."
      }
    }
  ]
}
```

### POST `/api/campaign/execute-node`
Executes a specific agent node.

**Request:**
```json
{
  "nodeId": "node-1",
  "nodes": [...],
  "edges": [...],
  "brief": "Campaign description",
  "strategy": "Strategic rationale"
}
```

**Response:**
```json
{
  "success": true,
  "output": "Generated content...",
  "nodeId": "node-1"
}
```

## Key Components

### AgentNode Component
Custom React Flow node with:
- Glassmorphism design matching your theme
- Status indicators (idle, loading, complete, error)
- Inline content editing
- Regeneration capability
- Type-specific icons and colors

### SmartEdge Component
Interactive edge with:
- Animated flow visualization
- Clickable label badge
- Popover editor for transfer logic
- Real-time visual feedback

### Execution Engine
Handles:
- Topological sorting of workflow
- Dependency resolution
- Context compilation from incoming edges
- Prompt construction with semantic data flow

## Customization

### Adding New Agent Types
1. Add type to `types/workflow.ts`:
```typescript
export type NodeType = 'strategy' | 'copy' | 'image' | 'research' | 'timeline' | 'distribution' | 'your-type';
```

2. Update `AgentNode.jsx` icon and color maps
3. Add type-specific instructions in `execution-engine.ts`

### Modifying AI Models
Edit `lib/gemini.ts` to use different Gemini models or adjust parameters:
```typescript
export const getReasoningModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-thinking-exp-01-21',
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });
};
```

## Environment Variables

Ensure these are set in `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Error Handling

The system includes:
- Retry logic with exponential backoff
- JSON parsing with markdown code block handling
- User-friendly error messages via toast notifications
- Graceful degradation for failed agent executions

## Performance Considerations

- Agent nodes execute sequentially to maintain context flow
- Results are cached in Zustand store
- React Flow optimizations for large workflows
- Lazy loading of canvas components

## Future Enhancements

- [ ] Real image generation integration (DALL-E, Midjourney)
- [ ] Multi-user collaboration on campaigns
- [ ] Campaign templates library
- [ ] A/B testing suggestions
- [ ] Integration with marketing platforms
- [ ] Historical campaign analytics
- [ ] Export to various formats (PDF, Notion, etc.)

## Troubleshooting

### Workflow not generating
- Check Gemini API key is valid
- Verify brief is at least 50 characters
- Check browser console for errors

### Agents not executing
- Ensure dependencies are met (previous nodes complete)
- Check network tab for API errors
- Verify Gemini API quota hasn't been exceeded

### Canvas not rendering
- Clear browser cache
- Check React Flow styles are loaded
- Verify all required packages are installed

## License

Part of ChainForecast - All rights reserved
