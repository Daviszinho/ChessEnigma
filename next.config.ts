import type { NextConfig } from 'next';

// @ts-ignore
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for handlebars in Genkit/Azure deployment
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'handlebars': 'commonjs handlebars',
        '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger',
      });
    }

    // Ignore warnings about optional dependencies
    config.ignoreWarnings = [
      {
        module: /node_modules\/handlebars/,
      },
      {
        module: /node_modules\/@opentelemetry/,
      },
    ];

    return config;
  },
};

export default withPWA(nextConfig);
