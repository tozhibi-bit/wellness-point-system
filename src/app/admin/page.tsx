import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getCurrentYearMonth, yen } from "@/lib/points";
import {
  ensureMonthlyGrant,
  getCompanyEmployees,
  getCompanyTransactionsByMonth,
  getRemainingPoints,
} from "@/lib/server/queries";
import AppHeader from "@/components/shared/app-header";
import MonthNav from "@/components/shared/month-nav";
import { styles, badgeStyles, STATUS_LABELS } from "@/components/shared/styles";
import Link from "next/link";

export const dynamic = "force-dynamic";

function resolveYearMonth(ym?: string): string {
  const current = getCurrentYearMonth();
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return current;
  return ym > current ? current : ym;
}

function monthAfter(yearMonth: string): Date {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 1);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { ym?: string };
}) {
  const session = await requireAdmin();
  const currentYearMonth = getCurrentYearMonth();
  const yearMonth = resolveYearMonth(searchParams.ym);
  const isCurrentMonth = yearMonth === currentYearMonth;

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.user.companyId } });
  const employees = await getCompanyEmployees(session.user.companyId);

  // 当月のみポイント付与を保証（過去月は付与しない）
  if (isCurrentMonth) {
    await Promise.all(
      employees
        .filter((e) => e.isActive)
        .map((e) => ensureMonthlyGrant(e.id, e.companyId, yearMonth))
    );
  }

  const employeeStats = await Promise.all(
    employees.map(async (e) => {
      const points = await getRemainingPoints(e.id, yearMonth);
      const usage = await prisma.transaction.aggregate({
        where: {
          employeeId: e.id,
          usedDate: {
            gte: new Date(`${yearMonth}-01`),
            lt: monthAfter(yearMonth),
          },
          status: { in: ["confirmed", "invoiced"] },
        },
        _sum: { serviceAmountYen: true },
      });
      return {
        employee: e,
        used: points.used,
        remaining: points.remaining,
        granted: points.granted,
        usageAmount: usage._sum.serviceAmountYen ?? 0,
      };
    })
  );

  const allTx = await getCompanyTransactionsByMonth(session.user.companyId, yearMonth);
  const totalPoints = allTx.reduce((s, t) => s + t.pointsUsed, 0);
  const totalBudget = employees.filter((e) => e.isActive).length * company.monthlyPoints;
  const utilization = totalBudget > 0 ? ((totalPoints / totalBudget) * 100).toFixed(1) : "0";
  const totalCost = totalPoints * 1000;

  const merchants = await prisma.merchant.findMany({
    where: {
      contracts: {
        some: { companyId: company.id, isActive: true },
      },
    },
  });

  const merchantStats = await Promise.all(
    merchants.map(async (m) => {
      const txs = await prisma.transaction.findMany({
        where: {
          merchantId: m.id,
          companyId: company.id,
          usedDate: {
            gte: new Date(`${yearMonth}-01`),
            lt: monthAfter(yearMonth),
          },
          status: { in: ["confirmed", "invoiced"] },
        },
      });
      const points = txs.reduce((s, t) => s + t.pointsUsed, 0);
      return { merchant: m, count: txs.length, points };
    })
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        userName={session.user.name ?? "管理者"}
        subBrand="管理者ダッシュボード"
        userMeta={company.name}
      />
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>管理ダッシュボード</div>
            <div style={styles.pageSub}>{company.name} / 福利厚生ポイント管理</div>
          </div>
          <MonthNav
            yearMonth={yearMonth}
            basePath="/admin"
            currentYearMonth={currentYearMonth}
          />
        </div>

        {!isCurrentMonth && (
          <div
            style={{
              marginBottom: 20,
              padding: "10px 16px",
              background: "#fff9e6",
              border: "1px solid #e8d59a",
              borderLeft: "3px solid var(--gold)",
              fontSize: 12,
              color: "#7a6010",
            }}
          >
            過去の期間 ({yearMonth}) を表示中です。データは読み取り専用です。
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <SummaryBox label="従業員数" value={`${employees.filter((e) => e.isActive).length}`} unit="名" />
          <SummaryBox
            label="総利用ポイント"
            value={`${totalPoints}`}
            unit={`/ ${totalBudget} pt`}
            sub={`利用率 ${utilization}%`}
            accent="matcha"
          />
          <SummaryBox label="会社負担額" value={yen(totalCost)} accent="gold" />
          <SummaryBox label="提携店舗" value={`${merchants.length}`} unit="店" accent="sumi" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>従業員別 利用状況</span>
              <span style={styles.cardTitleSub}>BY EMPLOYEE</span>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>従業員</th>
                    <th style={styles.tableTh}>部署</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>使用</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>残</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>利用額</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((s) => (
                    <tr key={s.employee.id}>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>
                        <div style={{ fontWeight: 500 }}>{s.employee.name}</div>
                        <div style={{ fontSize: 10, color: "var(--ink-mute)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {s.employee.displayId}
                        </div>
                      </td>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>{s.employee.department}</td>
                      <td style={{ ...styles.tableTd, ...styles.amountCell }}>{s.used}</td>
                      <td
                        style={{
                          ...styles.tableTd,
                          ...styles.amountCell,
                          color: s.remaining === 0 ? "var(--accent)" : "var(--matcha)",
                        }}
                      >
                        {s.remaining}
                      </td>
                      <td style={{ ...styles.tableTd, ...styles.amountCell }}>{yen(s.usageAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>加盟店別 集計</span>
              <span style={styles.cardTitleSub}>BY MERCHANT</span>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableTh}>加盟店</th>
                  <th style={styles.tableTh}>カテゴリ</th>
                  <th style={{ ...styles.tableTh, textAlign: "right" }}>件数</th>
                  <th style={{ ...styles.tableTh, textAlign: "right" }}>利用pt</th>
                </tr>
              </thead>
              <tbody>
                {merchantStats.map((s) => (
                  <tr key={s.merchant.id}>
                    <td style={{ ...styles.tableTd, fontSize: 12, fontWeight: 500 }}>{s.merchant.name}</td>
                    <td style={{ ...styles.tableTd, fontSize: 12 }}>{s.merchant.category}</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{s.count}</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Link href="/admin/invoices" style={{ ...styles.btn, ...styles.btnGhost }}>
                請求書一覧 →
              </Link>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>全利用明細</span>
            <span style={styles.cardTitleSub}>{yearMonth} · {allTx.length} RECORDS</span>
          </div>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {allTx.length === 0 ? (
              <div style={styles.empty}>{yearMonth} の明細はありません</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>日付</th>
                    <th style={styles.tableTh}>ID</th>
                    <th style={styles.tableTh}>従業員</th>
                    <th style={styles.tableTh}>加盟店</th>
                    <th style={styles.tableTh}>サービス</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>pt</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>自己負担</th>
                    <th style={styles.tableTh}>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {allTx.map((t) => (
                    <tr key={t.id}>
                      <td style={{ ...styles.tableTd, ...styles.monoCell }}>
                        {t.usedDate.toISOString().slice(0, 10)}
                      </td>
                      <td style={{ ...styles.tableTd, ...styles.monoCell }}>{t.displayId}</td>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>{t.employee.name}</td>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>{t.merchant.name}</td>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>{t.service.name}</td>
                      <td style={{ ...styles.tableTd, ...styles.amountCell }}>{t.pointsUsed}</td>
                      <td style={{ ...styles.tableTd, ...styles.amountCell }}>{yen(t.ownPaymentYen)}</td>
                      <td style={styles.tableTd}>
                        <span style={badgeStyles[t.status]}>{STATUS_LABELS[t.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface SummaryBoxProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: "accent" | "matcha" | "gold" | "sumi";
}

function SummaryBox({ label, value, unit, sub, accent = "accent" }: SummaryBoxProps) {
  const accentColor = {
    accent: "var(--accent)",
    matcha: "var(--matcha)",
    gold: "var(--gold)",
    sumi: "var(--sumi)",
  }[accent];

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        padding: 20,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          color: "var(--ink-mute)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Shippori Mincho', serif",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              marginLeft: 4,
              fontFamily: "'Zen Kaku Gothic New', sans-serif",
              fontWeight: 400,
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--matcha)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
