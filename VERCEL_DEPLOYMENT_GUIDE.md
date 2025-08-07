# Vercel Blob Configuration - Complete Setup Guide

## ✅ What's Been Fixed

1. **Removed Cloudinary dependencies** from server.js
2. **Created .env.local** for local development
3. **Updated next.config.js** for proper environment variable handling
4. **Simplified server.js** to only serve static files

## 🚀 Next Steps to Complete Setup

### Step 1: Get Your Vercel Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on **Storage** tab
4. If you don't have a Blob store yet:
   - Click **Create Database** → **Blob**
   - Follow the setup wizard
5. Copy the **BLOB_READ_WRITE_TOKEN**

### Step 2: Configure Local Environment

1. Open the `.env.local` file in your project root
2. Replace `your_vercel_blob_token_here` with your actual token:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
   ```

### Step 3: Configure Vercel Production Environment

1. In your Vercel Dashboard → Project → **Settings**
2. Go to **Environment Variables**
3. Add new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Your Vercel Blob token
   - **Environment**: Production (or All)
4. Click **Save**

### Step 4: Test Locally

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Test upload functionality at http://localhost:3000
```

### Step 5: Deploy to Production

```bash
# Deploy to Vercel
vercel --prod

# Or if using Git integration, just push to main branch
git add .
git commit -m "Fix Vercel Blob configuration"
git push origin main
```

## 🔧 API Endpoints

Your app now uses these Next.js API routes:

- **Upload**: `POST /api/upload` (pages/api/upload.js)
- **List Files**: `GET /api/list` (pages/api/list.js)

## 🐛 Troubleshooting

### Error: "Missing BLOB_READ_WRITE_TOKEN"
- ✅ Check `.env.local` for local development
- ✅ Check Vercel Dashboard → Settings → Environment Variables for production
- ✅ Redeploy after adding environment variables

### Error: "Network error during upload"
- ✅ Verify token is correct and active
- ✅ Check Vercel status page
- ✅ Ensure file size is under 50MB limit

### Error: "Invalid file type"
- ✅ Only audio files are accepted (audio/*)
- ✅ Supported formats: MP3, WAV, M4A, etc.

## 📁 File Structure

```
announcement-mjkn/
├── .env.local                 # ✅ Local environment variables
├── next.config.js            # ✅ Updated for Vercel Blob
├── server.js                 # ✅ Simplified (no Cloudinary)
├── pages/api/
│   ├── upload.js            # ✅ Vercel Blob upload
│   └── list.js              # ✅ Vercel Blob list
└── scripts/
    └── cleanup-blob.js      # Cleanup utility
```

## 🎯 What Changed

### Before (Cloudinary):
- Used Cloudinary for file storage
- Required CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Files stored in Cloudinary cloud

### After (Vercel Blob):
- Uses Vercel Blob for file storage
- Only requires BLOB_READ_WRITE_TOKEN
- Files stored in Vercel Blob storage
- Better integration with Vercel platform
- Unlimited bandwidth for Vercel deployments

## 💰 Cost Comparison

**Vercel Blob:**
- $0.15 per GB stored per month
- Unlimited bandwidth on Vercel
- 500MB file size limit

**Benefits:**
- ✅ Native Vercel integration
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Pay-per-use model
