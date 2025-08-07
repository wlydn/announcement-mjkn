/**
 * Script untuk membersihkan file lama dari Vercel Blob Storage
 * Jalankan dengan: node scripts/cleanup-blob.js
 */

import { list, del } from '@vercel/blob';

async function cleanupOldFiles() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log('🔍 Fetching all files from Vercel Blob...');
    
    // List all files in the announcements folder
    const { blobs } = await list({
      prefix: 'announcements/',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (blobs.length === 0) {
      console.log('✅ No files found in announcements folder');
      return;
    }

    console.log(`📁 Found ${blobs.length} files:`);
    blobs.forEach((blob, index) => {
      const uploadDate = new Date(blob.uploadedAt);
      console.log(`${index + 1}. ${blob.pathname} (${blob.size} bytes, uploaded: ${uploadDate.toLocaleDateString()})`);
    });

    // Optional: Delete files older than X days
    const DAYS_TO_KEEP = 30; // Keep files for 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

    const filesToDelete = blobs.filter(blob => new Date(blob.uploadedAt) < cutoffDate);

    if (filesToDelete.length === 0) {
      console.log(`✅ No files older than ${DAYS_TO_KEEP} days found`);
      return;
    }

    console.log(`\n🗑️  Found ${filesToDelete.length} files older than ${DAYS_TO_KEEP} days:`);
    filesToDelete.forEach((blob, index) => {
      const uploadDate = new Date(blob.uploadedAt);
      console.log(`${index + 1}. ${blob.pathname} (uploaded: ${uploadDate.toLocaleDateString()})`);
    });

    // Uncomment the following lines to actually delete the files
    // WARNING: This will permanently delete the files!
    
    /*
    console.log('\n⚠️  Deleting old files...');
    for (const blob of filesToDelete) {
      try {
        await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
        console.log(`✅ Deleted: ${blob.pathname}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${blob.pathname}:`, error.message);
      }
    }
    console.log('🎉 Cleanup completed!');
    */

    console.log('\n💡 To actually delete these files, uncomment the deletion code in this script');
    console.log('⚠️  WARNING: Deletion is permanent and cannot be undone!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOldFiles();
