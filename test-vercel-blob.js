// Test script to verify Vercel Blob configuration
// Run with: node test-vercel-blob.js

require('dotenv').config({ path: '.env.local' });

async function testVercelBlobConfig() {
  console.log('🔍 Testing Vercel Blob Configuration...\n');
  
  // Check environment variable
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.log('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
    console.log('📝 Please check your .env.local file');
    return false;
  }
  
  if (token === 'your_vercel_blob_token_here') {
    console.log('❌ BLOB_READ_WRITE_TOKEN is still set to placeholder value');
    console.log('📝 Please replace with your actual Vercel Blob token');
    return false;
  }
  
  console.log('✅ BLOB_READ_WRITE_TOKEN found');
  console.log(`📋 Token: ${token.substring(0, 20)}...`);
  
  // Test Vercel Blob connection
  try {
    const { list } = require('@vercel/blob');
    
    console.log('\n🔗 Testing connection to Vercel Blob...');
    
    const { blobs } = await list({
      prefix: 'announcements/',
      token: token,
    });
    
    console.log('✅ Successfully connected to Vercel Blob');
    console.log(`📁 Found ${blobs.length} files in announcements/ folder`);
    
    if (blobs.length > 0) {
      console.log('\n📋 Recent files:');
      blobs.slice(0, 3).forEach((blob, index) => {
        console.log(`   ${index + 1}. ${blob.pathname} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Failed to connect to Vercel Blob');
    console.log(`🔥 Error: ${error.message}`);
    
    if (error.message.includes('token')) {
      console.log('💡 Suggestion: Check if your BLOB_READ_WRITE_TOKEN is correct');
    } else if (error.message.includes('network')) {
      console.log('💡 Suggestion: Check your internet connection');
    }
    
    return false;
  }
}

// Run the test
testVercelBlobConfig()
  .then(success => {
    if (success) {
      console.log('\n🎉 Vercel Blob configuration is working correctly!');
      console.log('🚀 You can now run: npm run dev');
    } else {
      console.log('\n🔧 Please fix the configuration issues above');
    }
  })
  .catch(error => {
    console.log('\n💥 Unexpected error:', error.message);
  });
