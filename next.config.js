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
  // Environment variables for client-side
  env: {
    CUSTOM_KEY: 'announcement-app',
  },
};

module.exports = nextConfig;
