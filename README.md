# ChainForecast 🚀

> **Retail Analytics & Generative AI Marketing Platform**  
> The first truly AI-native campaign platform where AI autonomously generates workflow graphs from natural language prompts.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-4.24-purple)](https://next-auth.js.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 Core Innovation

**Traditional Approach:** User manually drags and drops nodes to build workflows.

**ChainForecast Approach:**  
```
User: "Launch a Diwali sale for my saree shop"
  ↓
AI analyzes KYC data + prompt
  ↓
Generates workflow graph autonomously
  ↓
User can edit and execute
```

**No manual node placement. No drag-and-drop required initially. The AI does the heavy lifting.**

---

## ✨ What's Implemented (v0.1)

### ✅ Authentication & User Management
- **Dual Authentication:** Email/password + Google OAuth
- **Session Management:** Secure JWT-based sessions with NextAuth.js
- **Route Protection:** Middleware-based access control
- **Password Security:** Bcrypt hashing with salt rounds

### ✅ 16-Question KYC Onboarding
- **7-Step Professional UI** with smooth transitions
- **Multi-select Support** for array fields (platforms, channels, etc.)
- **Real-time Validation** with helpful error messages
- **Progress Tracking** with visual indicators
- **Embedded in User Document** for fast AI access

### ✅ MongoDB Schema Design (4 Collections)

#### 1. Users (with Embedded KYC)
```javascript
{
  email, password, authProvider, googleId,
  businessProfile: {
    businessType, industry, employeeCount,
    revenueTier, businessModel, averageOrderValue,
    audienceDemographic[], purchaseFrequency,
    acquisitionChannels[], activePlatforms[],
    skuCount, peakSeasonality[],
    primaryObjective, painPoints[],
    documentType, verificationStatus
  },
  hasCompletedKYC: Boolean
}
```

#### 2. Campaigns (The Canvas State)
```javascript
{
  userId, campaignName, status,
  strategicConcept: String,
  chatContext: [{ role, content, timestamp }],
  canvasState: {
    nodes: [{ id, type, data, position }],
    edges: [{ id, source, target }]
  },
  executionLog: [...]
}
```

#### 3. Tools (AI Capability Registry)
```javascript
{
  name, displayName, description, category,
  requiredInputs: JSONSchema,
  outputSchema: JSONSchema,
  apiHandler: String,
  costPerExecution: Number
}
```

#### 4. AnalyticsData (Time Series)
```javascript
{
  userId, transactionDate, sku,
  amount, quantity, customerId,
  customerSegment, channel, location,
  campaignId (optional)
}
```

---

## 🏗️ Architecture

### AI Agent Workflow

```
┌─────────────────────────────────────────┐
│ 1. User Prompt                          │
│ "Launch a campaign for my coffee shop" │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 2. Context Retrieval (MongoDB)         │
│ Fetch Users.businessProfile            │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 3. Phase 1: Abstract Reasoning (Gemini)│
│ Generate strategic concept              │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 4. Phase 2: Orchestration (Gemini)     │
│ Query Tools → Generate JSON workflow    │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 5. Storage (MongoDB)                    │
│ Save to Campaigns collection            │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 6. Rendering (ReactFlow)                │
│ Visualize workflow graph                │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 7. Execution (User clicks "Run")       │
│ Execute tools → Update outputs          │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Set Up Google OAuth
See [`INSTALLATION.md`](./INSTALLATION.md) for detailed steps.

Quick version:
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Add redirect: `http://localhost:3000/api/auth/callback/google`

### 4. Start Development Server
```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 📁 Project Structure

```
ChainForecast-Next-App/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js  # NextAuth config
│   │   └── kyc/route.js                 # KYC submission
│   ├── auth/page.js                     # Login/signup
│   ├── onboarding/page.js               # 7-step KYC flow
│   ├── dashboard/                       # (Coming soon)
│   └── assistant/                       # (Coming soon)
├── lib/
│   ├── mongodb.js                       # Connection handler
│   └── models/
│       ├── User.js                      # User + KYC schema
│       ├── Campaign.js                  # Campaign workflow
│       ├── Tool.js                      # AI capability registry
│       └── AnalyticsData.js             # Time series data
├── components/
│   ├── AuthProvider.jsx                 # Session wrapper
│   └── ui/                              # Shadcn components
├── middleware.js                        # Route protection
├── INSTALLATION.md                      # Setup guide
├── SETUP_GUIDE.md                       # Detailed instructions
├── ARCHITECTURE.md                      # System design
├── QUICKSTART.md                        # Quick reference
└── TODO.md                              # Development roadmap
```

---

## 📊 KYC Questions (16 Total in 7 Steps)

| Step | Category | Questions | Type |
|------|----------|-----------|------|
| 1 | Business Identity | Business type, Industry, Employees | Single select |
| 2 | Financial Overview | Revenue, Model, Avg order value | Single select |
| 3 | Target Audience | Demographics, Purchase frequency | Multi + Single |
| 4 | Marketing Strategy | Channels, Platforms | Multi + Multi |
| 5 | Operations | SKU count, Seasonality | Single + Multi |
| 6 | Business Goals | Objective, Pain points | Single + Multi |
| 7 | Verification | Document type | Single select |

---

## 🔐 Authentication Flow

```
User visits /auth
    ↓
Chooses Email/Password OR Google
    ↓
NextAuth validates & creates session
    ↓
Middleware checks hasCompletedKYC
    ↓
    ├─ false → /onboarding (7-step KYC)
    └─ true → /dashboard
```

---

## 🧪 Testing

### Test Authentication
```bash
# 1. Go to http://localhost:3000/auth
# 2. Try signing up with email/password
# 3. Try "Continue with Google"
```

### Test KYC Flow
```bash
# 1. After signup → redirects to /onboarding
# 2. Complete all 7 steps (16 questions)
# 3. Should redirect to /dashboard
```

### Verify Database
Use MongoDB Compass or Atlas UI to check Users collection:
```json
{
  "email": "user@example.com",
  "hasCompletedKYC": true,
  "businessProfile": { ... }
}
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [`INSTALLATION.md`](./INSTALLATION.md) | Complete setup with troubleshooting |
| [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) | Google OAuth, MongoDB, security |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System design and data flow |
| [`QUICKSTART.md`](./QUICKSTART.md) | Quick reference guide |
| [`TODO.md`](./TODO.md) | Development roadmap |
| [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) | What's been built |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js
- **UI Components:** Shadcn/UI + Radix UI
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Validation:** Zod (coming)
- **AI:** Gemini API (coming)
- **Workflow:** ReactFlow (coming)

---

## 🎯 Roadmap

### Phase 1: Core Dashboard ✅ → 🚧
- [x] Authentication system
- [x] KYC onboarding
- [ ] Dashboard layout
- [ ] AI assistant interface

### Phase 2: AI Integration 🚧
- [ ] Gemini API integration
- [ ] Strategic concept generation
- [ ] Workflow JSON generation
- [ ] Tools collection population

### Phase 3: Workflow Canvas 🚧
- [ ] ReactFlow integration
- [ ] Custom node types
- [ ] Node editing
- [ ] Execution engine

### Phase 4: Analytics & Forecasting ⏳
- [ ] Data ingestion
- [ ] Time series forecasting
- [ ] Dashboard charts
- [ ] Performance tracking

See [`TODO.md`](./TODO.md) for complete roadmap.

---

## 🔒 Security

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT-based sessions
- ✅ Protected API routes
- ✅ Middleware route guards
- ✅ Environment variable validation
- 🚧 Rate limiting (coming)
- 🚧 CSRF protection (coming)

---

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Application Structure

- **Homepage** (`/`): Overview of platform features and capabilities
- **Dashboard** (`/dashboard`): Sales forecasts, customer segments, and campaign offers
- **Assistant** (`/assistant`): Agentic AI workflow executor for campaigns
- **Login** (`/login`): Secure authentication portal

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
