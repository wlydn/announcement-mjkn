import { put } from '@vercel/blob';
import formidable from 'formidable';
import { readFile } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Penting: Nonaktifkan body parser default Vercel
  },
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Check if Vercel Blob token is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Vercel Blob configuration missing: BLOB_READ_WRITE_TOKEN not found');
    return res.status(500).json({ 
      message: 'Server configuration error: Vercel Blob token not found',
      error: 'Missing BLOB_READ_WRITE_TOKEN environment variable'
    });
  }

  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50MB limit
    keepExtensions: true,
  });

  try {
    const [fields, files] = await form.parse(req);
    console.log('Parsed files:', Object.keys(files));
    console.log('Files structure:', files);

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

    // Read file buffer from temporary path
    const fileBuffer = await readFile(audioFile.filepath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = audioFile.originalFilename.split('.').pop() || 'mp3';
    const filename = `announcements/announcement_${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: audioFile.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('Vercel Blob upload successful:', blob.url);

    res.status(200).json({
      message: 'File uploaded successfully to Vercel Blob!',
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    });
  } catch (error) {
    console.error('Upload error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific Vercel Blob errors
    let errorMessage = 'File upload failed';
    if (error.message.includes('token')) {
      errorMessage = 'Vercel Blob authentication failed. Check BLOB_READ_WRITE_TOKEN.';
    } else if (error.message.includes('size')) {
      errorMessage = 'File size exceeds limit.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error during upload. Please try again.';
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
    