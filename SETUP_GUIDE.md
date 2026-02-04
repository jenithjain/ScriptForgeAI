# ChainForecast Authentication & KYC Setup Guide

## Overview
This guide will help you set up the authentication system with MongoDB, Google OAuth, and the 16-question KYC onboarding flow.

---

## 📋 Prerequisites

1. **MongoDB** - Either local installation or MongoDB Atlas account
2. **Google Cloud Console** account for OAuth
3. **Node.js** 18+ installed

---

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
npm install next-auth@latest mongoose bcryptjs
```

### 2. MongoDB Setup

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password

#### Option B: Local MongoDB
```bash
# Install MongoDB locally
# Windows: Download from mongodb.com
# macOS: brew install mongodb-community
# Linux: sudo apt install mongodb

# Start MongoDB
mongod --dbpath /path/to/data/directory
```

### 3. Google OAuth Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "ChainForecast" → Create

#### Step 2: Enable Google+ API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click and Enable it

#### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen first if prompted:
   - User Type: External
   - App name: ChainForecast
   - User support email: your email
   - Developer contact: your email
   - Save and Continue through remaining steps
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: ChainForecast Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click Create

#### Step 4: Copy Credentials
You'll see:
- **Client ID** - starts with something like `123456789-abc...apps.googleusercontent.com`
- **Client Secret** - a random string

⚠️ **Keep these secret!** Never commit them to Git.

### 4. Environment Variables Setup

Create a `.env.local` file in your project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chainforecast

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-this-with-command-below

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
```

#### Generate NEXTAUTH_SECRET:
```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🏗️ Database Schema

The system uses 4 main MongoDB collections:

### 1. **Users Collection** (with embedded KYC)
- Stores user credentials and business profile
- Supports both email/password and Google OAuth
- KYC data embedded for fast access during AI campaign generation

### 2. **Campaigns Collection**
- Stores AI-generated campaign workflows
- Contains ReactFlow graph state (nodes & edges)
- Tracks execution status and results

### 3. **Tools Collection**
- Registry of AI capabilities
- Defines available tools for campaign building

### 4. **AnalyticsData Collection** (Time Series)
- Transaction data for forecasting
- Optimized for retail analytics queries

---

## 🎯 KYC Flow (16 Questions in 7 Steps)

The onboarding process collects:

1. **Business Identity** (3 questions)
   - Business type, industry, employee count

2. **Financial Overview** (3 questions)
   - Revenue tier, business model, average order value

3. **Target Audience** (2 questions)
   - Demographics, purchase frequency

4. **Marketing Strategy** (2 questions)
   - Acquisition channels, active platforms

5. **Operations** (2 questions)
   - SKU count, peak seasonality

6. **Business Goals** (2 questions)
   - Primary objective, pain points

7. **Verification** (1 question)
   - Document type for business verification

---

## 🔐 Authentication Flow

### Sign Up Flow
1. User enters email/password OR clicks "Sign in with Google"
2. Account created in MongoDB
3. User redirected to `/onboarding`
4. Completes 7-step KYC process
5. KYC data saved to `businessProfile` in User document
6. User redirected to `/dashboard`

### Sign In Flow
1. User enters credentials OR uses Google
2. Session created
3. Middleware checks `hasCompletedKYC`:
   - If `false` → redirect to `/onboarding`
   - If `true` → redirect to `/dashboard`

---

## 🧪 Testing the Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Authentication
- Visit `http://localhost:3000/auth`
- Try signing up with email/password
- Try "Continue with Google"

### 3. Test KYC Flow
- After signup, you should be redirected to `/onboarding`
- Complete all 7 steps
- Verify redirect to `/dashboard` upon completion

### 4. Verify in MongoDB
Check your database for:
```javascript
// User document structure
{
  _id: ObjectId,
  email: "user@example.com",
  authProvider: "credentials" | "google",
  hasCompletedKYC: true,
  businessProfile: {
    businessType: "LLC",
    industry: "Retail",
    // ... all KYC fields
  }
}
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use strong NEXTAUTH_SECRET (minimum 32 characters)
3. Enable 2FA on Google Cloud Console
4. Rotate OAuth secrets periodically
5. Use HTTPS in production
6. Set secure cookie options in production:
   ```javascript
   cookies: {
     sessionToken: {
       name: `__Secure-next-auth.session-token`,
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: true // Only in production
       }
     }
   }
   ```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✓ Connected')).catch(e => console.error(e))"
```

### Google OAuth Not Working
- Verify redirect URI exactly matches (trailing slashes matter!)
- Check OAuth consent screen is configured
- Ensure Google+ API is enabled
- Try in incognito mode (cache issues)

### KYC Data Not Saving
- Check browser console for API errors
- Verify `/api/kyc` route is accessible
- Check MongoDB user has write permissions

---

## 📚 Key Files Created

- `lib/mongodb.js` - Database connection
- `lib/models/User.js` - User schema with KYC
- `lib/models/Campaign.js` - Campaign workflow schema
- `lib/models/Tool.js` - AI tool registry
- `lib/models/AnalyticsData.js` - Time series data
- `app/api/auth/[...nextauth]/route.js` - NextAuth configuration
- `app/api/kyc/route.js` - KYC submission endpoint
- `app/auth/page.js` - Login/signup page
- `app/onboarding/page.js` - 7-step KYC flow
- `middleware.js` - Route protection & KYC enforcement
- `components/AuthProvider.jsx` - Session provider wrapper

---

## 🎨 UI Features

- ✨ Smooth transitions between KYC steps
- 📊 Visual progress bar
- ✅ Step completion indicators
- 🎯 Multi-select for array fields
- 🔄 Back/forward navigation
- 💫 Professional gradient design
- 🌙 Dark theme optimized

---

## 🚀 Next Steps

After authentication is working:
1. Integrate Gemini API for campaign generation
2. Build ReactFlow canvas UI
3. Implement tool execution system
4. Add analytics dashboard
5. Create forecasting models

---

## 📞 Support

If you encounter issues:
1. Check console errors (Browser + Terminal)
2. Verify all environment variables are set
3. Test MongoDB connection independently
4. Review Google OAuth configuration

---

**Ready to build AI-powered campaigns! 🎉**
