# 🚀 ChainForecast - Installation & Setup

## Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **MongoDB** - Either local or MongoDB Atlas account
- **Google Cloud Console** account (for OAuth)
- **Git** installed

---

## 📦 Step 1: Install Dependencies

```bash
# Navigate to project directory
cd ChainForecast-Next-App

# Install all required packages
npm install
```

This will install:
- `next-auth` - Authentication
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- All existing dependencies

---

## 🗄️ Step 2: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended - Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free"
3. Create account or sign in
4. Create a new project
5. Build a database:
   - Choose "M0 Free" tier
   - Select region closest to you
   - Click "Create"
6. Create database user:
   - Username: `chainforecast`
   - Password: Generate strong password (save it!)
7. Add IP Access:
   - Click "Network Access"
   - Add IP: `0.0.0.0/0` (allows all - for development)
   - In production, restrict to specific IPs
8. Get connection string:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `chainforecast`

**Your connection string should look like:**
```
mongodb+srv://chainforecast:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/chainforecast?retryWrites=true&w=majority
```

### Option B: Local MongoDB

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Run installer
# Start MongoDB as service or manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**macOS:**
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update packages
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

**Local connection string:**
```
mongodb://localhost:27017/chainforecast
```

---

## 🔑 Step 3: Set Up Google OAuth

### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Project name: `ChainForecast`
4. Click "Create"

### Enable Google+ API

1. In sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Click "Create"
4. Fill in required fields:
   - **App name:** ChainForecast
   - **User support email:** your-email@example.com
   - **Developer contact:** your-email@example.com
5. Click "Save and Continue"
6. Skip "Scopes" (click "Save and Continue")
7. Skip "Test users" (click "Save and Continue")
8. Click "Back to Dashboard"

### Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: `ChainForecast Web Client`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
   (Add production URL later, e.g., `https://chainforecast.com`)

6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (Add production URL later, e.g., `https://chainforecast.com/api/auth/callback/google`)

7. Click "Create"

### Save Your Credentials

You'll see a modal with:
- **Client ID** - e.g., `123456789-abc123.apps.googleusercontent.com`
- **Client Secret** - e.g., `GOCSPX-abc123xyz789`

⚠️ **Important:** Keep these secret! Don't commit to Git!

---

## 🌍 Step 4: Configure Environment Variables

### Create `.env.local` file

```bash
# Copy the example file
cp .env.local.example .env.local
```

### Edit `.env.local`

Open the file and add your credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://chainforecast:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/chainforecast?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789

# Gemini API (Optional - for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

### Generate NEXTAUTH_SECRET

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

---

## ✅ Step 5: Verify Setup

### Test MongoDB Connection

Create a test file `test-db.js`:
```javascript
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
```

Run it:
```bash
node test-db.js
```

You should see: `✅ MongoDB connected successfully!`

### Verify Environment Variables

Create `test-env.js`:
```javascript
require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'MONGODB_URI',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

console.log('Checking environment variables...\n');

let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`);
  } else {
    console.log(`❌ ${varName}: Missing!`);
    allPresent = false;
  }
});

console.log(allPresent ? '\n✅ All environment variables are set!' : '\n❌ Some variables are missing!');
```

Run it:
```bash
node test-env.js
```

---

## 🚀 Step 6: Start Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

---

## 🧪 Step 7: Test the Application

### Test Authentication

1. Open browser: `http://localhost:3000`
2. Navigate to `/auth` (or click login)
3. **Test Email/Password:**
   - Enter email and password
   - Click "Sign Up"
   - Should redirect to `/onboarding`

4. **Test Google OAuth:**
   - Click "Continue with Google"
   - Select Google account
   - Should redirect to `/onboarding`

### Test KYC Flow

1. After signup, you should be on `/onboarding`
2. Complete all 7 steps:
   - Answer all questions in each step
   - Click "Next" to proceed
   - Use "Back" to go back if needed
3. On final step, click "Complete Setup"
4. Should redirect to `/dashboard`

### Test Protected Routes

1. Log out (if implemented) or clear cookies
2. Try accessing `/dashboard`
3. Should redirect to `/auth`
4. Log in and complete KYC
5. Try accessing `/onboarding`
6. Should redirect to `/dashboard`

### Verify Database

Use MongoDB Compass or Atlas UI to check:

1. **Users collection** should have your user:
   ```json
   {
     "_id": "...",
     "email": "your@email.com",
     "hasCompletedKYC": true,
     "businessProfile": {
       "businessType": "...",
       "industry": "...",
       ...
     }
   }
   ```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongooseServerSelectionError`

**Solutions:**
1. Check MongoDB is running (if local)
2. Verify connection string is correct
3. Check IP whitelist in Atlas (0.0.0.0/0 for dev)
4. Ensure password doesn't have special characters (URL encode if needed)

**Test connection:**
```bash
# From MongoDB Compass
# Or use mongosh
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/chainforecast" --username chainforecast
```

### Google OAuth Issues

**Error:** `redirect_uri_mismatch`

**Solution:**
- Verify redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- No trailing slash
- Check for typos
- Try incognito mode (clear cache)

**Error:** `access_denied`

**Solution:**
- Ensure OAuth consent screen is configured
- Check Google+ API is enabled
- Verify in "APIs & Services" → "Credentials"

### NextAuth Issues

**Error:** `[next-auth][error][NO_SECRET]`

**Solution:**
- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Generate a new secret with `openssl rand -base64 32`
- Restart dev server after changing env vars

**Error:** Session not persisting

**Solution:**
- Clear browser cookies
- Check `NEXTAUTH_URL` matches your URL
- Ensure secure cookies are disabled in dev (automatic)

### KYC Data Not Saving

**Check browser console:**
```
POST /api/kyc 401 Unauthorized
```
**Solution:** Session expired, log in again

```
POST /api/kyc 500 Internal Server Error
```
**Solution:** Check server logs, MongoDB connection issue

**Check server logs:**
```bash
# Look for errors in terminal where npm run dev is running
```

### Page Shows "This page could not be found"

**Common causes:**
1. File not in `app/` directory
2. Typo in route name
3. Missing `page.js` file
4. Dev server needs restart

**Solution:**
```bash
# Stop dev server (Ctrl+C)
# Clear .next folder
rm -rf .next  # macOS/Linux
rmdir /s .next  # Windows

# Restart
npm run dev
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change `NEXTAUTH_SECRET` to a strong, unique value
- [ ] Restrict MongoDB IP whitelist to production server IPs
- [ ] Update Google OAuth redirect URIs with production URLs
- [ ] Set secure cookie options in NextAuth (automatic in production)
- [ ] Enable HTTPS
- [ ] Add rate limiting to API routes
- [ ] Implement CSRF protection
- [ ] Review and remove console.log statements
- [ ] Set up error monitoring (Sentry, etc.)

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check terminal logs** for error messages
2. **Check browser console** (F12) for client-side errors
3. **Review MongoDB logs** in Atlas dashboard
4. **Verify environment variables** are set correctly
5. **Clear `.next` folder** and restart dev server
6. **Check GitHub Issues** for similar problems

---

## ✅ Success!

If you see the dashboard after completing KYC, everything is working! 🎉

**Next Steps:**
- Read `TODO.md` for feature roadmap
- Review `ARCHITECTURE.md` for system design
- Start building the AI assistant (see `TODO.md` Phase 2)

---

**Installation complete! Ready to build AI-powered campaigns! 🚀**
