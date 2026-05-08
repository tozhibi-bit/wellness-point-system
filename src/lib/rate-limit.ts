/**
 * 簡易レート制限(インメモリ実装)
 *
 * 注意: マルチインスタンスデプロイ(複数サーバー)では機能しません。
 * 本番運用ではRedis等の外部ストアを使った実装が望ましいです。
 * または、Cloudflare/Vercelなどのインフラ層でレート制限してください。
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// 古いエントリを定期的にクリーンアップ
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
    }
  }
}

/**
 * レート制限を適用します。
 *
 * @param key 識別子(例: IP+pathname)
 * @param limit 期間内の最大リクエスト数
 * @param windowMs 期間(ミリ秒)
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const newBucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, newBucket);
    return { allowed: true, remaining: limit - 1, resetAt: newBucket.resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/**
 * リクエストからクライアントIPを取得します。
 * プロキシ経由の場合は X-Forwarded-For を優先。
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
