/** @type {import('next').NextConfig} */
const nextConfig = {
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
            value: 'camera=(), microphone=(), geolocation=()',
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

module.exports = nextConfig

