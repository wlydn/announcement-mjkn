/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Handle static files and API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Environment variables for client-side (if needed)
  env: {
    CUSTOM_KEY: 'announcement-app',
  },
  
  // Ensure environment variables are available in API routes
  serverRuntimeConfig: {
    // Will only be available on the server side
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
  
  // Configure for Vercel deployment
  experimental: {
    // Enable server components if needed
    serverComponentsExternalPackages: ['@vercel/blob'],
  },
};

module.exports = nextConfig;
