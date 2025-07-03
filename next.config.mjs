/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize for Tesseract.js and OCR functionality
  experimental: {
    optimizePackageImports: ['tesseract.js'],
  },
  // Handle WebAssembly for Tesseract.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    
    // Handle WebAssembly files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })
    
    return config
  },
}

export default nextConfig
