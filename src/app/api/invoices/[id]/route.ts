import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yen } from "@/lib/points";
import { csvResponse, formatDateForCsv, rowsToCsv } from "@/lib/csv";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      merchant: true,
      transactions: {
        include: {
          employee: { select: { displayId: true, name: true } },
          service: true,
        },
        orderBy: { usedDate: "asc" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
  }

  const role = session.user.role;
  if (role === "admin" && invoice.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  if (role === "merchant" && invoice.merchantId !== session.user.merchantId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  if (role === "employee") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const format = req.nextUrl.searchParams.get("format");

  if (format === "csv-detail") {
    return generateDetailCsv(invoice);
  }
  if (format === "csv-summary") {
    return generateSummaryCsv(invoice);
  }

  const html = renderInvoiceHTML(invoice);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.displayId}.html"`,
    },
  });
}

type InvoiceData = Awaited<ReturnType<typeof getInvoiceWithRelations>>;
async function getInvoiceWithRelations(id: string) {
  return await prisma.invoice.findUniqueOrThrow({
    where: { id },
    include: {
      company: true,
      merchant: true,
      transactions: {
        include: {
          employee: { select: { displayId: true, name: true } },
          service: true,
        },
        orderBy: { usedDate: "asc" },
      },
    },
  });
}

function generateDetailCsv(invoice: NonNullable<InvoiceData>): Response {
  const header = [
    "請求番号",
    "対象月",
    "請求先会社",
    "発行元加盟店",
    "登録番号",
    "取引ID",
    "利用日",
    "従業員ID",
    "従業員名",
    "サービス名",
    "サービス額(税抜)",
    "ポイント数",
    "ポイント金額",
    "自己負担額",
  ];
  const rows = invoice.transactions.map((t) => [
    invoice.displayId,
    invoice.yearMonth,
    invoice.company.name,
    invoice.merchant.name,
    invoice.merchant.invoiceRegNo,
    t.displayId,
    formatDateForCsv(t.usedDate),
    t.employee.displayId,
    t.employee.name,
    t.service.name,
    t.serviceAmountYen,
    t.pointsUsed,
    t.pointsUsed * 1000,
    t.ownPaymentYen,
  ]);
  const csv = rowsToCsv([header, ...rows]);
  const filename = `${invoice.displayId}_明細.csv`;
  return csvResponse(csv, filename);
}

function generateSummaryCsv(invoice: NonNullable<InvoiceData>): Response {
  const header = [
    "請求番号",
    "対象月",
    "請求先会社",
    "発行元加盟店",
    "登録番号",
    "取引件数",
    "合計ポイント",
    "小計(税抜)",
    "消費税(10%)",
    "合計(税込)",
    "発行日",
    "支払期限",
    "ステータス",
  ];
  const row = [
    invoice.displayId,
    invoice.yearMonth,
    invoice.company.name,
    invoice.merchant.name,
    invoice.merchant.invoiceRegNo,
    invoice.transactions.length,
    invoice.totalPoints,
    invoice.subtotalYen,
    invoice.taxYen,
    invoice.totalYen,
    formatDateForCsv(invoice.issuedAt),
    formatDateForCsv(invoice.dueDate),
    invoice.status,
  ];
  const csv = rowsToCsv([header, row]);
  const filename = `${invoice.displayId}_サマリ.csv`;
  return csvResponse(csv, filename);
}

function renderInvoiceHTML(invoice: NonNullable<InvoiceData>): string {
  const { company, merchant, transactions } = invoice;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${invoice.displayId}</title>
<style>
  body { font-family: 'Yu Mincho', 'Shippori Mincho', serif; padding: 40px; color: #1a1a1a; }
  .invoice { max-width: 600px; margin: 0 auto; }
  .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #000; margin-bottom: 24px; }
  .title { font-size: 28px; letter-spacing: 0.3em; font-weight: 700; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 12px; font-family: sans-serif; }
  .meta-label { color: #888; font-size: 10px; margin-bottom: 4px; letter-spacing: 0.05em; }
  .reg-mark { display: inline-block; background: #8b2e2e; color: #fff; padding: 2px 8px; font-size: 10px; margin-left: 8px; }
  .total-box { background: #f4f1ea; border: 2px solid #1a1a1a; padding: 16px 20px; text-align: right; margin: 20px 0; }
  .total-label { font-size: 12px; color: #666; font-family: sans-serif; }
  .total-amount { font-size: 32px; font-weight: 700; color: #8b2e2e; }
  table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; margin: 16px 0; }
  th, td { padding: 8px; border: 1px solid #c9c1ae; }
  th { background: #f4f1ea; font-size: 11px; text-align: left; }
  .num { text-align: right; font-family: 'Courier New', monospace; }
  .footer { margin-top: 16px; font-size: 10px; color: #888; border-top: 1px solid #e3ddd0; padding-top: 10px; line-height: 1.7; font-family: sans-serif; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="title">請 求 書</div>
  </div>
  <div class="meta-grid">
    <div>
      <div class="meta-label">請求先</div>
      <div style="font-size:14px;font-weight:700;">${escape(company.name)} 御中</div>
      <div style="font-size:11px;margin-top:4px;color:#555;">福利厚生ポイント事業担当</div>
    </div>
    <div style="text-align:right;">
      <div class="meta-label">発行元</div>
      <div style="font-size:14px;font-weight:700;">${escape(merchant.name)}</div>
      <div style="font-size:11px;margin-top:4px;color:#555;">${escape(merchant.address ?? "")}</div>
      <div style="font-size:11px;margin-top:2px;color:#555;">
        登録番号 <strong>${escape(merchant.invoiceRegNo)}</strong><span class="reg-mark">適格</span>
      </div>
    </div>
  </div>
  <div class="meta-grid">
    <div><div class="meta-label">請求番号</div><div style="font-family:monospace;">${invoice.displayId}</div></div>
    <div><div class="meta-label">発行日</div><div style="font-family:monospace;">${formatDate(invoice.issuedAt)}</div></div>
    <div><div class="meta-label">対象期間</div><div style="font-family:monospace;">${invoice.yearMonth}</div></div>
    <div><div class="meta-label">お支払い期限</div><div style="font-family:monospace;">${formatDate(invoice.dueDate)}</div></div>
  </div>

  <div class="total-box">
    <div class="total-label">御請求金額(税込)</div>
    <div class="total-amount">${yen(invoice.totalYen)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:90px;">利用日</th>
        <th>従業員</th>
        <th>サービス</th>
        <th style="width:50px;" class="num">pt</th>
        <th style="width:90px;" class="num">金額</th>
      </tr>
    </thead>
    <tbody>
      ${transactions
        .map(
          (t) => `
        <tr>
          <td>${formatDate(t.usedDate)}</td>
          <td>${escape(t.employee.name)}<br><span style="color:#888;font-size:10px;">${t.employee.displayId}</span></td>
          <td>${escape(t.service.name)}</td>
          <td class="num">${t.pointsUsed}</td>
          <td class="num">${yen(t.pointsUsed * 1000)}</td>
        </tr>`
        )
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align:right;font-weight:700;">小計(10% 対象)</td>
        <td class="num">${invoice.totalPoints}</td>
        <td class="num">${yen(invoice.subtotalYen)}</td>
      </tr>
      <tr>
        <td colspan="4" style="text-align:right;">消費税(10%)</td>
        <td class="num">${yen(invoice.taxYen)}</td>
      </tr>
      <tr style="background:#f4f1ea;font-weight:700;">
        <td colspan="4" style="text-align:right;">合計(税込)</td>
        <td class="num">${yen(invoice.totalYen)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    ※ 本請求書は適格請求書等保存方式(インボイス制度)に対応しています。<br>
    ※ 1ポイント = 1,000円(税抜)として換算しています。<br>
    ※ ご不明点は${escape(merchant.email)}までお問い合わせください。
  </div>
</div>
<script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 10);
}
