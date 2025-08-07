# File Upload Fix - Setup Guide

## Problem Fixed
The file upload was failing due to:
1. Missing Cloudinary configuration
2. Incorrect API route structure for React app
3. Poor error handling
4. CORS issues

## Solution Implemented
1. **Express Server**: Created `server.js` with proper file upload handling
2. **Enhanced Error Handling**: Better error messages and debugging
3. **Cloudinary Integration**: Proper configuration with fallback options
4. **CORS Support**: Added cross-origin request support

## Setup Instructions

### 1. Install Dependencies
```bash
npm install express cors cloudinary formidable axios
```

### 2. Configure Cloudinary
Create a `.env.local` file with your Cloudinary credentials:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**How to get Cloudinary credentials:**
1. Go to https://cloudinary.com/
2. Sign up for a free account
3. Go to Dashboard
4. Copy your Cloud Name, API Key, and API Secret

### 3. Build the React App
```bash
npm run build
```

### 4. Start the Server
```bash
npm start
```
or
```bash
npm run server
```

The app will run on http://localhost:3001

## File Structure
```
announcement-app/
├── server.js              # Express server with upload API
├── src/                   # React source files
├── build/                 # React build output
├── api/upload.js          # Original API file (backup)
├── pages/                 # Next.js structure (alternative)
└── .env.local            # Environment variables
```

## Testing the Upload
1. Start the server: `npm start`
2. Open http://localhost:3001
3. Try uploading an audio file (MP3, WAV, etc.)
4. Check browser console for detailed error messages if upload fails

## Troubleshooting

### "Cloudinary credentials not found"
- Make sure `.env.local` file exists with correct credentials
- Restart the server after adding environment variables

### "Cannot connect to server"
- Make sure the server is running on port 3001
- Check if another process is using the port

### "File too large"
- Maximum file size is 50MB
- Use smaller audio files or compress them

### CORS Errors
- The server includes CORS headers, but if issues persist, check browser console

## Alternative: Next.js Setup
If you prefer Next.js, the files in `pages/` directory provide a Next.js structure:
1. Use `npm run dev` instead of `npm start`
2. The API will be available at `/api/upload`
