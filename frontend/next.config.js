/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Allow dev origins for cross-origin requests
  allowedDevOrigins: ['http://207.180.240.247:3000', 'http://localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:8000/api/:path*',
      },
      // Note: WebSocket connections are made directly from the client
      // using NEXT_PUBLIC_WS_URL environment variable in useWebSocket hook
    ]
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
}

module.exports = nextConfig
