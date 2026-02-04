# ChainForecast System Architecture

## 🎯 Core Innovation

**Traditional Approach:** User manually drags and drops nodes to build workflows.

**ChainForecast Approach:** AI analyzes user's KYC data + prompt → autonomously generates workflow graph → user can edit and execute.

---

## 🗄️ Database Architecture

### MongoDB Collection Design

#### 1. Users Collection (with Embedded KYC)
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed with bcrypt),
  authProvider: "credentials" | "google",
  googleId: String (optional),
  name: String,
  image: String (optional),
  
  // Embedded KYC Data (Accessed on every AI generation)
  businessProfile: {
    // Identity (Questions 1-3)
    businessType: "LLC" | "Sole Proprietorship" | "Partnership" | "Corporation" | "Other",
    industry: "Retail" | "SaaS" | "E-commerce" | "Manufacturing" | "Services" | "Other",
    employeeCount: "1-10" | "11-50" | "51-200" | "201-500" | "500+",
    
    // Financials (Questions 4-6)
    revenueTier: "<100K" | "100K-500K" | "500K-1M" | "1M-5M" | "5M+",
    businessModel: "Subscription" | "One-time Purchase" | "Hybrid" | "Freemium",
    averageOrderValue: "<$50" | "$50-$200" | "$200-$500" | "$500-$1000" | "$1000+",
    
    // Targeting (Questions 7-8)
    audienceDemographic: ["Gen Z", "Millennials", "Gen X", "Baby Boomers", "B2B"],
    purchaseFrequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually",
    
    // Marketing (Questions 9-10)
    acquisitionChannels: ["Social Media", "SEO", "Paid Ads", "Email", "Referrals", "Events", "Direct"],
    activePlatforms: ["Instagram", "Facebook", "LinkedIn", "Twitter/X", "TikTok", "YouTube", "Pinterest"],
    
    // Operations (Questions 11-12)
    skuCount: "1-10" | "11-50" | "51-200" | "201-500" | "500+",
    peakSeasonality: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)", "Holiday Season", "No Peak"],
    
    // Goals (Questions 13-14)
    primaryObjective: "Increase Sales" | "Brand Awareness" | "Customer Retention" | "Market Expansion" | "Lead Generation",
    painPoints: ["Low Conversion", "High CAC", "Poor Retention", "Limited Budget", "Lack of Analytics", "Time Constraints"],
    
    // Compliance (Questions 15-16)
    documentType: "Business License" | "Tax ID" | "Registration Certificate" | "Other",
    verificationStatus: "Pending" | "Verified" | "Rejected",
    completedAt: Date
  },
  
  hasCompletedKYC: Boolean,
  apiKeys: {
    gemini: String (encrypted),
    midjourney: String (encrypted),
    other: Map
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Why Embedded KYC?**
- AI needs to access KYC on every campaign generation
- Eliminates need for JOIN operations
- Single database call retrieves all user context
- Faster response time for AI reasoning

#### 2. Campaigns Collection (The Canvas State)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  campaignName: String,
  status: "Conceptualizing" | "Generated" | "Approved" | "Executing" | "Completed" | "Failed",
  
  // AI Strategic Reasoning
  strategicConcept: String, // e.g., "Your Daily Brew, A Greener View"
  
  // Chat History that Led to This Campaign
  chatContext: [
    { role: "user", content: "Launch a campaign for my coffee shop", timestamp: Date },
    { role: "assistant", content: "I'll create a sustainability-focused campaign...", timestamp: Date }
  ],
  
  // ReactFlow Graph State
  canvasState: {
    nodes: [
      {
        id: "node-1",
        type: "toolNode" | "decisionNode" | "triggerNode" | "outputNode",
        data: {
          toolName: "MidjourneyGenerator" | "GeminiCopywriter" | "InstagramScheduler",
          inputParams: {
            prompt: "Sustainable coffee bag on rustic table",
            style: "photorealistic",
            aspectRatio: "1:1"
          },
          generatedOutput: {
            imageUrl: "https://cdn.example.com/image.png",
            generatedAt: Date
          },
          status: "pending" | "running" | "completed" | "failed"
        },
        position: { x: 100, y: 100 }
      }
    ],
    edges: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "default",
        animated: false
      }
    ],
    viewport: { x: 0, y: 0, zoom: 1 }
  },
  
  // Execution Tracking
  executionLog: [
    {
      nodeId: "node-1",
      status: "completed",
      output: { ... },
      executedAt: Date,
      error: String (optional)
    }
  ],
  
  // Budget Tracking
  estimatedBudget: Number,
  actualSpend: Number,
  
  createdAt: Date,
  updatedAt: Date,
  approvedAt: Date,
  completedAt: Date
}
```

**Why This Structure?**
- `chatContext` preserves the reasoning process
- `canvasState` can be directly loaded into ReactFlow
- `nodes.data.generatedOutput` stores AI results
- Entire workflow is one MongoDB document (flexible schema)

#### 3. Tools Collection (AI Capability Registry)
```javascript
{
  _id: ObjectId,
  name: "midjourney_image_gen",
  displayName: "Midjourney Image Generator",
  description: "Generate photorealistic marketing images using AI",
  category: "Content Generation" | "Visual Design" | "Analytics" | "Automation" | "Social Media" | "Email Marketing",
  
  // JSON Schema for Input Validation
  requiredInputs: {
    type: "object",
    properties: {
      prompt: { type: "string", required: true },
      aspectRatio: { type: "string", enum: ["1:1", "16:9", "9:16"] }
    }
  },
  
  // JSON Schema for Output
  outputSchema: {
    type: "object",
    properties: {
      imageUrl: { type: "string" },
      thumbnailUrl: { type: "string" }
    }
  },
  
  apiHandler: "handlers/midjourney.js", // Backend function reference
  costPerExecution: 0.04, // USD
  config: {
    maxRetries: 3,
    timeout: 30000,
    rateLimit: 100
  },
  isActive: Boolean,
  usageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Why This Collection?**
- Gemini queries this to know what tools are available
- Defines contract between AI and backend execution
- Easy to add new capabilities without code changes
- Cost tracking for budget estimation

#### 4. AnalyticsData Collection (Time Series)
```javascript
{
  userId: ObjectId (ref: Users),
  transactionDate: Date,
  sku: String,
  productName: String,
  category: String,
  amount: Number,
  quantity: Number,
  customerId: String,
  customerSegment: "New" | "Returning" | "VIP" | "At-Risk" | "Churned",
  channel: "Online" | "In-Store" | "Mobile App" | "Social Commerce" | "Marketplace",
  location: {
    country: String,
    state: String,
    city: String,
    zipCode: String
  },
  discount: Number,
  tax: Number,
  shippingCost: Number,
  campaignId: ObjectId (ref: Campaigns, optional),
  createdAt: Date
}

// MongoDB Time Series Collection Configuration
{
  timeseries: {
    timeField: "transactionDate",
    metaField: "userId",
    granularity: "hours"
  }
}
```

**Why Time Series?**
- Optimized for forecasting queries
- Reduced storage (50-90% compression)
- Fast aggregations for trend analysis

---

## 🤖 AI Agent Architecture

### Phase 1: Abstract Reasoning ("The Brain")

**Input:**
- User Prompt: "Launch a Diwali sale for my saree shop"
- User KYC: Fetched from `Users.businessProfile`

**System Prompt to Gemini:**
```
You are a marketing strategist for a business with these characteristics:
- Industry: Retail
- Business Type: Sole Proprietorship
- Target Audience: Gen Z, Millennials
- Active Platforms: Instagram, Facebook
- Primary Goal: Increase Sales
- Peak Season: Q4
- Pain Points: Low Conversion, Limited Budget

User Request: "Launch a Diwali sale for my saree shop"

Task: Create a strategic concept (abstract idea, NOT implementation yet).
```

**Output (Strategic Concept):**
```
"Diwali Elegance: A Digital Showcase"

Strategy: Position sarees as premium festive wear through Instagram Stories 
carousel featuring traditional designs + modern styling. Use user-generated 
content to build social proof. Time-limited discount creates urgency.
```

### Phase 2: Orchestration ("The Architect")

**Input:**
- Strategic Concept from Phase 1
- Available Tools from `Tools` collection
- Business constraints (budget, platforms)

**System Prompt to Gemini:**
```
Strategic Concept: "Diwali Elegance: A Digital Showcase"

Available Tools:
- midjourney_image_gen: Generate images ($0.04/image)
- gemini_copywriter: Write captions ($0.001/caption)
- instagram_scheduler: Schedule posts ($0.00)
- email_composer: Create email campaigns ($0.01/email)

Task: Generate a JSON workflow that implements this strategy.
Output must be valid ReactFlow format.
```

**Output (JSON Workflow):**
```json
{
  "nodes": [
    {
      "id": "1",
      "type": "toolNode",
      "data": {
        "toolName": "midjourney_image_gen",
        "inputParams": {
          "prompt": "Elegant Indian woman wearing vibrant Diwali saree, traditional jewelry, festive background with diyas",
          "aspectRatio": "9:16",
          "style": "photorealistic"
        }
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "2",
      "type": "toolNode",
      "data": {
        "toolName": "gemini_copywriter",
        "inputParams": {
          "context": "Diwali saree sale, 20% off",
          "tone": "festive and elegant",
          "platform": "Instagram",
          "callToAction": "Shop Now"
        }
      },
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "3",
      "type": "toolNode",
      "data": {
        "toolName": "instagram_scheduler",
        "inputParams": {
          "imageSource": "$output.1.imageUrl",
          "caption": "$output.2.text",
          "scheduleTime": "2024-10-15T18:00:00Z",
          "hashtags": ["#DiwaliSale", "#Sarees", "#FestiveFashion"]
        }
      },
      "position": { "x": 500, "y": 100 }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" }
  ]
}
```

### Phase 3: Storage & Rendering

**Backend:**
```javascript
// Save to MongoDB
const campaign = await Campaign.create({
  userId: session.user.id,
  campaignName: "Diwali Saree Sale 2024",
  status: "Generated",
  strategicConcept: "Diwali Elegance: A Digital Showcase",
  chatContext: conversationHistory,
  canvasState: geminiGeneratedJSON
});
```

**Frontend (ReactFlow):**
```javascript
import ReactFlow from 'reactflow';

function CampaignCanvas({ campaignId }) {
  const [campaign, setCampaign] = useState(null);
  
  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then(res => res.json())
      .then(data => setCampaign(data));
  }, [campaignId]);
  
  return (
    <ReactFlow
      nodes={campaign.canvasState.nodes}
      edges={campaign.canvasState.edges}
      onNodesChange={handleNodeUpdate}
    />
  );
}
```

### Phase 4: Interactive Execution

**User clicks "Run" button:**

```javascript
async function executeCampaign(campaignId) {
  const campaign = await Campaign.findById(campaignId);
  
  for (const node of campaign.canvasState.nodes) {
    // Find tool definition
    const tool = await Tool.findOne({ name: node.data.toolName });
    
    // Execute tool
    const handler = require(tool.apiHandler);
    const result = await handler(node.data.inputParams);
    
    // Update node with output
    node.data.generatedOutput = result;
    node.data.status = 'completed';
    
    // Save execution log
    campaign.executionLog.push({
      nodeId: node.id,
      status: 'completed',
      output: result,
      executedAt: new Date()
    });
  }
  
  campaign.status = 'Completed';
  await campaign.save();
}
```

---

## 📊 Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INPUT LAYER                                                  │
│    User enters: "Launch a campaign for my Coffee Shop"         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONTEXT LAYER (MongoDB Query)                               │
│    System fetches: Users.businessProfile                       │
│    Result: { industry: "Coffee", audience: "GenZ", ... }       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. REASONING LAYER (Gemini API)                                │
│    Combines: User Prompt + KYC Data                            │
│    Decides: "I need 1 Image Node + 1 Text Node + 1 Schedule"  │
│    Generates: Strategic Concept                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GENERATION LAYER (Gemini API)                               │
│    Queries: Tools collection for available capabilities        │
│    Constructs: JSON workflow graph                             │
│    Output: { nodes: [...], edges: [...] }                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. STORAGE LAYER (MongoDB Insert)                              │
│    Saves to: Campaigns collection                              │
│    Structure: { userId, canvasState, chatContext, ... }        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI LAYER (ReactFlow)                                        │
│    Fetches: Campaign from MongoDB                              │
│    Renders: Visual workflow graph                              │
│    Allows: User edits (add/remove nodes, change params)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. EXECUTION LAYER (User clicks "Run")                         │
│    Iterates: Through nodes                                      │
│    Executes: Tool handlers (API calls)                         │
│    Updates: node.data.generatedOutput in MongoDB              │
│    Result: Campaign status → "Completed"                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### Tech Stack
- **Next.js 14+** - App Router
- **ReactFlow** - Workflow visualization
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **NextAuth.js** - Authentication
- **SWR / TanStack Query** - Data fetching

### Key Components

```
app/
├── layout.js (Root layout with AuthProvider)
├── page.js (Landing page)
├── auth/page.js (Login/Signup)
├── onboarding/page.js (KYC flow)
├── dashboard/
│   ├── page.js (Dashboard overview)
│   └── layout.js
├── assistant/
│   ├── page.js (AI chat interface)
│   └── layout.js
└── campaigns/
    ├── [id]/page.js (ReactFlow canvas)
    └── layout.js

components/
├── AuthProvider.jsx
├── KYCStepForm.jsx
├── CampaignCanvas.jsx
├── NodeTypes/
│   ├── ToolNode.jsx
│   ├── DecisionNode.jsx
│   └── OutputNode.jsx
└── ui/ (shadcn components)

lib/
├── mongodb.js
├── models/
│   ├── User.js
│   ├── Campaign.js
│   ├── Tool.js
│   └── AnalyticsData.js
└── utils.js
```

---

## 🔐 Authentication Flow

```
┌──────────────┐
│  User visits │
│   /auth      │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Choose authentication method:   │
│ 1. Email/Password (MongoDB)     │
│ 2. Google OAuth                 │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ NextAuth.js validates           │
│ Creates session (JWT)           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Middleware checks:              │
│ hasCompletedKYC?                │
└──────┬──────────────────────────┘
       │
       ├─ No ──▶ Redirect to /onboarding
       │
       └─ Yes ─▶ Redirect to /dashboard
```

---

## 🚀 Deployment Considerations

### Environment Variables
```env
# Production
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://chainforecast.com
NEXTAUTH_SECRET=<strong-secret>
GOOGLE_CLIENT_ID=<prod-client-id>
GOOGLE_CLIENT_SECRET=<prod-secret>
GEMINI_API_KEY=<api-key>
```

### Scaling Strategy
1. **Database:** Use MongoDB Atlas with auto-scaling
2. **API:** Implement rate limiting on `/api/campaigns/generate`
3. **Caching:** Cache Tool definitions in Redis
4. **CDN:** Serve generated images via CloudFront/Cloudflare

---

## 📈 Future Enhancements

1. **Real-time Collaboration:** Multiple users editing same campaign
2. **Version Control:** Git-like history for campaign iterations
3. **A/B Testing:** Split test different workflow variants
4. **Analytics Integration:** Connect Google Analytics, Meta Pixel
5. **Webhook Support:** Trigger campaigns from external events
6. **Template Marketplace:** Share successful workflows

---

**This architecture enables ChainForecast to be the first truly AI-native campaign platform! 🚀**
