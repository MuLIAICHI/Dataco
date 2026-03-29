/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow fetching chart images served by the FastAPI backend
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "*.railway.app" },
    ],
  },
};

module.exports = nextConfig;
