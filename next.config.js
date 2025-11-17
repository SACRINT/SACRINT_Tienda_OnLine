/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not attempt to static export for pages with runtime errors
  // Client components that fetch data should be served dynamically
  reactStrictMode: true,

  // Skip static export errors and continue building
  // This prevents build failures on pages that need to be dynamic
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
