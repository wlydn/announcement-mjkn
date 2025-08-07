const express = require('express');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const formidable = require('formidable');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.REACT_APP_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.REACT_APP_CLOUDINARY_API_SECRET,
});

// Upload API endpoint
app.post('/api/upload', async (req, res) => {
  // Check if Cloudinary is configured
  const cloudinaryConfig = cloudinary.config();
  if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    console.error('Cloudinary configuration missing:', {
      cloud_name: !!cloudinaryConfig.cloud_name,
      api_key: !!cloudinaryConfig.api_key,
      api_secret: !!cloudinaryConfig.api_secret
    });
    return res.status(500).json({ 
      message: 'Server configuration error: Cloudinary credentials not found',
      error: 'Missing Cloudinary configuration'
    });
  }

  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50MB limit
    keepExtensions: true,
  });

  try {
    const [fields, files] = await form.parse(req);
    console.log('Parsed files:', Object.keys(files));

    // Handle both single file and array formats
    let audioFile;
    if (files.audio) {
      audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    }

    if (!audioFile) {
      console.error('No audio file found in upload');
      return res.status(400).json({ 
        message: 'No audio file uploaded.',
        receivedFields: Object.keys(fields),
        receivedFiles: Object.keys(files)
      });
    }

    console.log('Audio file details:', {
      originalFilename: audioFile.originalFilename,
      mimetype: audioFile.mimetype,
      size: audioFile.size,
      filepath: audioFile.filepath
    });

    // Validate file type
    if (!audioFile.mimetype || !audioFile.mimetype.startsWith('audio/')) {
      return res.status(400).json({ 
        message: 'Invalid file type. Please upload an audio file.',
        receivedType: audioFile.mimetype
      });
    }

    const result = await cloudinary.uploader.upload(audioFile.filepath, {
      resource_type: 'video', // Gunakan 'video' untuk audio agar bisa di-stream
      folder: 'announcements', // Folder di Cloudinary
      format: 'mp3', // Pastikan formatnya mp3
      public_id: `announcement_${Date.now()}`, // Unique ID
    });

    console.log('Cloudinary upload successful:', result.public_id);

    res.status(200).json({
      message: 'File uploaded successfully!',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Upload error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      message: 'File upload failed', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve React app for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Fallback for other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Cloudinary configured: ${!!cloudinary.config().cloud_name}`);
});
