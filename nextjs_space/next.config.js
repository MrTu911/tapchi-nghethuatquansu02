const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Gói WASM/native: để Next require runtime từ node_modules thay vì bundle (tránh vỡ worker/pdfjs .mjs).
    serverComponentsExternalPackages: ['tesseract.js', 'pdf-parse'],
    // Đảm bảo font tiếng Việt (.ttf) được đóng gói cùng route xuất PDF khi build standalone.
    outputFileTracingIncludes: {
      '/api/reports/publications/export': ['./lib/fonts/*.ttf'],
    },
  },
  // `next start` không serve file thêm vào public/ sau khi khởi động, nên mọi
  // file upload runtime (video, ảnh, podcast...) phải đi qua route đọc-đĩa.
  // beforeFiles để chặn trước bước serve static của Next.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/uploads/:path*', destination: '/api/uploads/:path*' },
      ],
    }
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
