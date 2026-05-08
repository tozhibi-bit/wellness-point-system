/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // クリックジャッキング防止
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // MIMEタイプスニッフィング防止
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // XSSフィルタ(古いブラウザ向け)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // リファラ情報を最小限に
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // ブラウザの不要なAPIを無効化
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HTTPS強制(本番でHTTPS使う場合のみ有効)
          // {
          //   key: "Strict-Transport-Security",
          //   value: "max-age=63072000; includeSubDomains; preload",
          // },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
