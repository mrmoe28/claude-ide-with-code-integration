import type { NextConfig } from "next";

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Experimental features for better performance
  experimental: {
    // Enable App Router optimizations
    optimizePackageImports: ['lucide-react', '@monaco-editor/react'],
    // Enable React 19 features
    reactCompiler: false, // Keep false for now until stable
  },
  
  // External packages for server components
  serverExternalPackages: [],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          monaco: {
            test: /[\\/]node_modules[\\/]@monaco-editor[\\/]/,
            name: 'monaco',
            chunks: 'all',
          },
          xterm: {
            test: /[\\/]node_modules[\\/]@xterm[\\/]/,
            name: 'xterm',
            chunks: 'all',
          },
        },
      },
    };

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // Reduce bundle size by using optimized builds
      'react': 'react',
      'react-dom': 'react-dom',
    };

    return config;
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Required for SharedArrayBuffer support
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
