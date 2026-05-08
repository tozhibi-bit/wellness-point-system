const BOM = "\uFEFF";

/**
 * CSVのフィールドをエスケープし、Formula Injection (CSVインジェクション)を防ぎます。
 *
 * Excel等で開いた際に "=", "+", "-", "@", "Tab", "CR" で始まる値が
 * 数式として解釈され、外部コマンドを実行される脆弱性があるため、
 * これらの文字で始まる場合は先頭にシングルクォートを付与します。
 *
 * 参考: https://owasp.org/www-community/attacks/CSV_Injection
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // Formula Injection対策: 危険な先頭文字を無効化
  if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}

export function withBom(csv: string): string {
  return BOM + csv;
}

export function csvResponse(csv: string, filename: string): Response {
  const safeFilename = encodeURIComponent(filename);
  return new Response(withBom(csv), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function formatDateForCsv(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
