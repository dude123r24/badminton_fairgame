/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // PWA configuration
  experimental: {
    webpackBuildWorker: true,
  },
}

module.exports = nextConfig
