/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/uploader',
  assetPrefix: '/uploader',   // helps with static assets
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
