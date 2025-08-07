const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Note: API routes are now handled by Next.js in pages/api/
// This server is only for serving the React build files

// Serve React app for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Fallback for other routes (SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Vercel Blob configured: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);
});
