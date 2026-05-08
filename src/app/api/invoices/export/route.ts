import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, formatDateForCsv, rowsToCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const role = session.user.role;
  if (role === "employee") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") ?? "csv-detail";
  const yearMonth = searchParams.get("yearMonth");

  const where: {
    companyId?: string;
    merchantId?: string;
    yearMonth?: string;
  } = {};

  if (role === "admin") {
    where.companyId = session.user.companyId!;
  } else if (role === "merchant") {
    where.merchantId = session.user.merchantId!;
  }

  if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) {
    where.yearMonth = yearMonth;
  }

  const invoices = await prisma.invoice.findMany({
    where,
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
    orderBy: [{ yearMonth: "desc" }, { issuedAt: "desc" }],
  });

  if (invoices.length === 0) {
    return NextResponse.json({ error: "対象の請求書がありません" }, { status: 404 });
  }

  if (format === "csv-summary") {
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
    const rows = invoices.map((inv) => [
      inv.displayId,
      inv.yearMonth,
      inv.company.name,
      inv.merchant.name,
      inv.merchant.invoiceRegNo,
      inv.transactions.length,
      inv.totalPoints,
      inv.subtotalYen,
      inv.taxYen,
      inv.totalYen,
      formatDateForCsv(inv.issuedAt),
      formatDateForCsv(inv.dueDate),
      inv.status,
    ]);
    const csv = rowsToCsv([header, ...rows]);
    const filename = yearMonth ? `請求書サマリ_${yearMonth}.csv` : `請求書サマリ_全期間.csv`;
    return csvResponse(csv, filename);
  }

  // csv-detail (default)
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
  const rows: (string | number)[][] = [];
  for (const inv of invoices) {
    for (const t of inv.transactions) {
      rows.push([
        inv.displayId,
        inv.yearMonth,
        inv.company.name,
        inv.merchant.name,
        inv.merchant.invoiceRegNo,
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
    }
  }
  const csv = rowsToCsv([header, ...rows]);
  const filename = yearMonth ? `請求書明細_${yearMonth}.csv` : `請求書明細_全期間.csv`;
  return csvResponse(csv, filename);
}
