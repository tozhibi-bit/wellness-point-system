import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { yen, getCurrentYearMonth } from "@/lib/points";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const session = await requireSuperAdmin();
  const yearMonth = getCurrentYearMonth();

  const [companies, merchants, totalEmployees, monthTx] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { employees: { where: { isActive: true, deletedAt: null } } } },
      },
      orderBy: { displayId: "asc" },
    }),
    prisma.merchant.count({ where: { isActive: true, deletedAt: null } }),
    prisma.employee.count({ where: { isActive: true, deletedAt: null } }),
    prisma.transaction.findMany({
      where: {
        usedDate: {
          gte: new Date(`${yearMonth}-01`),
          lt: new Date(yearMonth.split("-").map(Number)[0], yearMonth.split("-").map(Number)[1], 1),
        },
        status: { in: ["confirmed", "invoiced"] },
      },
      include: { company: { select: { id: true, name: true } } },
    }),
  ]);

  const totalPoints = monthTx.reduce((s, t) => s + t.pointsUsed, 0);
  const totalServiceAmount = monthTx.reduce((s, t) => s + t.serviceAmountYen, 0);
  const totalSubsidy = totalPoints * 1000;
  const byCompany = new Map<string, { name: string; points: number; count: number; serviceAmount: number }>();
  for (const t of monthTx) {
    const cur = byCompany.get(t.companyId) ?? { name: t.company.name, points: 0, count: 0, serviceAmount: 0 };
    cur.points += t.pointsUsed;
    cur.count += 1;
    cur.serviceAmount += t.serviceAmountYen;
    byCompany.set(t.companyId, cur);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        userName={session.user.name ?? "スーパー管理者"}
        subBrand="サービス管理"
        userMeta="SUPER ADMIN"
      />
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>サービス全体管理</div>
            <div style={styles.pageSub}>SUPERADMIN DASHBOARD</div>
          </div>
          <div style={styles.periodLabel}>{yearMonth} 期間</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-7">
          <SummaryBox label="登録企業数" value={`${companies.length}`} unit="社" />
          <SummaryBox label="総従業員数" value={`${totalEmployees}`} unit="名" accent="matcha" />
          <SummaryBox label="登録加盟店数" value={`${merchants}`} unit="店" accent="gold" />
          <SummaryBox label="今月の総利用金額" value={yen(totalServiceAmount)} accent="sumi" />
          <SummaryBox label="今月の総割引額" value={yen(totalSubsidy)} accent="accent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <ActionCard
            title="企業管理"
            description="企業の追加・編集・無効化"
            href="/superadmin/companies"
            count={companies.length}
            unit="社"
          />
          <ActionCard
            title="従業員管理"
            description="従業員の一覧・追加・編集"
            href="/superadmin/employees"
            count={totalEmployees}
            unit="名"
          />
          <ActionCard
            title="加盟店管理"
            description="加盟店の追加・編集・契約管理"
            href="/superadmin/merchants"
            count={merchants}
            unit="店"
          />
        </div>

        <div style={{ ...styles.card, marginBottom: 20 }}>
          <div style={styles.cardTitle}>
            <span>企業別 利用状況</span>
            <span style={styles.cardTitleSub}>BY COMPANY · {yearMonth}</span>
          </div>
          <div className="overflow-x-auto">
          <table style={{ ...styles.table, minWidth: 640 }}>
            <thead>
              <tr>
                <th style={styles.tableTh}>会社ID</th>
                <th style={styles.tableTh}>会社名</th>
                <th style={{ ...styles.tableTh, textAlign: "right" }}>従業員数</th>
                <th style={{ ...styles.tableTh, textAlign: "right" }}>補助率</th>
                <th style={{ ...styles.tableTh, textAlign: "right" }}>月次pt</th>
                <th style={{ ...styles.tableTh, textAlign: "right" }}>当月件数</th>
                <th style={{ ...styles.tableTh, textAlign: "right" }}>利用金額</th>
                <th style={{ ...styles.tableTh, textAlign: "right" }}>割引額(会社負担)</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const stats = byCompany.get(c.id) ?? { points: 0, count: 0, serviceAmount: 0 };
                return (
                  <tr key={c.id}>
                    <td style={{ ...styles.tableTd, ...styles.monoCell }}>{c.displayId}</td>
                    <td style={{ ...styles.tableTd, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{c._count.employees}</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{c.subsidyPct}%</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{c.monthlyPoints}pt</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{stats.count}件</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell }}>{yen(stats.serviceAmount)}</td>
                    <td style={{ ...styles.tableTd, ...styles.amountCell, fontWeight: 700, color: "var(--accent)" }}>
                      {yen(stats.points * 1000)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        <div style={{ ...styles.card, background: "var(--bg)", border: "1px dashed var(--line-strong)" }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--accent)" }}>📥 一括インポート</strong>
            <br />
            CSVファイルから企業・従業員・加盟店を一括で追加できます。
            <Link
              href="/superadmin/import"
              style={{ ...styles.btn, ...styles.btnAccent, ...styles.btnSm, marginLeft: 12 }}
            >
              CSVインポート画面へ →
            </Link>
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
  accent?: "accent" | "matcha" | "gold" | "sumi";
}

function SummaryBox({ label, value, unit, accent = "accent" }: SummaryBoxProps) {
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
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-mute)", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
        {value}
        {unit && (
          <span style={{ fontSize: 13, color: "var(--ink-mute)", marginLeft: 4, fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 400 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  count: number;
  unit: string;
}

function ActionCard({ title, description, href, count, unit }: ActionCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        padding: 24,
        textDecoration: "none",
        color: "inherit",
        borderTop: "3px solid var(--accent)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 18, fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>{description}</div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>
          {count}
          <span style={{ fontSize: 11, color: "var(--ink-mute)", marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 12 }}>管理する →</div>
    </Link>
  );
}
