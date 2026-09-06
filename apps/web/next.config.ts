import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@healthinance/types'],
  reactStrictMode: true,
};

export default nextConfig;
