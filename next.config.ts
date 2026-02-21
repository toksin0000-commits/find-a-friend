/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
  },
  onDemandEntries: {
    // vypne automatické reloading při změně souborů
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 100,
  },
  compiler: {
    // Odstraní všechny console.* pouze v produkčním buildu
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;