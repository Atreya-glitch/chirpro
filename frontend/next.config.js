/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      'genkit',
      '@genkit-ai/core',
      '@genkit-ai/google-genai',
      '@opentelemetry/sdk-node',
      '@opentelemetry/instrumentation',
      '@opentelemetry/exporter-jaeger',
      'require-in-the-middle',
    ],
  },
};

module.exports = nextConfig;
