/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@website-chat/ui': '../../packages/ui/src',
        '@website-chat/shared': '../../packages/shared/src',
      },
    },
  },
  transpilePackages: [
    '@website-chat/ui',
    '@website-chat/shared',
  ],
}

module.exports = nextConfig