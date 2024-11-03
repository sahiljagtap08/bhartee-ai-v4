/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "crypto": false,
      };
    }
    return config;
  },
  // If you're using experimental features, ensure they're compatible
  experimental: {
    appDir: true,
  }
}

module.exports = nextConfig;
