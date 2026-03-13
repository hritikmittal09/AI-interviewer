/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'formidable'],
  },
  api: {
    bodyParser: false,
  },
}

module.exports = nextConfig
