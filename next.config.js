/** @type {import('next').NextConfig} */
const nextConfig = {
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

