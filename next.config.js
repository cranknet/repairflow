/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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

