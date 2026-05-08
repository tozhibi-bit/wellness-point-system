export const POINT_TO_YEN = 1000;
export const MAX_POINT_RATIO = 0.5;

export function yen(n: number): string {
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}

export function pt(n: number): string {
  return n.toLocaleString("ja-JP") + " pt";
}

export function getCurrentYearMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMaxPointsByPrice(priceYen: number): number {
  return Math.floor((priceYen * MAX_POINT_RATIO) / POINT_TO_YEN);
}

export function calculateOwnPayment(priceYen: number, points: number): number {
  return priceYen - points * POINT_TO_YEN;
}

export function validatePoints(
  points: number,
  priceYen: number,
  remainingPoints: number
): { valid: true } | { valid: false; reason: string } {
  if (!Number.isInteger(points)) {
    return { valid: false, reason: "ポイントは整数で指定してください" };
  }
  if (points < 0) {
    return { valid: false, reason: "ポイントは0以上で指定してください" };
  }
  const maxByPrice = getMaxPointsByPrice(priceYen);
  if (points > maxByPrice) {
    return {
      valid: false,
      reason: `このサービスは最大${maxByPrice}ポイントまで利用可能です`,
    };
  }
  if (points > remainingPoints) {
    return {
      valid: false,
      reason: `残ポイント不足です(残${remainingPoints}pt)`,
    };
  }
  return { valid: true };
}

export function formatDateJP(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function getMonthLastDay(yearMonth: string): Date {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 0);
}

export function generateInvoiceDisplayId(yearMonth: string, merchantDisplayId: string): string {
  return `INV-${yearMonth.replace("-", "")}-${merchantDisplayId}`;
}
