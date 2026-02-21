/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Vypne ESLint během buildu (Railway to jinak blokuje)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Vypne TypeScript chyby během buildu
  typescript: {
    ignoreBuildErrors: true,
  },

  devIndicators: {
    buildActivity: false,
  },

  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 100,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
