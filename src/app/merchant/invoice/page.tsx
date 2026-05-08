import { requireMerchant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getCurrentYearMonth, yen, POINT_TO_YEN } from "@/lib/points";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import InvoiceCreator from "@/components/shared/invoice-creator";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MerchantInvoicePage() {
  const session = await requireMerchant();
  const merchantId = session.user.merchantId;
  const yearMonth = getCurrentYearMonth();
  const [year, month] = yearMonth.split("-").map(Number);

  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } });

  const contracts = await prisma.merchantContract.findMany({
    where: { merchantId, isActive: true },
    include: { company: true },
  });

  const contractsWithStats = await Promise.all(
    contracts.map(async (c) => {
      const txs = await prisma.transaction.findMany({
        where: {
          merchantId,
          companyId: c.companyId,
          usedDate: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
          status: "confirmed",
        },
        include: {
          employee: { select: { displayId: true, name: true } },
          service: true,
        },
        orderBy: { usedDate: "asc" },
      });
      const points = txs.reduce((s, t) => s + t.pointsUsed, 0);
      const subtotal = points * POINT_TO_YEN;
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal + tax;

      const existingInvoice = await prisma.invoice.findUnique({
        where: {
          companyId_merchantId_yearMonth: {
            companyId: c.companyId,
            merchantId,
            yearMonth,
          },
        },
      });

      return {
        companyId: c.companyId,
        companyName: c.company.name,
        transactions: txs.map((t) => ({
          id: t.id,
          displayId: t.displayId,
          usedDate: t.usedDate.toISOString().slice(0, 10),
          employeeName: t.employee.name,
          employeeDisplayId: t.employee.displayId,
          serviceName: t.service.name,
          pointsUsed: t.pointsUsed,
        })),
        totalPoints: points,
        subtotal,
        tax,
        total,
        existingInvoiceId: existingInvoice?.id ?? null,
        existingInvoiceStatus: existingInvoice?.status ?? null,
      };
    })
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName={merchant.name} subBrand="加盟店ポータル" />
      <main style={{ ...styles.main, maxWidth: 900 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>{yearMonth} 請求書作成</div>
            <div style={styles.pageSub}>MONTHLY INVOICE</div>
          </div>
          <Link href="/merchant" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <InvoiceCreator yearMonth={yearMonth} contracts={contractsWithStats} merchantInfo={{
          name: merchant.name,
          address: merchant.address ?? "",
          invoiceRegNo: merchant.invoiceRegNo,
        }} />

        <div style={{ marginTop: 20, padding: 14, background: "var(--bg)", border: "1px dashed var(--line-strong)", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.7 }}>
          ※ 請求書発行後、確定済みの取引はすべて「請求済」状態に変更されます。<br />
          ※ 同月内に再発行した場合、既存の請求書が更新されます。<br />
          ※ 発行された請求書は、発行元/管理者がPDFダウンロード可能です。
        </div>
      </main>
    </div>
  );
}
