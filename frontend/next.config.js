/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // すべてのルートにヘッダーを適用
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://*.google.com https://*.google.co.jp https://service-by-aoichan.vercel.app https://*.googleapis.com; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://service-by-aoichan.vercel.app',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  // APIエンドポイントのリワイト
  async rewrites() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // プロダクション環境ではRenderのバックエンドAPIを使用
    const productionRewrites = [
      {
        source: '/api/suggestions',
        destination: 'https://seo-suggest-tool.onrender.com/api/suggestions',
      },
      {
        source: '/api/longtail-suggestions',
        destination: 'https://seo-suggest-tool.onrender.com/api/longtail-suggestions',
      },
      {
        source: '/api/yahoo-suggestions',
        destination: 'https://seo-suggest-tool.onrender.com/api/yahoo-suggestions',
      },
    ];
    
    // 開発環境ではローカルのAPIを使用
    const devRewrites = [
      {
        source: '/api/suggestions',
        destination: 'http://localhost:5000/api/suggestions',
      },
      {
        source: '/api/longtail-suggestions',
        destination: 'http://localhost:5000/api/longtail-suggestions',
      },
      {
        source: '/api/yahoo-suggestions',
        destination: 'http://localhost:5000/api/yahoo-suggestions',
      },
    ];
    
    return isProduction ? productionRewrites : devRewrites;
  },
  // APIルートのエラーハンドリングを改善
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1時間
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig 