/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  instrumentationHook: true,
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
