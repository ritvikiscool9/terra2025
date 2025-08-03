import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Configure webpack for Windows compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Disable file system caching that can cause permission issues
    config.cache = false;
    
    return config;
  },
  
  // Disable source maps in production to reduce file I/O
  productionBrowserSourceMaps: false,
  
  // Reduce build output for better Windows compatibility
  generateBuildId: async () => {
    return 'build';
  },
};

export default nextConfig;
