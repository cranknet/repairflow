/** @type {import('next').NextConfig} */

// Serwist PWA configuration
const withSerwistInit = require("@serwist/next").default;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disable PWA in development for faster builds
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // Performance optimization
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: http://localhost https:; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configure turbopack to use the correct project root
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    // Exclude serialport from webpack bundling (native module)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'serialport': 'commonjs serialport',
        '@serialport/parser-readline': 'commonjs @serialport/parser-readline',
      });
    }
    return config;
  },
}

// Wrap with bundle analyzer if ANALYZE env var is set
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Chain the wrappers: Serwist -> Bundle Analyzer -> Next Config
module.exports = withSerwist(withBundleAnalyzer(nextConfig));
