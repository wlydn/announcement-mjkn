import { del } from '@vercel/blob';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

    const { url, pathname } = req.body;

    if (!url && !pathname) {
      return res.status(400).json({ 
        message: 'Missing required parameter: url or pathname is required for deletion'
      });
    }

    console.log('Attempting to delete from Vercel Blob:', { url, pathname });

    // Delete from Vercel Blob using URL or pathname
    const deleteTarget = url || pathname;
    await del(deleteTarget, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('Successfully deleted from Vercel Blob:', deleteTarget);

    res.status(200).json({
      message: 'File deleted successfully from Vercel Blob storage',
      deleted: deleteTarget
    });

  } catch (error) {
    console.error('Delete error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific Vercel Blob errors
    let errorMessage = 'Failed to delete file from storage';
    
    if (error.message.includes('token')) {
      errorMessage = 'Vercel Blob authentication failed. Check BLOB_READ_WRITE_TOKEN.';
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      errorMessage = 'File not found in storage. It may have already been deleted.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error during deletion. Please try again.';
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      details: process.env.NODE_ENV === 'production' ? error.stack : undefined
    });
  }
}
