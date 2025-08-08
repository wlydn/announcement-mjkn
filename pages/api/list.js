import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ 
        message: 'Server configuration error: BLOB_READ_WRITE_TOKEN not found',
        error: 'Missing BLOB_READ_WRITE_TOKEN environment variable'
      });
    }

    // List all blobs with prefix 'announcements/'
    const { blobs } = await list({
      prefix: 'announcements/',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Transform blob data to match our announcement format
    const announcements = blobs.map(blob => ({
      name: blob.pathname.replace('announcements/', '').replace(/\.[^/.]+$/, ''), // Remove folder and extension
      url: blob.url,
      public_id: blob.pathname, // Use pathname as public_id for deletion
      uploadedAt: blob.uploadedAt,
      size: blob.size
    }));

    // Sort by upload date (newest first)
    announcements.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    console.log(`Found ${announcements.length} announcements in Vercel Blob storage`);

    res.status(200).json({
      message: 'Files retrieved successfully',
      announcements: announcements,
      count: announcements.length
    });

  } catch (error) {
    console.error('Error listing files from Vercel Blob:', error);
    
    let errorMessage = 'Failed to retrieve files from storage';
    
    if (error.message.includes('token')) {
      errorMessage = 'Invalid or missing BLOB_READ_WRITE_TOKEN';
    } else if (error.message.includes('network') || error.code === 'ENOTFOUND') {
      errorMessage = 'Network error: Unable to connect to Vercel Blob storage';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'production' ? error.stack : undefined
    });
  }
}
