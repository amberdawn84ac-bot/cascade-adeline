import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
        pathname: '/books/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gutenberg.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'standardebooks.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'archive.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
